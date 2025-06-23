"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Printer, RefreshCw } from "lucide-react"
import BarcodeSVG from "@/components/ui/BarcodeSVG"
import { jsPDF } from "jspdf"
import JsBarcode from "jsbarcode"

interface Product {
  id: number
  code_produit: string
  nom: string
  marque: string
  stock_quantite: number
}

interface BarcodeGeneratorProps {
  products: Product[]
}

export default function BarcodeGenerator({ products }: BarcodeGeneratorProps) {
  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const [barcodeSize, setBarcodeSize] = useState<string>("medium")
  const [layout, setLayout] = useState<string>("2x5")
  const [searchTerm, setSearchTerm] = useState("")

  const getProduct = (id: string) => {
    return products.find((product) => product.id.toString() === id)
  }

  const filteredProducts = products.filter((p) =>
    p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code_produit.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const generateBarcodes = () => {
    if (!selectedProduct) return []

    const product = getProduct(selectedProduct)
    if (!product) return []

    return [{
      id: product.id,
      code: product.code_produit,
      name: product.nom,
      brand: product.marque,
    }]
  }

  const barcodes = generateBarcodes()
  const [cols] = layout.split("x").map(Number)

  const getSizeClass = () => {
    switch (barcodeSize) {
      case "small":
        return "w-24 h-16"
      case "large":
        return "w-48 h-32"
      default:
        return "w-36 h-24"
    }
  }

  const printAsPDF = () => {
    const product = getProduct(selectedProduct)
    if (!product) {
      alert("Aucun produit sélectionné.")
      return
    }

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [70, 35],
    })

    const canvas = document.createElement("canvas")
    canvas.width = 800
    canvas.height = 200
    const ctx = canvas.getContext("2d")
    ctx!.scale(4, 4)

    JsBarcode(canvas, product.code_produit, {
      format: "CODE128",
      displayValue: true,
      font: "monospace",
      fontSize: 14,
      width: 2.5,
      height: 40,
      margin: 6,
    })

    const imgData = canvas.toDataURL("image/png")
    pdf.setFontSize(10)
    pdf.text(product.nom, 35, 10, { align: "center" })
    const barcodeWidth = 60
    const barcodeX = (70 - barcodeWidth) / 2
    pdf.addImage(imgData, "PNG", barcodeX, 12, barcodeWidth, 20)

    pdf.autoPrint()
    window.open(pdf.output("bloburl"), "_blank")
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="product">Produit</Label>
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger id="product" className="h-12">
              <SelectValue placeholder="Sélectionner un produit" />
            </SelectTrigger>
            <SelectContent>
              <div className="p-2">
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {filteredProducts.map((product) => (
                <SelectItem key={product.id} value={product.id.toString()}>
                  {product.nom} ({product.code_produit})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedProduct && (
            <p className="text-sm text-muted-foreground mt-2">
              Quantité en stock : {getProduct(selectedProduct)?.stock_quantite  ?? "N/A"}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="size">Taille</Label>
          <Select value={barcodeSize} onValueChange={setBarcodeSize}>
            <SelectTrigger id="size" className="h-12">
              <SelectValue placeholder="Taille des codes-barres" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Petit</SelectItem>
              <SelectItem value="medium">Moyen</SelectItem>
              <SelectItem value="large">Grand</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="layout">Disposition</Label>
          <Select value={layout} onValueChange={setLayout}>
            <SelectTrigger id="layout" className="h-12">
              <SelectValue placeholder="Disposition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2x5">2 x 5</SelectItem>
              <SelectItem value="3x8">3 x 8</SelectItem>
              <SelectItem value="4x10">4 x 10</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={() => {
            setSelectedProduct("")
            setSearchTerm("")
          }}
          className="h-12"
          disabled={!selectedProduct}
        >
          <RefreshCw className="mr-2 h-5 w-5" />
          Réinitialiser
        </Button>

        <Button
          disabled={barcodes.length === 0}
          className="h-12"
          onClick={printAsPDF}
        >
          <Printer className="mr-2 h-5 w-5" />
          Imprimer {barcodes.length} code(s)-barre(s)
        </Button>
      </div>

      {barcodes.length > 0 && (
        <Card className="p-4 mt-4">
          <h3 className="text-lg font-medium mb-2">Aperçu</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 p-4 bg-white">
            {barcodes.map((barcode) => (
              <div
                key={barcode.id}
                className={`flex flex-col items-center justify-center border p-2 ${getSizeClass()}`}
              >
                <div className="text-xs font-medium truncate w-full text-center">{barcode.name}</div>
                <BarcodeSVG value={barcode.code} />
                <div className="text-xs">{barcode.code}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
