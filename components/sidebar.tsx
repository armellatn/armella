"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  CircleDollarSign,
  FileText,
  Home,
  Package,
  ShoppingCart,
  Truck,
  Users,
  Barcode
} from "lucide-react"
import { useUser } from "@/lib/UserContext" // 👈 CONTEXT ici
import Image from "next/image"

export default function Sidebar() {
  const pathname = usePathname()
  const { userRole } = useUser() // 👈 on récupère le rôle
  const role = userRole?.toLowerCase()

  const isAdmin = role === "admin"

  const routes = [
    {
      label: "Tableau de bord",
      icon: Home,
      href: "/",
      color: "text-sky-500",
      show: isAdmin,
    },
    {
      label: "Produits",
      icon: Package,
      href: "/produits",
      color: "text-violet-500",
      show: isAdmin,
    },
    {
      label: "Clients",
      icon: Users,
      href: "/clients",
      color: "text-pink-700",
      show: isAdmin,
    },
    {
      label: "Ventes (POS)",
      icon: ShoppingCart,
      href: "/pos",
      color: "text-orange-500",
      show: true, // toujours visible
    },
    {
      label: "Factures",
      icon: FileText,
      href: "/factures",
      color: "text-blue-500",
      show: isAdmin,
    },
    {
      label: "Fournisseurs",
      icon: Truck,
      href: "/fournisseurs",
      color: "text-emerald-500",
      show: isAdmin,
    },
    {
      label: "Approvisionnements",
      icon: CircleDollarSign,
      href: "/approvisionnements",
      color: "text-green-700",
      show: isAdmin,
    },
    {
      label: "Rapports",
      icon: BarChart3,
      href: "/rapports",
      color: "text-blue-600",
      show: isAdmin,
    },
    {
      label: "Codes-barres",
      icon: Barcode,
      href: "/codes-barres",
      color: "text-purple-600",
      show: isAdmin,
    },
  ]

  const filteredRoutes = routes.filter((route) => route.show)

  return (
    <div className="hidden border-r bg-background md:block md:w-64">
      <div className="flex h-full flex-col">
<div className="border-b px-4 py-4">
  <Link href="/" className="block relative w-full h-32">
    <Image
      src="/armella.png" // ← Assure-toi que ce fichier est dans le dossier public
      alt="Logo Armelia"
      fill
      style={{ objectFit: "contain" }}
      priority
    />
  </Link>
</div>


        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium">
            {filteredRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:text-primary text-base",
                  pathname === route.href ? "bg-muted text-primary" : "hover:bg-muted"
                )}
              >
                <route.icon className={cn("h-5 w-5", route.color)} />
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}
