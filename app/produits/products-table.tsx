"use client"

import { useState } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, MoreHorizontal, Search, Trash } from "lucide-react"
import { type Product, deleteProduct, updateStock } from "./actions"

interface ProductsTableProps {
  products: Product[]
}

export default function ProductsTable({ products }: ProductsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [editingStockId, setEditingStockId] = useState<number | null>(null)
  const [stockValue, setStockValue] = useState<number | null>(null)

  const filteredProducts = products.filter(
    (product) =>
      product.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.marque.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code_produit.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      try {
        await deleteProduct(id)
      } catch (error) {
        console.error("Error deleting product:", error)
        alert("Erreur lors de la suppression du produit")
      }
    }
  }

  const handleStockSave = async (productId: number) => {
    if (stockValue != null) {
      await updateStock(productId, stockValue)
    }
    setEditingStockId(null)
  }

  const formatPrice = (price: any): string => {
    const numPrice = typeof price === "number" ? price : Number(price)
    return isNaN(numPrice) ? "0.00" : numPrice.toFixed(2)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un produit..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Marque</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead className="text-right">Prix de vente</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Aucun produit trouvé.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.code_produit}</TableCell>
                  <TableCell>{product.nom}</TableCell>
                  <TableCell>{product.marque}</TableCell>
                  <TableCell>{product.categorie}</TableCell>
                  <TableCell className="text-right">{formatPrice(product.prix_vente)} TND</TableCell>
                  <TableCell
                    className="text-right cursor-pointer"
                    onDoubleClick={() => {
                      setEditingStockId(product.id)
                      setStockValue(product.stock_quantite)
                    }}
                  >
                    {editingStockId === product.id ? (
                      <input
                        type="number"
                        value={stockValue ?? 0}
                        onChange={(e) => setStockValue(parseInt(e.target.value))}
                        onBlur={() => handleStockSave(product.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleStockSave(product.id)
                        }}
                        className="w-16 text-right border border-gray-300 rounded px-1 py-0.5"
                        autoFocus
                      />
                    ) : (
                      product.stock_quantite
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Ouvrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/produits/${product.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(product.id)}>
                          <Trash className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
