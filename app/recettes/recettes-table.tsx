"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ShoppingCart, Package, Search, Store, Truck, Filter } from "lucide-react"

interface SaleDetail {
  venteId: number
  numeroFacture: string
  dateVente: string
  clientNom: string
  typeVente: string
  produitId: number
  produitNom: string
  produitCode: string
  produitMarque: string
  categorie: string
  quantite: number
  prixUnitaire: number
  montantTotal: number
}

interface RecettesTableProps {
  salesDetails: SaleDetail[]
}

type TypeVenteFilter = "all" | "boutique" | "colissimo" | "testeur"

export default function RecettesTable({ salesDetails }: RecettesTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeVenteFilter, setTypeVenteFilter] = useState<TypeVenteFilter>("all")

  const filteredData = useMemo(() => {
    let data = [...salesDetails]

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      data = data.filter(item =>
        item.produitNom.toLowerCase().includes(term) ||
        item.produitCode.toLowerCase().includes(term) ||
        item.clientNom.toLowerCase().includes(term) ||
        item.numeroFacture.toLowerCase().includes(term)
      )
    }

    // Type vente filter
    if (typeVenteFilter !== "all") {
      data = data.filter(item => item.typeVente === typeVenteFilter)
    }

    return data
  }, [salesDetails, searchTerm, typeVenteFilter])

  // Stats by type
  const stats = useMemo(() => {
    const boutique = salesDetails.filter(d => d.typeVente === "boutique")
    const colissimo = salesDetails.filter(d => d.typeVente === "colissimo")
    const testeur = salesDetails.filter(d => d.typeVente === "testeur")

    return {
      boutiqueTotal: boutique.reduce((sum, d) => sum + d.montantTotal, 0),
      boutiqueQty: boutique.reduce((sum, d) => sum + d.quantite, 0),
      colissimoTotal: colissimo.reduce((sum, d) => sum + d.montantTotal, 0),
      colissimoQty: colissimo.reduce((sum, d) => sum + d.quantite, 0),
      testeurTotal: testeur.reduce((sum, d) => sum + d.montantTotal, 0),
      testeurQty: testeur.reduce((sum, d) => sum + d.quantite, 0),
    }
  }, [salesDetails])

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "boutique":
        return <Badge variant="outline" className="text-xs border-green-500 text-green-600 bg-green-50"><Store className="h-3 w-3 mr-1" />Boutique</Badge>
      case "colissimo":
        return <Badge variant="outline" className="text-xs border-blue-500 text-blue-600 bg-blue-50"><Truck className="h-3 w-3 mr-1" />Colissimo</Badge>
      case "testeur":
        return <Badge variant="outline" className="text-xs border-purple-500 text-purple-600 bg-purple-50">Testeur</Badge>
      default:
        return <Badge variant="secondary" className="text-xs">{type}</Badge>
    }
  }

  const totalFiltered = filteredData.reduce((sum, d) => sum + d.montantTotal, 0)
  const qtyFiltered = filteredData.reduce((sum, d) => sum + d.quantite, 0)

  return (
    <div className="space-y-4">
      {/* Stats par type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTypeVenteFilter("boutique")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Store className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Boutique</p>
                <p className="text-lg font-bold text-green-600">{stats.boutiqueTotal.toFixed(2)} DT</p>
                <p className="text-xs text-muted-foreground">{stats.boutiqueQty} articles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTypeVenteFilter("colissimo")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Colissimo</p>
                <p className="text-lg font-bold text-blue-600">{stats.colissimoTotal.toFixed(2)} DT</p>
                <p className="text-xs text-muted-foreground">{stats.colissimoQty} articles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTypeVenteFilter("testeur")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Testeur</p>
                <p className="text-lg font-bold text-purple-600">{stats.testeurTotal.toFixed(2)} DT</p>
                <p className="text-xs text-muted-foreground">{stats.testeurQty} articles</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par produit, client ou facture..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={typeVenteFilter} onValueChange={(value: TypeVenteFilter) => setTypeVenteFilter(value)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type de vente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="boutique">Boutique</SelectItem>
                <SelectItem value="colissimo">Colissimo</SelectItem>
                <SelectItem value="testeur">Testeur</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{filteredData.length} ligne(s) - {qtyFiltered} article(s)</span>
        <span>Total filtré: {totalFiltered.toFixed(2)} DT</span>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Détails des ventes
          </CardTitle>
          <CardDescription>
            Liste détaillée de tous les articles vendus ce mois
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucune vente trouvée</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden md:table-cell">Facture</TableHead>
                    <TableHead className="text-center">Qté</TableHead>
                    <TableHead className="text-right">Prix Unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item, index) => (
                    <TableRow key={`${item.venteId}-${item.produitId}-${index}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.produitNom}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.produitMarque && <span>{item.produitMarque} • </span>}
                            {item.produitCode}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={item.clientNom === "Client occasionnel" ? "text-muted-foreground italic" : "font-medium"}>
                          {item.clientNom}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(item.typeVente)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                        {item.numeroFacture}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {item.quantite}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.prixUnitaire.toFixed(2)} DT
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.montantTotal.toFixed(2)} DT
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
