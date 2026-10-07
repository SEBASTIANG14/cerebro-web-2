'use client'

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { POR_ID } from '@/lib/estructuras'

/**
 * Sistema de coordenadas del modelo (three.js, tras la conversión Y-up de glTF):
 *   +X = derecha anatómica   +Y = superior   -Z = anterior (frente)
 * Por eso la vista por defecto se sitúa en X e Z negativos: muestra la cara
 * lateral izquierda, que es donde están las áreas de Broca y Wernicke.
 */
export const VISTA_EXTERIOR = new THREE.Vector3(-0.62, 0.26, -0.74)

/** Radio de la esfera que debe caber en pantalla, en unidades del modelo. */
const RADIO_EXTERIOR = 1.02
/** Distancia inicial: solo sirve hasta el primer fotograma, donde ya se
 *  recalcula con el aspecto real del viewport. */
export const DISTANCIA_EXTERIOR = 2.7

type Controls = { target: THREE.Vector3; update: () => void } | null

export function direccionVista(id: string): THREE.Vector3 {
  const est = POR_ID.get(id)
  if (!est) return VISTA_EXTERIOR.clone()
  const c = new THREE.Vector3(...est.geo.centro)
  // Estructura claramente lateralizada: se mira desde su propio lado.
  const lado = c.x < -0.05 ? -1 : c.x > 0.05 ? 1 : -1
  const base = new THREE.Vector3(lado * 0.78, 0.3, -0.52)
  if (c.length() > 0.01) base.addScaledVector(c.clone().normalize(), 0.5)
  return base.normalize()
}

/** Radio a encuadrar al enfocar una estructura: más pequeña, más cerca. */
export function radioEncuadre(id: string | null): number {
  if (!id) return RADIO_EXTERIOR
  const est = POR_ID.get(id)
  if (!est) return RADIO_EXTERIOR
  return THREE.MathUtils.clamp(0.42 + est.geo.radio * 1.15, 0.62, 0.98)
}

/**
 * Distancia necesaria para que una esfera de ese radio quepa en pantalla.
 * El `fov` de three.js es VERTICAL: en un móvil en vertical el campo
 * horizontal es mucho más estrecho, así que hay que alejarse bastante más.
 * Sin esto el modelo sale recortado por los lados en formato retrato.
 */
export function distanciaParaRadio(
  radio: number,
  fovGrados: number,
  aspecto: number,
): number {
  const vFov = (fovGrados * Math.PI) / 180
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * Math.max(aspecto, 0.05))
  return radio / Math.tan(Math.min(vFov, hFov) / 2)
}

type Props = {
  seleccion: string | null
  controls: React.RefObject<Controls>
  /** Cambia de valor para forzar un reencuadre (botón «Centrar vista»). */
  reencuadre: number
}

export default function CamaraAnimada({ seleccion, controls, reencuadre }: Props) {
  const { camera, size } = useThree()
  const destino = useRef({
    pos: VISTA_EXTERIOR.clone().multiplyScalar(DISTANCIA_EXTERIOR),
    mira: new THREE.Vector3(0, 0, 0),
  })

  // La animación solo manda mientras dura la transición; después devuelve
  // el control a OrbitControls (giro libre y rotación automática).
  const animando = useRef(false)

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    const dist = distanciaParaRadio(
      radioEncuadre(seleccion),
      cam.fov ?? 42,
      size.width / size.height,
    )
    animando.current = true

    // Con el paneo activado la mira puede estar lejos del origen, así que
    // el ángulo actual se mide desde la mira, no desde el centro del modelo.
    const miraActual = controls.current?.target ?? new THREE.Vector3()
    const dir = camera.position.clone().sub(miraActual).normalize()
    if (!isFinite(dir.x) || dir.lengthSq() < 0.01) dir.copy(VISTA_EXTERIOR)

    if (!seleccion) {
      // Vuelve al encuadre general conservando el ángulo actual del usuario.
      destino.current.pos.copy(dir.multiplyScalar(dist))
      destino.current.mira.set(0, 0, 0)
      return
    }
    const est = POR_ID.get(seleccion)
    if (!est) return
    // La cámara se queda fuera del cráneo y encuadra la estructura: se ve
    // dónde está, con la silueta del cerebro translúcida como referencia.
    destino.current.pos.copy(direccionVista(seleccion)).multiplyScalar(dist)
    destino.current.mira.set(...est.geo.centro)

    // En vertical (móvil) la ficha ocupa la franja inferior. Se apunta un
    // poco por debajo de la estructura para que esta suba en pantalla y no
    // quede tapada por el recuadro.
    const aspecto = size.width / size.height
    if (aspecto < 1) {
      const vFov = ((cam.fov ?? 42) * Math.PI) / 180
      const alturaVisible = 2 * dist * Math.tan(vFov / 2)
      destino.current.mira.y -= 0.19 * alturaVisible
    }
  }, [seleccion, camera, size.width, size.height, reencuadre, controls])

  useFrame((_, dt) => {
    if (!animando.current) return
    const k = 1 - Math.pow(0.004, Math.min(dt, 0.5))
    camera.position.lerp(destino.current.pos, k)
    const c = controls.current
    if (c) {
      c.target.lerp(destino.current.mira, k)
      c.update()
    } else {
      camera.lookAt(destino.current.mira)
    }
    const cerca =
      camera.position.distanceTo(destino.current.pos) < 0.012 &&
      (!c || c.target.distanceTo(destino.current.mira) < 0.012)
    if (cerca) animando.current = false
  })

  return null
}
