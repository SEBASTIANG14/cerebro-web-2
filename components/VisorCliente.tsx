'use client'

import dynamic from 'next/dynamic'

// WebGL no existe en el servidor: el visor se carga solo en el navegador.
const VisorCerebro = dynamic(() => import('./VisorCerebro'), {
  ssr: false,
  loading: () => (
    <div className="visor">
      <div className="cargando">
        <div className="cargando-barra">
          <span style={{ width: '15%' }} />
        </div>
        <p>Preparando el visor 3D…</p>
      </div>
    </div>
  ),
})

export default function VisorCliente() {
  return <VisorCerebro />
}
