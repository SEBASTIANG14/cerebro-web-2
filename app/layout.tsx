import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cerebro humano en 3D · Atlas interactivo',
  description:
    'Modelo tridimensional interactivo del cerebro humano con diez estructuras clave: prefrontal, amígdala, hipocampo, ganglios basales, cíngulo, ínsula, Wernicke, Broca, accumbens y área tegmental ventral.',
  openGraph: {
    title: 'Cerebro humano en 3D',
    description:
      'Explora diez estructuras cerebrales en un modelo 3D interactivo.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#0b0f16',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
