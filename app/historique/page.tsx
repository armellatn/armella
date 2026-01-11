"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { fetchHistorique, fetchHistoriqueStats } from "./actions"
import { HistoriqueEntry, ActionType, EntiteType } from "@/lib/historique"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  History,
  Search,
  RefreshCw,
  Loader2,
  Eye,
  ShoppingCart,
  Package,
  Users,
  Truck,
  CircleDollarSign,
  UserCog,
  LogIn,
  LogOut,
  ArrowLeftRight,
  Box,
  Activity,
} from "lucide-react"

// Map action types to labels and colors
const actionTypeConfig: Record<string, { label: string; color: string; icon: any }> = {
  VENTE_CREATION: { label: "Nouvelle vente", color: "bg-green-500", icon: ShoppingCart },
  VENTE_MODIFICATION: { label: "Modification vente", color: "bg-blue-500", icon: ShoppingCart },
  VENTE_SUPPRESSION: { label: "Suppression vente", color: "bg-red-500", icon: ShoppingCart },
  PRODUIT_CREATION: { label: "Nouveau produit", color: "bg-green-500", icon: Package },
  PRODUIT_MODIFICATION: { label: "Modification produit", color: "bg-blue-500", icon: Package },
  PRODUIT_SUPPRESSION: { label: "Suppression produit", color: "bg-red-500", icon: Package },
  CLIENT_CREATION: { label: "Nouveau client", color: "bg-green-500", icon: Users },
  CLIENT_MODIFICATION: { label: "Modification client", color: "bg-blue-500", icon: Users },
  CLIENT_SUPPRESSION: { label: "Suppression client", color: "bg-red-500", icon: Users },
  FOURNISSEUR_CREATION: { label: "Nouveau fournisseur", color: "bg-green-500", icon: Truck },
  FOURNISSEUR_MODIFICATION: { label: "Modification fournisseur", color: "bg-blue-500", icon: Truck },
  FOURNISSEUR_SUPPRESSION: { label: "Suppression fournisseur", color: "bg-red-500", icon: Truck },
  APPROVISIONNEMENT_CREATION: { label: "Nouvel approvisionnement", color: "bg-green-500", icon: CircleDollarSign },
  APPROVISIONNEMENT_MODIFICATION: { label: "Modification approvisionnement", color: "bg-blue-500", icon: CircleDollarSign },
  APPROVISIONNEMENT_SUPPRESSION: { label: "Suppression approvisionnement", color: "bg-red-500", icon: CircleDollarSign },
  UTILISATEUR_CREATION: { label: "Nouvel utilisateur", color: "bg-green-500", icon: UserCog },
  UTILISATEUR_MODIFICATION: { label: "Modification utilisateur", color: "bg-blue-500", icon: UserCog },
  UTILISATEUR_SUPPRESSION: { label: "Suppression utilisateur", color: "bg-red-500", icon: UserCog },
  CONNEXION: { label: "Connexion", color: "bg-cyan-500", icon: LogIn },
  DECONNEXION: { label: "Déconnexion", color: "bg-gray-500", icon: LogOut },
  RETRAIT_CREATION: { label: "Nouveau retrait", color: "bg-orange-500", icon: CircleDollarSign },
  RETRAIT_SUPPRESSION: { label: "Suppression retrait", color: "bg-red-500", icon: CircleDollarSign },
  ECHANGE_CREATION: { label: "Nouvel échange", color: "bg-purple-500", icon: ArrowLeftRight },
  COLISSIMO_CREATION: { label: "Nouveau colis", color: "bg-orange-500", icon: Box },
  COLISSIMO_MODIFICATION: { label: "Modification colis", color: "bg-blue-500", icon: Box },
  STOCK_MODIFICATION: { label: "Modification stock", color: "bg-yellow-500", icon: Package },
  AUTRE: { label: "Autre action", color: "bg-gray-500", icon: Activity },
}

const entiteTypeOptions = [
  { value: "all", label: "Toutes les entités" },
  { value: "vente", label: "Ventes" },
  { value: "produit", label: "Produits" },
  { value: "client", label: "Clients" },
  { value: "fournisseur", label: "Fournisseurs" },
  { value: "approvisionnement", label: "Approvisionnements" },
  { value: "utilisateur", label: "Utilisateurs" },
  { value: "retrait", label: "Retraits" },
  { value: "echange", label: "Échanges" },
  { value: "colissimo", label: "Colissimo" },
]

export default function HistoriquePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [entries, setEntries] = useState<HistoriqueEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10))
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "")
  const [entiteType, setEntiteType] = useState(searchParams.get("entite") || "all")
  const [dateDebut, setDateDebut] = useState(searchParams.get("dateDebut") || "")
  const [dateFin, setDateFin] = useState(searchParams.get("dateFin") || "")
  const [stats, setStats] = useState<{
    totalActions: number
    actionsAujourdhui: number
    actionsCetteSemaine: number
    topActions: { type_action: string; count: number }[]
  } | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<HistoriqueEntry | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [historiqueResult, statsResult] = await Promise.all([
        fetchHistorique({
          page,
          limit: 50,
          entiteType: entiteType !== "all" ? (entiteType as EntiteType) : undefined,
          dateDebut: dateDebut || undefined,
          dateFin: dateFin || undefined,
          search: search || undefined,
        }),
        fetchHistoriqueStats(),
      ])

      setEntries(historiqueResult.entries)
      setTotalPages(historiqueResult.totalPages)
      setTotal(historiqueResult.total)
      setStats(statsResult)
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique:", error)
    } finally {
      setLoading(false)
    }
  }, [page, entiteType, dateDebut, dateFin, search])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Update URL with filters
  useEffect(() => {
    const params = new URLSearchParams()
    if (page > 1) params.set("page", page.toString())
    if (search) params.set("search", search)
    if (entiteType !== "all") params.set("entite", entiteType)
    if (dateDebut) params.set("dateDebut", dateDebut)
    if (dateFin) params.set("dateFin", dateFin)
    const queryString = params.toString()
    router.push(`/historique${queryString ? `?${queryString}` : ""}`, { scroll: false })
  }, [page, search, entiteType, dateDebut, dateFin, router])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  const handleReset = () => {
    setSearchInput("")
    setSearch("")
    setEntiteType("all")
    setDateDebut("")
    setDateFin("")
    setPage(1)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("fr-TN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const getActionBadge = (typeAction: string) => {
    const config = actionTypeConfig[typeAction] || actionTypeConfig.AUTRE
    const Icon = config.icon
    return (
      <Badge className={`${config.color} hover:${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <History className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Historique des actions</h1>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total des actions</CardDescription>
              <CardTitle className="text-2xl">{stats.totalActions}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Aujourd&apos;hui</CardDescription>
              <CardTitle className="text-2xl">{stats.actionsAujourdhui}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Cette semaine</CardDescription>
              <CardTitle className="text-2xl">{stats.actionsCetteSemaine}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Action la plus fréquente</CardDescription>
              <CardTitle className="text-sm">
                {stats.topActions[0]
                  ? actionTypeConfig[stats.topActions[0].type_action]?.label || stats.topActions[0].type_action
                  : "-"}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Rechercher dans les descriptions..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={entiteType} onValueChange={(v) => { setEntiteType(v); setPage(1) }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type d'entité" />
                </SelectTrigger>
                <SelectContent>
                  {entiteTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={dateDebut}
                onChange={(e) => { setDateDebut(e.target.value); setPage(1) }}
                className="w-[150px]"
                placeholder="Date début"
              />

              <Input
                type="date"
                value={dateFin}
                onChange={(e) => { setDateFin(e.target.value); setPage(1) }}
                className="w-[150px]"
                placeholder="Date fin"
              />

              <Button type="submit">Rechercher</Button>
              <Button type="button" variant="ghost" onClick={handleReset}>
                Réinitialiser
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results info */}
      {!loading && (
        <p className="text-sm text-muted-foreground mb-4">
          {total} action{total > 1 ? "s" : ""} trouvée{total > 1 ? "s" : ""}
        </p>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune action enregistrée</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Date</TableHead>
                  <TableHead className="w-[200px]">Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[150px]">Utilisateur</TableHead>
                  <TableHead className="w-[80px]">Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(entry.created_at)}
                    </TableCell>
                    <TableCell>{getActionBadge(entry.type_action)}</TableCell>
                    <TableCell className="max-w-[400px] truncate">
                      {entry.description}
                    </TableCell>
                    <TableCell>{entry.utilisateur_nom || "-"}</TableCell>
                    <TableCell>
                      {(entry.donnees_avant || entry.donnees_apres) && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedEntry(entry)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                            <DialogHeader>
                              <DialogTitle>Détails de l&apos;action</DialogTitle>
                              <DialogDescription>
                                {formatDate(entry.created_at)} - {actionTypeConfig[entry.type_action]?.label || entry.type_action}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <p className="font-medium mb-1">Description</p>
                                <p className="text-sm text-muted-foreground">{entry.description}</p>
                              </div>
                              {entry.donnees_avant && (
                                <div>
                                  <p className="font-medium mb-1">Données avant</p>
                                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">
                                    {JSON.stringify(entry.donnees_avant, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {entry.donnees_apres && (
                                <div>
                                  <p className="font-medium mb-1">Données après</p>
                                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">
                                    {JSON.stringify(entry.donnees_apres, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setPage(pageNum)}
                      isActive={pageNum === page}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
