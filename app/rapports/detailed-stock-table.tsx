"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Package, AlertTriangle, TrendingDown, Filter, ArrowUpDown, Calendar, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StockItem {
  id: number
  nom: string
  marque: string
  codeBarre: string
  stockQuantite: number
  stockMinimum: number
  prixAchat: number
  prixVente: number
  categorie: string
  dureePort: string
}

interface Category {
  id: number
  nom: string
}

interface DetailedStockTableProps {
  stockData: StockItem[]
  categories: Category[]
  brands: string[]
}

type SortField = "nom" | "stockQuantite" | "prixVente" | "categorie" | "valeurStock" | "marque"
type SortDirection = "asc" | "desc"
type StockFilter = "all" | "low" | "out" | "ok"
type DureePortFilter = "all" | "6mois" | "1an"

export default function DetailedStockTable({ stockData, categories, brands }: DetailedStockTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedBrand, setSelectedBrand] = useState<string>("all")
  const [stockFilter, setStockFilter] = useState<StockFilter>("all")
  const [dureePortFilter, setDureePortFilter] = useState<DureePortFilter>("all")
  const [sortField, setSortField] = useState<SortField>("nom")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const total = stockData.length
    const outOfStock = stockData.filter(item => item.stockQuantite === 0).length
    const lowStock = stockData.filter(item => item.stockQuantite > 0 && item.stockQuantite <= item.stockMinimum).length
    const okStock = total - outOfStock - lowStock
    const totalValue = stockData.reduce((sum, item) => sum + (item.stockQuantite * item.prixVente), 0)
    
    return { total, outOfStock, lowStock, okStock, totalValue }
  }, [stockData])

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let data = [...stockData]

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      data = data.filter(item =>
        item.nom.toLowerCase().includes(term) ||
        item.marque.toLowerCase().includes(term) ||
        item.codeBarre.toLowerCase().includes(term)
      )
    }

    // Category filter
    if (selectedCategory !== "all") {
      data = data.filter(item => item.categorie === selectedCategory)
    }

    // Brand filter (case-insensitive)
    if (selectedBrand !== "all") {
      data = data.filter(item => item.marque.toUpperCase() === selectedBrand.toUpperCase())
    }

    // Duree de port filter
    if (dureePortFilter !== "all") {
      data = data.filter(item => {
        const duree = item.dureePort.toLowerCase()
        if (dureePortFilter === "6mois") {
          return duree.includes("6") && duree.includes("mois")
        }
        if (dureePortFilter === "1an") {
          return duree.includes("1") && (duree.includes("an") || duree.includes("year"))
        }
        return true
      })
    }

    // Stock status filter
    if (stockFilter === "out") {
      data = data.filter(item => item.stockQuantite === 0)
    } else if (stockFilter === "low") {
      data = data.filter(item => item.stockQuantite > 0 && item.stockQuantite <= item.stockMinimum)
    } else if (stockFilter === "ok") {
      data = data.filter(item => item.stockQuantite > item.stockMinimum)
    }

    // Sort
    data.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case "nom":
          aValue = a.nom.toLowerCase()
          bValue = b.nom.toLowerCase()
          break
        case "marque":
          aValue = a.marque.toLowerCase()
          bValue = b.marque.toLowerCase()
          break
        case "stockQuantite":
          aValue = a.stockQuantite
          bValue = b.stockQuantite
          break
        case "prixVente":
          aValue = a.prixVente
          bValue = b.prixVente
          break
        case "categorie":
          aValue = a.categorie.toLowerCase()
          bValue = b.categorie.toLowerCase()
          break
        case "valeurStock":
          aValue = a.stockQuantite * a.prixVente
          bValue = b.stockQuantite * b.prixVente
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    return data
  }, [stockData, searchTerm, selectedCategory, selectedBrand, dureePortFilter, stockFilter, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getStockBadge = (item: StockItem) => {
    if (item.stockQuantite === 0) {
      return <Badge variant="destructive" className="text-xs">Rupture</Badge>
    }
    if (item.stockQuantite <= item.stockMinimum) {
      return <Badge variant="outline" className="text-xs border-orange-500 text-orange-600 bg-orange-50">Stock bas</Badge>
    }
    return <Badge variant="outline" className="text-xs border-green-500 text-green-600 bg-green-50">OK</Badge>
  }

  const formatPrice = (price: number): string => {
    return price.toFixed(2)
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 -ml-3 font-medium hover:bg-transparent"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className={`ml-1 h-3 w-3 ${sortField === field ? 'text-primary' : 'text-muted-foreground'}`} />
    </Button>
  )

  const resetFilters = () => {
    setSearchTerm("")
    setSelectedCategory("all")
    setSelectedBrand("all")
    setStockFilter("all")
    setDureePortFilter("all")
  }

  const hasActiveFilters = searchTerm || selectedCategory !== "all" || selectedBrand !== "all" || stockFilter !== "all" || dureePortFilter !== "all"

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStockFilter("all")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total produits</p>
                <p className="text-xl font-bold">{summaryStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStockFilter("ok")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Stock OK</p>
                <p className="text-xl font-bold text-green-600">{summaryStats.okStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStockFilter("low")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingDown className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Stock bas</p>
                <p className="text-xl font-bold text-orange-600">{summaryStats.lowStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStockFilter("out")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rupture</p>
                <p className="text-xl font-bold text-red-600">{summaryStats.outOfStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* First row: Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, marque ou code produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Second row: Filters */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2 flex-shrink-0" />
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.nom}>{cat.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger>
                  <Tag className="h-4 w-4 mr-2 flex-shrink-0" />
                  <SelectValue placeholder="Marque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes marques</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dureePortFilter} onValueChange={(value: DureePortFilter) => setDureePortFilter(value)}>
                <SelectTrigger>
                  <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                  <SelectValue placeholder="Durée de port" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toute durée</SelectItem>
                  <SelectItem value="6mois">6 mois</SelectItem>
                  <SelectItem value="1an">1 an</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={stockFilter} onValueChange={(value: StockFilter) => setStockFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="État stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les états</SelectItem>
                  <SelectItem value="ok">Stock OK</SelectItem>
                  <SelectItem value="low">Stock bas</SelectItem>
                  <SelectItem value="out">Rupture</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="outline" onClick={resetFilters} className="w-full">
                  Réinitialiser
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{filteredAndSortedData.length} produit(s) trouvé(s)</span>
        <span>Valeur totale filtrée: {filteredAndSortedData.reduce((sum, item) => sum + (item.stockQuantite * item.prixVente), 0).toFixed(2)} TND</span>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><SortButton field="nom">Produit</SortButton></TableHead>
              <TableHead className="hidden md:table-cell"><SortButton field="marque">Marque</SortButton></TableHead>
              <TableHead><SortButton field="categorie">Catégorie</SortButton></TableHead>
              <TableHead className="text-center"><SortButton field="stockQuantite">Quantité</SortButton></TableHead>
              <TableHead className="text-center hidden sm:table-cell">Min.</TableHead>
              <TableHead className="text-center">État</TableHead>
              <TableHead className="text-right hidden sm:table-cell"><SortButton field="prixVente">Prix</SortButton></TableHead>
              <TableHead className="text-right"><SortButton field="valeurStock">Valeur</SortButton></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Package className="h-8 w-8" />
                    <span>Aucun produit trouvé avec ces filtres</span>
                    {hasActiveFilters && (
                      <Button variant="link" size="sm" onClick={resetFilters}>
                        Réinitialiser les filtres
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedData.map((item) => (
                <TableRow key={item.id} className={item.stockQuantite === 0 ? "bg-red-50/50" : item.stockQuantite <= item.stockMinimum ? "bg-orange-50/50" : ""}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.nom}</div>
                      {item.codeBarre && (
                        <div className="text-xs text-muted-foreground">{item.codeBarre}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{item.marque || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs font-normal">{item.categorie}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-semibold ${item.stockQuantite === 0 ? "text-red-600" : item.stockQuantite <= item.stockMinimum ? "text-orange-600" : ""}`}>
                      {item.stockQuantite}
                    </span>
                  </TableCell>
                  <TableCell className="text-center hidden sm:table-cell text-muted-foreground">{item.stockMinimum}</TableCell>
                  <TableCell className="text-center">{getStockBadge(item)}</TableCell>
                  <TableCell className="text-right hidden sm:table-cell">{formatPrice(item.prixVente)} TND</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatPrice(item.stockQuantite * item.prixVente)} TND
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
