import type { ReactNode } from "react";
import type { Metadata } from 'next'
import "./globals.css";

export const metadata: Metadata = {
  title: 'hops-and-harmonies',
  description: 'My App description',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  )
}
