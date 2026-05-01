import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { Toaster } from "@/components/ui/sonner"
import { APP } from "@/lib/copy"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(APP.url),
  title: {
    default: APP.ogTitle,
    template: `%s — ${APP.name}`,
  },
  description: APP.description,
  applicationName: APP.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP.shortName,
  },
  openGraph: {
    type: "website",
    siteName: APP.name,
    title: APP.ogTitle,
    description: APP.description,
    url: APP.url,
  },
  twitter: {
    card: "summary_large_image",
    title: APP.ogTitle,
    description: APP.description,
  },
}

export const viewport: Viewport = {
  themeColor: "#ff6b35",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <Toaster richColors closeButton position="top-center" />
      </body>
    </html>
  )
}
