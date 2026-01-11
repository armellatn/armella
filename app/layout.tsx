import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

import { ThemeProvider } from "@/components/theme-provider"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"
import { getSession } from "./auth/actions"
import { UserProvider } from "@/lib/UserContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "OptiStock - Gestion de Stock et POS",
  description: "Plateforme de gestion de stock et point de vente pour boutique de lentilles de contact",
  generator: "v0.dev",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {session ? (
            <UserProvider
              initialRole={session.userRole}
              userName={session.userName}
              userId={session.userId}
            >
              <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
                  {/* ✅ Props passés explicitement */}
                  <Header userRole={session.userRole} userName={session.userName} />
                  <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/40">
                    {children}
                  </main>
                </div>
              </div>
            </UserProvider>
          ) : (
            <main>{children}</main>
          )}
        </ThemeProvider>
      </body>
    </html>
  )
}
