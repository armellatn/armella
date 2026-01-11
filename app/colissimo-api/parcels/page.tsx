"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Loader2,
  Search,
  Package,
  RefreshCw,
  AlertCircle,
  Settings,
} from "lucide-react"
import Link from "next/link"

interface Parcel {
  trackingNumber: string
  status: string
  statusCode?: string
  recipient?: string
  destination?: string
  weight?: number
  createdAt?: string
  lastUpdate?: string
}

interface ParcelsResponse {
  parcels: Parcel[]
  total: number
  page: number
  limit: number
  totalPages: number
  error?: string
}

// Status badge colors
const getStatusBadge = (status: string, statusCode?: string) => {
  const statusLower = status?.toLowerCase() || ""
  const code = statusCode?.toLowerCase() || ""

  // Delivered / Livré
  if (
    statusLower.includes("livr") ||
    statusLower.includes("deliver") ||
    code.includes("liv")
  ) {
    return <Badge className="bg-green-500 hover:bg-green-600">{status}</Badge>
  }

  // In transit / En cours
  if (
    statusLower.includes("transit") ||
    statusLower.includes("cours") ||
    statusLower.includes("envoy")
  ) {
    return <Badge className="bg-blue-500 hover:bg-blue-600">{status}</Badge>
  }

  // Returned / Retour
  if (statusLower.includes("retour") || statusLower.includes("return")) {
    return <Badge className="bg-orange-500 hover:bg-orange-600">{status}</Badge>
  }

  // Pending / En attente
  if (
    statusLower.includes("attente") ||
    statusLower.includes("pending") ||
    statusLower.includes("pris en charge")
  ) {
    return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">{status}</Badge>
  }

  // Default
  return <Badge variant="secondary">{status}</Badge>
}

export default function ColissimoParcelsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [parcels, setParcels] = useState<Parcel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "")
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10))
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [configured, setConfigured] = useState<boolean | null>(null)

  const fetchParcels = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("limit", "20")
      if (search) {
        params.set("search", search)
      }

      const response = await fetch(`/api/colissimo-api/parcels?${params}`)
      const data: ParcelsResponse = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          setConfigured(false)
          throw new Error(data.error || "API non configurée")
        }
        throw new Error(data.error || "Erreur lors du chargement")
      }

      setConfigured(true)
      setParcels(data.parcels)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchParcels()
  }, [fetchParcels])

  // Update URL when page or search changes
  useEffect(() => {
    const params = new URLSearchParams()
    if (page > 1) params.set("page", page.toString())
    if (search) params.set("search", search)
    const queryString = params.toString()
    router.push(`/colissimo-api/parcels${queryString ? `?${queryString}` : ""}`, {
      scroll: false,
    })
  }, [page, search, router])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  const handleRefresh = () => {
    fetchParcels()
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleString("fr-TN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Not configured state
  if (configured === false) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <div className="flex items-center gap-2 mb-6">
          <Package className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Colis Colissimo</h1>
        </div>

        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-semibold">API non configurée</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Veuillez configurer vos identifiants Colissimo pour accéder à vos colis.
              </p>
              <Button asChild>
                <Link href="/colissimo-api/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurer l&apos;API
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Colis Colissimo</h1>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* Search bar */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher par numéro de suivi..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading}>
              Rechercher
            </Button>
            {search && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSearchInput("")
                  setSearch("")
                  setPage(1)
                }}
              >
                Effacer
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results info */}
      {!loading && total > 0 && (
        <p className="text-sm text-muted-foreground mb-4">
          {total} colis trouvé{total > 1 ? "s" : ""}
          {search && ` pour "${search}"`}
        </p>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : parcels.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {search ? "Aucun colis trouvé pour cette recherche" : "Aucun colis"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Suivi</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Destinataire</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead className="text-right">Poids</TableHead>
                  <TableHead>Dernière MAJ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parcels.map((parcel) => (
                  <TableRow key={parcel.trackingNumber}>
                    <TableCell className="font-mono font-medium">
                      {parcel.trackingNumber}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(parcel.status, parcel.statusCode)}
                    </TableCell>
                    <TableCell>{parcel.recipient || "-"}</TableCell>
                    <TableCell>{parcel.destination || "-"}</TableCell>
                    <TableCell className="text-right">
                      {parcel.weight ? `${parcel.weight} kg` : "-"}
                    </TableCell>
                    <TableCell>{formatDate(parcel.lastUpdate)}</TableCell>
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
                  onClick={() => handlePageChange(page - 1)}
                  className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {/* Page numbers */}
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
                      onClick={() => handlePageChange(pageNum)}
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
                  onClick={() => handlePageChange(page + 1)}
                  className={
                    page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
