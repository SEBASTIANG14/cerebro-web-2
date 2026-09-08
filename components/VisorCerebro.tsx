'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  AdaptiveDpr,
  Environment,
  Lightformer,
  useProgress,
} from '@react-three/drei'
import * as THREE from 'three'
import ModeloCerebro from './ModeloCerebro'
import CamaraAnimada, { VISTA_EXTERIOR, DISTANCIA_EXTERIOR } from './CamaraAnimada'
import { FichaAnclada, Ficha } from './FichaEstructura'
import PanelEstructuras from './PanelEstructuras'
import { ESTRUCTURAS, POR_ID } from '@/lib/estructuras'
import { FUENTES } from '@/lib/fuentes'

type Controls = { target: THREE.Vector3; update: () => void } | null

function Cargando() {
  const { progress, active } = useProgress()
  if (!active && progress >= 100) return null
  return (
    <div className="cargando">
      <div className="cargando-barra">
        <span style={{ width: `${progress}%` }} />
      </div>
      <p>Cargando modelo anatómico… {Math.round(progress)}%</p>
    </div>
  )
}

/**
 * Entorno de iluminación construido con paneles de luz, sin depender de
 * ningún HDRI externo. Es lo que da los reflejos suaves sobre el tejido:
 * con focos direccionales solos, la superficie se ve plana y de plástico.
 */
function Estudio() {
  return (
    <Environment resolution={128} frames={1}>
      <color attach="background" args={['#11151c']} />
      <Lightformer
        intensity={0.9}
        color="#fff1e6"
        position={[-4, 4, -3]}
        rotation={[0, Math.PI / 4, 0]}
        scale={[9, 9, 1]}
      />
      <Lightformer
        intensity={0.65}
        color="#d2ddf0"
        position={[5, 1.5, 3]}
        rotation={[0, -Math.PI / 3, 0]}
        scale={[8, 8, 1]}
      />
      <Lightformer
        form="ring"
        intensity={0.45}
        color="#ffd9c4"
        position={[0, -4, 2]}
        scale={5}
      />
      <Lightformer
        intensity={0.22}
        color="#ffffff"
        position={[0, 6, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[10, 10, 1]}
      />
    </Environment>
  )
}

export default function VisorCerebro() {
  const [seleccion, setSeleccion] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [rayosX, setRayosX] = useState(false)
  const [fuentesAbiertas, setFuentesAbiertas] = useState(false)
  // La rotación automática es solo una invitación inicial: en cuanto el
  // usuario toca el modelo, se apaga y no vuelve sola.
  const [autoRotar, setAutoRotar] = useState(true)
  const [reencuadre, setReencuadre] = useState(0)
  const controls = useRef<Controls>(null)

  const estructura = seleccion ? POR_ID.get(seleccion) : undefined

  const seleccionar = useCallback((id: string | null) => {
    setSeleccion(id)
    setHover(null)
    if (id) {
      setAutoRotar(false)
      const est = POR_ID.get(id)
      if (est && est.geo.rol !== 'surface') {
        // Al seleccionar una estructura interna, encendemos rayos X para poder verla dentro
        setRayosX(true)
      } else if (est && est.geo.rol === 'surface') {
        // Al seleccionar una estructura de superficie, nos aseguramos de estar en vista normal
        setRayosX(false)
      }
    }
  }, [])

  // Mantiene sincronizado el estado entre rayos X y la selección:
  // - En vista normal no puede haber seleccionada una estructura interna.
  // - En rayos X no puede haber seleccionada un área externa de superficie.
  useEffect(() => {
    if (!rayosX && seleccion) {
      const rolSel = POR_ID.get(seleccion)?.geo.rol
      if (rolSel !== 'surface') {
        setSeleccion(null)
      }
    } else if (rayosX && seleccion) {
      const rolSel = POR_ID.get(seleccion)?.geo.rol
      if (rolSel === 'surface') {
        setSeleccion(null)
      }
    }
  }, [rayosX, seleccion])

  const volverAlExterior = useCallback(() => {
    setSeleccion(null)
    setHover(null)
    setRayosX(false)
  }, [])

  const toggleRayosX = useCallback(() => {
    setRayosX((v) => !v)
  }, [])

  const centrar = useCallback(() => {
    setReencuadre((n) => n + 1)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') volverAlExterior()
      if (e.key === 'r' || e.key === 'R') centrar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [volverAlExterior, centrar])

  return (
    <div className="visor">
      <Canvas
        dpr={[1, 2]}
        camera={{
          fov: 42,
          near: 0.02,
          far: 80,
          position: VISTA_EXTERIOR.clone()
            .multiplyScalar(DISTANCIA_EXTERIOR)
            .toArray(),
        }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 0.95
        }}
        onPointerMissed={() => seleccionar(null)}
      >
        <color attach="background" args={['#0b0f16']} />

        <Estudio />
        <hemisphereLight args={['#cfe0ff', '#241c1a', 0.05]} />
        <directionalLight position={[-3, 3.4, -2.6]} intensity={1.9} color="#fff4ec" />
        <directionalLight position={[3.2, 1.2, 2.4]} intensity={0.22} color="#cfd8ea" />
        <directionalLight position={[0.4, -2.2, 1.6]} intensity={0.1} color="#ffd9c9" />

        <Suspense fallback={null}>
          <ModeloCerebro
            seleccion={seleccion}
            hover={hover}
            rayosX={rayosX}
            onSeleccionar={seleccionar}
            onHover={setHover}
          />
          {estructura && (
            <FichaAnclada estructura={estructura} onCerrar={volverAlExterior} />
          )}
        </Suspense>

        <CamaraAnimada
          seleccion={seleccion}
          controls={controls}
          reencuadre={reencuadre}
        />
        <OrbitControls
          ref={controls as never}
          makeDefault
          enablePan
          screenSpacePanning
          enableZoom
          enableRotate
          enableDamping
          dampingFactor={0.075}
          rotateSpeed={0.8}
          zoomSpeed={0.95}
          panSpeed={0.85}
          minDistance={0.35}
          maxDistance={14}
          autoRotate={autoRotar && !seleccion}
          autoRotateSpeed={0.4}
          onStart={() => setAutoRotar(false)}
          // Ratón: izquierdo gira, central acerca, derecho desplaza.
          // Táctil: un dedo gira, dos dedos pellizcan y desplazan.
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
          touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
        />
        <AdaptiveDpr pixelated />
      </Canvas>

      <Cargando />

      <header className="cabecera">
        <h1>Cerebro humano en 3D</h1>
        <p>
          Diez estructuras clave. Arrastra para girar, rueda para acercarte y
          botón derecho (o dos dedos) para desplazar.
        </p>
      </header>

      <PanelEstructuras
        estructuras={ESTRUCTURAS}
        seleccion={seleccion}
        hover={hover}
        onSeleccionar={seleccionar}
        onHover={setHover}
      />

      <div className="barra-herramientas">
        <button
          className={rayosX ? 'btn activo' : 'btn'}
          onClick={toggleRayosX}
          aria-pressed={rayosX}
          title="Muestra las estructuras internas a través de la corteza"
        >
          <span className="btn-largo">Vista de rayos X</span>
          <span className="btn-corto">Rayos X</span>
        </button>
        <button className="btn" onClick={centrar} title="Volver al encuadre inicial (R)">
          <span className="btn-largo">Centrar vista</span>
          <span className="btn-corto">Centrar</span>
        </button>
        {seleccion && (
          <button className="btn" onClick={volverAlExterior}>
            <span className="btn-largo">← Volver al exterior</span>
            <span className="btn-corto">← Exterior</span>
          </button>
        )}
      </div>

      {/* En móvil la ficha ocupa la franja inferior en vez de flotar en 3D */}
      {estructura && (
        <div className="ficha-movil">
          <Ficha estructura={estructura} onCerrar={volverAlExterior} />
        </div>
      )}

      <footer className="pie">
        <button className="pie-toggle" onClick={() => setFuentesAbiertas((v) => !v)}>
          {fuentesAbiertas ? 'Ocultar fuentes' : 'Fuentes y referencias'}
        </button>
        {fuentesAbiertas && (
          <ul className="pie-lista">
            {FUENTES.map((f) => (
              <li key={f.id}>
                <a href={f.url} target="_blank" rel="noopener noreferrer">
                  {f.cita}
                </a>
              </li>
            ))}
            <li className="pie-nota">
              Modelo tridimensional de elaboración propia. Las proporciones y las
              posiciones siguen centroides estándar del espacio MNI152; la
              superficie es una reconstrucción con fines divulgativos, no un
              registro de resonancia magnética de un paciente concreto.
            </li>
          </ul>
        )}
      </footer>
    </div>
  )
}
