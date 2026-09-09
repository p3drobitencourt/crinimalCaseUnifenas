import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Criminal Case HQ',
  description: 'Sistema de Registro de Indivíduos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased min-h-screen bg-zinc-950 text-white">
        {children}
      </body>
    </html>
  )
}
