import type { Metadata } from 'next'
import { Lora } from 'next/font/google'
import { Toaster } from 'sonner'
import { Providers } from '@/components/layout/Providers'
import './globals.css'

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ETA Eats — Admin Platform',
  description: 'Manage operators, buses, routes, and restaurants',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={lora.variable}>
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#FFFFFF',
                color: '#111111',
                border: '1px solid #E8E8E2',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: 500,
                boxShadow: '0 12px 28px rgba(17, 17, 17, 0.07), 0 2px 4px rgba(17, 17, 17, 0.04)',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
