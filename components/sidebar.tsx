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
import { useUser } from "@/lib/UserContext"
import Image from "next/image"
import { useEffect, useState } from "react"

export default function Sidebar() {
  const pathname = usePathname()
  const { userRole } = useUser()
  const role = userRole?.toLowerCase()
  const isAdmin = role === "admin"

  const [recetteNette, setRecetteNette] = useState<number | null>(null)

  useEffect(() => {
    if (isAdmin) {
      fetch("/recettes/api")
        .then(res => res.json())
        .then(data => {
          const nette = (data.ventes || 0) - (data.retraits || 0)
          setRecetteNette(nette)
        })
    }
  }, [isAdmin])

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
      show: true,
    },
    {
      label: "Ventes (POS)",
      icon: ShoppingCart,
      href: "/pos",
      color: "text-orange-500",
      show: true,
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
    {
      label: recetteNette !== null ? `Recette du mois: ${recetteNette} DT` : "Recette du mois",
      icon: CircleDollarSign,
      href: "/recettes",
      color: "text-yellow-600",
      show: isAdmin,
    },
    {
      label: "Retraits d'argent",
      icon: FileText,
      href: "/retraits",
      color: "text-red-600",
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
              src="/armella.png"
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
                <span className="truncate">{route.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}
