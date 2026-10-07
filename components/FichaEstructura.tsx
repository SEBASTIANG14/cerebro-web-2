'use client'

import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { Estructura } from '@/lib/estructuras'
import { URL_MODELO } from './ModeloCerebro'
import { distanciaParaRadio, radioEncuadre } from './CamaraAnimada'

/** Por debajo de esta fracción de la distancia de encuadre, el usuario se ha
 *  acercado a mirar la estructura y la etiqueta se oculta para no taparla.
 *  Reaparece un poco más lejos (histéresis), para que no parpadee. */
const OCULTAR_CERCA = 0.6
const MOSTRAR_CERCA = 0.7

/** Etiqueta con el nombre, unida a la estructura por una línea de guía.
 *  Se coloca arriba y a un lado, para no tapar la propia estructura; salta
 *  al otro lado cuando la estructura se acerca al borde izquierdo. Se
 *  desvanece cuando la cámara se acerca demasiado a la estructura. */
export function EtiquetaAnclada({ estructura }: { estructura: Estructura }) {
  const { scene } = useGLTF(URL_MODELO, '/draco/')
  const [x, y, z] = useMemo(
    () => puntoDeGuia(scene, estructura),
    [scene, estructura],
  )
  const [aLaDerecha, setALaDerecha] = useState(false)
  const punto = useMemo(() => new THREE.Vector3(), [])
  const foco = useMemo(() => new THREE.Vector3(...estructura.geo.centro), [estructura])
  const estado = useRef(false)
  const capa = useRef<HTMLDivElement>(null)
  const oculta = useRef(false)

  useFrame(({ camera, size }) => {
    punto.set(x, y, z).project(camera)
    // histéresis: evita que la etiqueta parpadee de un lado a otro
    const siguiente = estado.current ? punto.x < -0.1 : punto.x < -0.3
    if (siguiente !== estado.current) {
      estado.current = siguiente
      setALaDerecha(siguiente)
    }

    // Se compara con la distancia a la que la cámara encuadra la estructura
    // al seleccionarla: así el umbral vale igual para una pequeña que para
    // una grande.
    const encuadre = distanciaParaRadio(
      radioEncuadre(estructura.id),
      (camera as THREE.PerspectiveCamera).fov ?? 42,
      size.width / size.height,
    )
    const cerca = camera.position.distanceTo(foco) / encuadre
    const ocultar = oculta.current ? cerca < MOSTRAR_CERCA : cerca < OCULTAR_CERCA
    if (ocultar !== oculta.current && capa.current) {
      oculta.current = ocultar
      capa.current.classList.toggle('oculta', ocultar)
    }
  })

  return (
    <Html
      position={[x, y, z]}
      center={false}
      zIndexRange={[4, 0]}
      wrapperClass="etiqueta-wrapper"
      occlude={false}
    >
      <div ref={capa} key={estructura.id} className="etiqueta-capa">
        <div
          className={aLaDerecha ? 'etiqueta derecha' : 'etiqueta'}
          style={{ ['--acento' as string]: estructura.color }}
        >
          <svg
            className="etiqueta-linea"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            {/* Trazo oscuro debajo: separa la línea de una estructura del
                mismo color, como pasa con las áreas corticales grandes. */}
            {['etiqueta-linea-fondo', 'etiqueta-linea-trazo'].map((clase) => (
              <line
                key={clase}
                className={clase}
                x1={aLaDerecha ? 0 : 100}
                y1="100"
                x2={aLaDerecha ? 100 : 0}
                y2="0"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          <span className="etiqueta-punto" />
          <span className="etiqueta-texto">{estructura.nombre}</span>
        </div>
      </div>
    </Html>
  )
}

/**
 * Punto al que apunta la línea de guía: siempre sobre la propia estructura.
 * Se parte del centroide (en las bilaterales, solo del hemisferio izquierdo,
 * que es el que muestra la cámara por defecto). Si cae dentro del volumen,
 * como en una forma redondeada, se usa tal cual: así el punto queda en medio
 * desde cualquier ángulo. Si cae fuera —en el hueco de las formas curvas
 * (cíngulo, hipocampo, caudado), dentro del cuenco de una lámina cortical o
 * en la línea media entre las dos copias— se usa el vértice más cercano.
 */
function puntoDeGuia(
  scene: THREE.Object3D,
  estructura: Estructura,
): [number, number, number] {
  const centro = estructura.geo.centro
  const malla = scene.getObjectByName(estructura.id)
  if (!(malla instanceof THREE.Mesh)) return centro
  const pos = malla.geometry.attributes.position as THREE.BufferAttribute
  const soloIzquierda = Math.abs(centro[0]) <= 0.05
  const vale = (i: number) => !soloIzquierda || pos.getX(i) < 0

  const media = new THREE.Vector3()
  let n = 0
  for (let i = 0; i < pos.count; i++) {
    if (!vale(i)) continue
    media.x += pos.getX(i)
    media.y += pos.getY(i)
    media.z += pos.getZ(i)
    n++
  }
  if (n === 0) return centro
  media.divideScalar(n)
  if (estaDentro(malla.geometry, media)) return media.toArray()

  const v = new THREE.Vector3()
  const mejor = new THREE.Vector3()
  let dMin = Infinity
  for (let i = 0; i < pos.count; i++) {
    if (!vale(i)) continue
    const d = v.fromBufferAttribute(pos, i).distanceToSquared(media)
    if (d < dMin) {
      dMin = d
      mejor.copy(v)
    }
  }
  return mejor.toArray()
}

/** Un punto está dentro de una malla cerrada si un rayo que sale de él la
 *  atraviesa un número impar de veces. Se lanza en varias direcciones y
 *  decide la mayoría, por si un rayo roza una arista. */
function estaDentro(geometria: THREE.BufferGeometry, p: THREE.Vector3): boolean {
  const malla = new THREE.Mesh(
    geometria,
    new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }),
  )
  const rayo = new THREE.Raycaster()
  const direcciones = [
    new THREE.Vector3(1, 0.13, 0.07),
    new THREE.Vector3(-0.11, 1, 0.05),
    new THREE.Vector3(0.09, -0.06, 1),
  ]
  let votos = 0
  for (const d of direcciones) {
    rayo.set(p, d.normalize())
    if (rayo.intersectObject(malla).length % 2 === 1) votos++
  }
  ;(malla.material as THREE.Material).dispose()
  return votos >= 2
}

/** Contenido de la ficha de una estructura. */
export function Ficha({
  estructura,
  onCerrar,
}: {
  estructura: Estructura
  onCerrar: () => void
}) {
  return (
    <article className="ficha" style={{ ['--acento' as string]: estructura.color }}>
      <header className="ficha-cab">
        <div>
          <h2>{estructura.nombre}</h2>
          <p className="ficha-lado">{estructura.lado}</p>
        </div>
        <button className="ficha-cerrar" onClick={onCerrar} aria-label="Cerrar ficha">
          ×
        </button>
      </header>

      {estructura.funcion && <p className="ficha-funcion">{estructura.funcion}</p>}

      <div className="ficha-palabras">
        {estructura.palabrasClave.map((palabra) => (
          <span key={palabra} className="ficha-tag">
            {palabra}
          </span>
        ))}
      </div>
    </article>
  )
}
