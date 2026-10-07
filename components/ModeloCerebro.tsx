'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { CONTEXTO, POR_ID } from '@/lib/estructuras'

export const URL_MODELO = '/cerebro.glb'
const SIN_RAYCAST = () => {}
const RAYCAST_NORMAL = THREE.Mesh.prototype.raycast

/** Aspecto objetivo de una malla en el estado actual de la interfaz. */
type Aspecto = {
  opacidad: number
  color: THREE.Color
  emision: THREE.Color
  brillo: number
}

const GRIS = new THREE.Color('#8f8b88')
/** Color de la corteza cuando se vuelve translúcida. Con el tono de tejido a
 *  baja opacidad saldría un velo pardo que ensucia lo que hay detrás; un gris
 *  claro y frío se lee como cristal esmerilado. */
const FANTASMA = new THREE.Color('#c8d2e0')
/** Cuánto color conserva un área de superficie en reposo: un matiz apenas
 *  perceptible que insinúa dónde hay algo que pulsar sin romper el realismo.
 *  Súbelo a 1 para un mapa a color permanente; bájalo a 0 para ocultarlas. */
const TINTE_REPOSO = 0.06
/** Corrección de tono del tejido, aplicada sobre el color base del modelo.
 *  Baja el nivel general y sube la saturación: sin ella la corteza sale
 *  demasiado clara y lechosa. Súbelo hacia (1,1,1) para aclararla. */
const AJUSTE_TEJIDO = new THREE.Color(0.88, 0.74, 0.71)

function aspecto(
  nombre: string,
  base: THREE.Color,
  corteza: THREE.Color,
  seleccion: string | null,
  hover: string | null,
  rayosX: boolean,
): Aspecto {
  const est = POR_ID.get(nombre)
  const rol = est?.geo.rol
  const resalte = est ? new THREE.Color(est.color) : base

  const rolSeleccion = seleccion ? POR_ID.get(seleccion)?.geo.rol : undefined
  const focoInterno = rayosX && (rolSeleccion === 'deep' || rolSeleccion === 'shell')
  const verInterior = rayosX
  const hayFoco = seleccion !== null

  // La corteza, el cerebelo, el tronco y las áreas que están SOBRE la corteza
  // forman la cáscara externa. Las áreas corticales no son "partes de dentro",
  // así que en rayos X se vuelven translúcidas igual que la corteza.
  const esCascara =
    (CONTEXTO as readonly string[]).includes(nombre) || rol === 'surface'

  if (seleccion === nombre) {
    return { opacidad: 1, color: resalte, emision: resalte, brillo: 0.55 }
  }
  // El resalte por hover no debe pasar por encima de la vista de rayos X:
  // encender un área cortical ahí taparía justo lo que se quiere ver.
  // En vista normal exterior las áreas corticales sí se resaltan con normalidad.
  if (hover === nombre && !(verInterior && esCascara)) {
    return { opacidad: 1, color: resalte, emision: resalte, brillo: 0.26 }
  }

  if (esCascara) {
    // Translúcida en cuanto hay algo que mirar por dentro (rayos X o foco interno).
    // Los parches corticales se ocultan del todo: son la propia corteza, y superponer
    // otra capa translúcida sobre ella emblanquece el interior.
    if (verInterior) {
      if (rol === 'surface') {
        return { opacidad: 0, color: FANTASMA, emision: FANTASMA, brillo: 0 }
      }
      const op = focoInterno ? 0.085 : 0.075
      return { opacidad: op, color: FANTASMA, emision: FANTASMA, brillo: 0.12 }
    }
    if (rol === 'surface') {
      const tinte = corteza.clone().lerp(resalte, TINTE_REPOSO)
      return { opacidad: 1, color: tinte, emision: tinte, brillo: 0 }
    }
    return { opacidad: 1, color: base, emision: base, brillo: 0 }
  }

  // Estructuras internas (profundas y en lámina)
  if (!verInterior) {
    return { opacidad: 0, color: base, emision: base, brillo: 0 }
  }

  if (hayFoco) {
    // Se atenúan para que el foco quede claro, pero siguen dando contexto.
    return {
      opacidad: rayosX ? 0.26 : 0.18,
      color: rayosX ? resalte : GRIS,
      emision: rayosX ? resalte : GRIS,
      brillo: 0,
    }
  }
  if (rayosX) {
    return { opacidad: 0.96, color: resalte, emision: resalte, brillo: 0.12 }
  }
  return { opacidad: 0, color: base, emision: base, brillo: 0 }
}

type Props = {
  seleccion: string | null
  hover: string | null
  rayosX: boolean
  onSeleccionar: (id: string | null) => void
  onHover: (id: string | null) => void
}

export default function ModeloCerebro({
  seleccion,
  hover,
  rayosX,
  onSeleccionar,
  onHover,
}: Props) {
  const { scene } = useGLTF(URL_MODELO, '/draco/')

  // Copia propia de la escena y de los materiales: así podemos animarlos
  // sin tocar la caché compartida de useGLTF.
  const mallas = useMemo(() => {
    const copia = scene.clone(true)
    const out: { nombre: string; malla: THREE.Mesh; base: THREE.Color }[] = []
    copia.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return
      const orig = o.material as THREE.MeshStandardMaterial
      const rol = POR_ID.get(o.name)?.geo.rol
      const esCascara =
        (CONTEXTO as readonly string[]).includes(o.name) || rol === 'surface'

      const comun = {
        color: esCascara
          ? orig.color.clone().multiply(AJUSTE_TEJIDO)
          : orig.color.clone(),
        // COLOR_0 lleva horneados la oclusión ambiental, la red vascular y
        // el moteado; multiplica al color base.
        // se activa siempre que la geometría traiga COLOR_0
        vertexColors: (o.geometry.attributes as Record<string, unknown>).color !== undefined,
        metalness: 0,
        transparent: true,
        // Solo los parches corticales son láminas abiertas y necesitan dos
        // caras. Los sólidos cerrados se dibujan a una cara: con la corteza
        // translúcida, dibujar el reverso emborrona el interior.
        side: rol === 'surface' ? THREE.DoubleSide : THREE.FrontSide,
      }

      // La cáscara externa lleva material físico con una capa de barniz: es
      // lo que da el brillo húmedo de la piamadre. Las estructuras internas
      // usan un material estándar, más barato de dibujar.
      const mat = esCascara
        ? new THREE.MeshPhysicalMaterial({
            ...comun,
            roughness: 0.55,
            // Barniz suave = brillo húmedo de la piamadre. SIN `sheen`: ese
            // término reluce justo en los ángulos rasantes, que es donde
            // están las paredes de los surcos, y los dejaba brillando en
            // claro en vez de hundidos.
            clearcoat: 0.28,
            clearcoatRoughness: 0.55,
            envMapIntensity: 0.4,
          })
        : new THREE.MeshStandardMaterial({
            ...comun,
            roughness: 0.42,
            envMapIntensity: 0.38,
          })

      o.material = mat
      out.push({ nombre: o.name, malla: o, base: mat.color.clone() })
    })
    return out
  }, [scene])

  const colorCorteza = useMemo(
    () =>
      mallas.find((m) => m.nombre === 'cortex')?.base.clone() ??
      new THREE.Color('#d2a89b'),
    [mallas],
  )

  useEffect(() => {
    return () => {
      mallas.forEach(({ malla }) => (malla.material as THREE.Material).dispose())
    }
  }, [mallas])

  useEffect(() => {
    if (!hover) {
      document.body.style.cursor = 'auto'
    }
  }, [hover])

  // Orden de dibujo: primero lo opaco del interior, la cáscara al final,
  // para que la transparencia se componga bien.
  const ordenadas = useMemo(
    () =>
      [...mallas].sort((a, b) => {
        const ca = (CONTEXTO as readonly string[]).includes(a.nombre) ? 1 : 0
        const cb = (CONTEXTO as readonly string[]).includes(b.nombre) ? 1 : 0
        return ca - cb
      }),
    [mallas],
  )

  const estado = useRef({ seleccion, hover, rayosX })
  estado.current = { seleccion, hover, rayosX }

  useFrame((_, dt) => {
    // El tope de dt se fija alto a propósito: en un equipo lento el
    // fotograma puede tardar segundos, y con un tope pequeño la transición
    // se quedaba a medias durante mucho rato. Con 0,5 s converge en uno o
    // dos fotogramas incluso ahí, y sigue siendo estable.
    const k = 1 - Math.pow(0.0025, Math.min(dt, 0.5))
    const { seleccion: sel, hover: hov, rayosX: rx } = estado.current
    for (const { nombre, malla, base } of mallas) {
      const m = malla.material as THREE.MeshStandardMaterial
      const obj = aspecto(nombre, base, colorCorteza, sel, hov, rx)
      m.opacity += (obj.opacidad - m.opacity) * k
      m.color.lerp(obj.color, k)
      m.emissive.lerp(obj.emision, k)
      m.emissiveIntensity += (obj.brillo - m.emissiveIntensity) * k
      m.depthWrite = m.opacity > 0.92
      malla.visible = m.opacity > 0.008
      malla.renderOrder = (CONTEXTO as readonly string[]).includes(nombre) ? 10 : 0
    }
  })

  const seleccionable = (nombre: string) => POR_ID.has(nombre)

  return (
    <group>
      {ordenadas.map(({ nombre, malla }) => {
        const esCascaraMalla =
          (CONTEXTO as readonly string[]).includes(nombre) ||
          POR_ID.get(nombre)?.geo.rol === 'surface'
        const esInterna = !esCascaraMalla

        // Si estamos viendo el interior (rayos X):
        // la cáscara externa NO debe interceptar raycasts para poder pinchar lo que hay dentro.
        // Si estamos en la vista normal exterior:
        // las estructuras internas NO deben interceptar raycasts para no ser clickeadas a través de la corteza.
        const bloqueaRaycast = rayosX ? esCascaraMalla : esInterna

        return (
          <mesh
            key={nombre}
            name={nombre}
            geometry={malla.geometry}
            material={malla.material}
            renderOrder={(CONTEXTO as readonly string[]).includes(nombre) ? 10 : 0}
            raycast={bloqueaRaycast ? SIN_RAYCAST : RAYCAST_NORMAL}
            onPointerOver={(e) => {
              if (bloqueaRaycast || !seleccionable(nombre)) return
              e.stopPropagation()
              onHover(nombre)
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={(e) => {
              e.stopPropagation()
              onHover(null)
              document.body.style.cursor = 'auto'
            }}
            onClick={(e) => {
              if (bloqueaRaycast) return
              e.stopPropagation()
              onSeleccionar(seleccionable(nombre) ? nombre : null)
            }}
          />
        )
      })}
    </group>
  )
}

useGLTF.preload(URL_MODELO, '/draco/')
