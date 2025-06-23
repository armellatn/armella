"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [barcodeSize, setBarcodeSize] = useState<string>("medium")
  const [layout, setLayout] = useState<string>("2x5")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredProducts = products.filter((p) =>
    p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code_produit.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const generateBarcodes = () => {
    return selectedProducts.map((id) => {
      const product = products.find((p) => p.id.toString() === id)
      if (!product) return null
      return {
        id: product.id,
        code: product.code_produit,
        name: product.nom,
        brand: product.marque,
      }
    }).filter(Boolean)
  }

  const barcodes = generateBarcodes()

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
  if (selectedProducts.length === 0) {
    alert("Aucun produit sélectionné.")
    return
  }

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [70, 35], // format étiquette
  })

  const canvas = document.createElement("canvas")
  canvas.width = 800
  canvas.height = 200
  const ctx = canvas.getContext("2d")
  ctx!.scale(4, 4)

  const barcodes = generateBarcodes()

  barcodes.forEach((barcode, index) => {
    if (index > 0) pdf.addPage() // Ajoute une nouvelle page à partir du 2e

    JsBarcode(canvas, barcode.code, {
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
    pdf.text(barcode.name, 35, 10, { align: "center" })
    pdf.addImage(imgData, "PNG", 5, 12, 60, 20)
  })

  pdf.autoPrint()
  window.open(pdf.output("bloburl"), "_blank")
}


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label>Produits</Label>
          <Input
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="border rounded-md p-2 h-48 overflow-y-auto space-y-1">
            {filteredProducts.map((product) => (
              <div key={product.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`product-${product.id}`}
                  checked={selectedProducts.includes(product.id.toString())}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedProducts([...selectedProducts, product.id.toString()])
                    } else {
                      setSelectedProducts(selectedProducts.filter(id => id !== product.id.toString()))
                    }
                  }}
                />
                <label htmlFor={`product-${product.id}`} className="text-sm">
                  {product.nom} ({product.code_produit})
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="size">Taille</Label>
          <select
            id="size"
            value={barcodeSize}
            onChange={(e) => setBarcodeSize(e.target.value)}
            className="w-full h-12 border rounded-md px-3"
          >
            <option value="small">Petit</option>
            <option value="medium">Moyen</option>
            <option value="large">Grand</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="layout">Disposition</Label>
          <select
            id="layout"
            value={layout}
            onChange={(e) => setLayout(e.target.value)}
            className="w-full h-12 border rounded-md px-3"
          >
            <option value="2x5">2 x 5</option>
            <option value="3x8">3 x 8</option>
            <option value="4x10">4 x 10</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={() => {
            setSelectedProducts([])
            setSearchTerm("")
          }}
          className="h-12"
          disabled={selectedProducts.length === 0}
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
