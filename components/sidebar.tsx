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
  Barcode,
  RefreshCcw,
  CalendarDays,                // ← nouvelle icône
  Settings,
  Globe,
  History,
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

  /* ---- Calcul recette nette ---- */
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

  /* ----------- Navigation ----------- */
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
    /* ---------- NOUVELLE ENTRÉE ---------- */
    {
      label: "Ventes aujourd’hui",
      icon: CalendarDays,
      href: "/ventes-aujourdhui",
      color: "text-orange-400",
      show: true,      // → mets isAdmin si tu veux restreindre
    },
    /* ------------------------------------ */
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
      label:
        recetteNette !== null
          ? `Recette du mois: ${recetteNette} DT`
          : "Recette du mois",
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
    {
      label: "Échanges",
      icon: RefreshCcw,
      href: "/echanges",
      color: "text-indigo-600",
      show: true,
    },
    {
      label: "Colissimo",
      icon: Truck,
      href: "/colissimo",
      color: "text-orange-600",
      show: true,
    },
    {
      label: "Historique",
      icon: History,
      href: "/historique",
      color: "text-slate-600",
      show: isAdmin,
    },
    // ---- ColissimoAPI Section (hidden for now) ----
    // {
    //   label: "ColissimoAPI - Colis",
    //   icon: Globe,
    //   href: "/colissimo-api/parcels",
    //   color: "text-cyan-600",
    //   show: isAdmin,
    // },
    // {
    //   label: "ColissimoAPI - Paramètres",
    //   icon: Settings,
    //   href: "/colissimo-api/settings",
    //   color: "text-cyan-500",
    //   show: isAdmin,
    // },
  ]

  const filtered = routes.filter(r => r.show)

  return (
    <div className="hidden md:block md:w-64 border-r bg-background">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="border-b px-4 py-4">
          <Link href="/" className="relative block h-32 w-full">
            <Image
              src="/armella.png"
              alt="Logo Armelia"
              fill
              style={{ objectFit: "contain" }}
              priority
            />
          </Link>
        </div>

        {/* Liens */}
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium">
            {filtered.map(r => (
              <Link
                key={r.href}
                href={r.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:text-primary text-base",
                  pathname === r.href
                    ? "bg-muted text-primary"
                    : "hover:bg-muted",
                )}
              >
                <r.icon className={cn("h-5 w-5", r.color)} />
                <span className="truncate">{r.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}
