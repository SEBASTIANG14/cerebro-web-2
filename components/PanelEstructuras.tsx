'use client'

import type { Estructura } from '@/lib/estructuras'

type Props = {
  estructuras: Estructura[]
  seleccion: string | null
  hover: string | null
  onSeleccionar: (id: string | null) => void
  onHover: (id: string | null) => void
}

export default function PanelEstructuras({
  estructuras,
  seleccion,
  hover,
  onSeleccionar,
  onHover,
}: Props) {
  return (
    <nav className="panel" aria-label="Estructuras del cerebro">
      <p className="panel-titulo">Estructuras</p>
      <ul>
        {estructuras.map((e) => {
          const activa = seleccion === e.id
          return (
            <li key={e.id}>
              <button
                className={
                  'panel-item' +
                  (activa ? ' activa' : '') +
                  (hover === e.id && !activa ? ' resaltada' : '')
                }
                style={{ ['--acento' as string]: e.color }}
                onClick={() => onSeleccionar(activa ? null : e.id)}
                onMouseEnter={() => onHover(e.id)}
                onMouseLeave={() => onHover(null)}
                aria-current={activa}
              >
                <span className="panel-punto" />
                <span className="panel-nombre">{e.nombre}</span>
                {e.lado === 'Hemisferio izquierdo' && (
                  <span className="panel-lado" title="Solo en el hemisferio izquierdo">
                    izq
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
