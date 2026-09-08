'use client'

import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { Estructura } from '@/lib/estructuras'

/** Recuadro flotante anclado junto a la estructura (escritorio).
 *  Salta al lado contrario cuando el ancla se acerca al borde derecho, para
 *  no taparle la estructura al usuario. */
export function FichaAnclada({
  estructura,
  onCerrar,
}: {
  estructura: Estructura
  onCerrar: () => void
}) {
  const [x, y, z] = estructura.geo.ancla
  const [aLaIzquierda, setALaIzquierda] = useState(false)
  const punto = useMemo(() => new THREE.Vector3(), [])
  const estado = useRef(false)

  useFrame(({ camera }) => {
    punto.set(x, y, z).project(camera)
    // histéresis: evita que el recuadro parpadee de un lado a otro
    const siguiente = estado.current ? punto.x > -0.06 : punto.x > 0.14
    if (siguiente !== estado.current) {
      estado.current = siguiente
      setALaIzquierda(siguiente)
    }
  })

  return (
    <Html
      position={[x, y, z]}
      center={false}
      zIndexRange={[80, 10]}
      className="ancla-ficha"
      wrapperClass="ancla-wrapper"
      occlude={false}
    >
      <div className={aLaIzquierda ? 'callout izquierda' : 'callout'}>
        <span className="callout-punto" style={{ background: estructura.color }} />
        <span className="callout-linea" style={{ background: estructura.color }} />
        <Ficha estructura={estructura} onCerrar={onCerrar} />
      </div>
    </Html>
  )
}

/** Contenido de la ficha. Se reutiliza en el panel inferior móvil. */
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
