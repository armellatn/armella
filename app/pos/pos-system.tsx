"use client"

import { useState, useEffect, useRef } from "react"

// ---------------------------------------------------------------------
//  UI  (importés individuellement pour tree-shaking)
// ---------------------------------------------------------------------
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select } from "@/components/ui/select"
import { SelectContent } from "@/components/ui/select"
import { SelectItem } from "@/components/ui/select"
import { SelectTrigger } from "@/components/ui/select"
import { SelectValue } from "@/components/ui/select"
import { Table } from "@/components/ui/table"
import { TableBody } from "@/components/ui/table"
import { TableCell } from "@/components/ui/table"
import { TableHead } from "@/components/ui/table"
import { TableHeader } from "@/components/ui/table"
import { TableRow } from "@/components/ui/table"
import { Dialog } from "@/components/ui/dialog"
import { DialogContent } from "@/components/ui/dialog"
import { DialogDescription } from "@/components/ui/dialog"
import { DialogFooter } from "@/components/ui/dialog"
import { DialogHeader } from "@/components/ui/dialog"
import { DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

// ---------------------------------------------------------------------
//  Icônes
// ---------------------------------------------------------------------
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Printer,
  Check,
  Filter,
} from "lucide-react"

// ---------------------------------------------------------------------
//  Types & actions
// ---------------------------------------------------------------------
import {
  type CartItem,
  type Client,
  type Product,
  createSale,
} from "./actions"

// ---------------------------------------------------------------------
//  Props du composant
// ---------------------------------------------------------------------
interface POSSystemProps {
  products: Product[]
  clients: Client[]
  categories: { id: number; nom: string }[]
  marques: string[]
  puissances: string[]
  durees: string[]
}

// ---------------------------------------------------------------------
//  Composant principal
// ---------------------------------------------------------------------
export default function POSSystem({
  products,
  clients,
  categories,
  marques,
  puissances,
  durees,
}: POSSystemProps) {
  /* ------------------------------------------------------------------ */
  /*                               STATES                                */
  /* ------------------------------------------------------------------ */
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedMarque, setSelectedMarque] = useState("all")
  const [selectedPuissance, setSelectedPuissance] = useState("all")
  const [selectedDureePort, setSelectedDureePort] = useState("all")

  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedClient, setSelectedClient] = useState<number | null>(null)
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState("espèces")
  const [notes, setNotes] = useState("")
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [lastTotal, setLastTotal] = useState(0)
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // 🔍 États pour le scanner douchette
  const [scanTimeout, setScanTimeout] = useState<NodeJS.Timeout | null>(null)
  const barcodeRef = useRef("")

  /* ------------------------------------------------------------------ */
  /*                       PANIER / PRODUITS                             */
  /* ------------------------------------------------------------------ */
  const formatPrice = (price: any) =>
    (isNaN(+price) ? 0 : +price).toFixed(2)

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const total = subtotal - discount

  const addToCart = (product: Product) => {
    const existingItem = cart.find(i => i.product.id === product.id)

    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantite) {
        alert(`Stock insuffisant pour ${product.nom}`)
        return
      }
      setCart(
        cart.map(i =>
          i.product.id === product.id
            ? {
                ...i,
                quantity: i.quantity + 1,
                total: (i.quantity + 1) * +i.price,
              }
            : i
        )
      )
    } else {
      const price = parseFloat(product.prix_vente?.toString() || "0")
      setCart([
        ...cart,
        { id: Date.now(), product, quantity: 1, price, total: price },
      ])
    }
  }

  const handleScan = (scannedCode: string) => {
    const product = products.find(p => p.code_produit === scannedCode)
    if (!product) {
      alert(`Produit introuvable pour le code : ${scannedCode}`)
      return
    }
    addToCart(product)
  }

  const updateQuantity = (id: number, qty: number) => {
    const item = cart.find(i => i.id === id)
    if (!item) return
    if (qty > item.product.stock_quantite) {
      alert(`Stock insuffisant pour ${item.product.nom}`)
      return
    }
    if (qty <= 0) return removeFromCart(id)

    setCart(
      cart.map(i =>
        i.id === id
          ? { ...i, quantity: qty, total: +(qty * +i.price).toFixed(2) }
          : i
      )
    )
  }

  const removeFromCart = (id: number) =>
    setCart(cart.filter(i => i.id !== id))

  const clearCart = () => {
    setCart([])
    setSelectedClient(null)
    setDiscount(0)
    setNotes("")
  }

  /* ------------------------------------------------------------------ */
  /*                ÉCOUTE CLAVIER POUR LE LECTEUR CODE-BARRES          */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (scanTimeout) clearTimeout(scanTimeout)
      if (e.key.length > 1 && e.key !== "Enter") return

      if (e.key === "Enter") {
        const code = barcodeRef.current.trim()
        if (code) handleScan(code)
        barcodeRef.current = ""
        return
      }

      barcodeRef.current += e.key
      const timeout = setTimeout(() => {
        barcodeRef.current = ""
      }, 300)
      setScanTimeout(timeout)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [scanTimeout])

  /* ------------------------------------------------------------------ */
  /*                    FILTRE PRODUITS (inclut NOUVEAUX filtres)       */
  /* ------------------------------------------------------------------ */
  const filteredProducts = products.filter(p => {
    const q = searchTerm.toLowerCase()

    const matchesSearch =
      p.nom.toLowerCase().includes(q) ||
      p.marque?.toLowerCase().includes(q) ||
      p.code_produit.toLowerCase().includes(q)

    const matchesCategory =
      selectedCategory === "all" ||
      p.categorie_id?.toString() === selectedCategory

    const matchesMarque =
      selectedMarque === "all" || p.marque === selectedMarque

    const matchesPuissance =
      selectedPuissance === "all" || p.puissance === selectedPuissance

    const matchesDuree =
      selectedDureePort === "all" || p.duree_port === selectedDureePort

    return matchesSearch && matchesCategory && matchesMarque && matchesPuissance && matchesDuree
  })

  /* ------------------------------------------------------------------ */
  /*                       PAIEMENT & FACTURE                           */
  /* ------------------------------------------------------------------ */
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Le panier est vide")
      return
    }
    setShowPaymentDialog(true)
  }

  const handlePayment = async () => {
    setIsProcessing(true)
    try {
      const res = await createSale(
        selectedClient,
        cart,
        total,
        discount,
        paymentMethod,
        notes
      )
      if (res.success) {
        setLastTotal(total)
        setInvoiceNumber(res.invoiceNumber)
        setShowPaymentDialog(false)
        setShowSuccessDialog(true)
        clearCart()
      } else {
        alert(res.error || "Erreur lors du paiement")
      }
    } catch (err) {
      console.error(err)
      alert("Erreur lors du traitement du paiement")
    } finally {
      setIsProcessing(false)
    }
  }

  const printReceipt = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Veuillez autoriser les pop-ups pour imprimer le reçu")
      return
    }

    const client = clients.find(c => c.id === selectedClient)
    const clientName = client
      ? `${client.nom} ${client.prenom}`
      : "Client occasionnel"

    printWindow.document.write(`
      <html>
      <head>
        <title>Facture ${invoiceNumber}</title>
        <style>
          body{font-family:Arial;margin:0;padding:20px}
          .invoice-header{text-align:center;margin-bottom:30px}
          table{width:100%;border-collapse:collapse;margin-bottom:30px}
          th,td{border:1px solid #ddd;padding:8px;text-align:left}
          th{background:#f2f2f2}
          .total-row{font-weight:bold}
          @media print{button{display:none}}
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <h1>OptiStock</h1>
          <p>Boutique de lentilles de contact</p>
        </div>

        <p><strong>Facture N° :</strong> ${invoiceNumber}</p>
        <p><strong>Date :</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Client :</strong> ${clientName}</p>
        <p><strong>Mode de paiement :</strong> ${paymentMethod}</p>

        <table>
          <thead>
            <tr>
              <th>Produit</th><th>PU</th><th>Qté</th><th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${cart
              .map(
                i => `
                  <tr>
                    <td>${i.product.nom} (${i.product.marque})</td>
                    <td>${formatPrice(i.price)} TND</td>
                    <td>${i.quantity}</td>
                    <td>${formatPrice(i.total)} TND</td>
                  </tr>`
              )
              .join("")}
            <tr><td colspan="3" class="total-row">Sous-total</td><td class="total-row">${formatPrice(subtotal)} TND</td></tr>
            <tr><td colspan="3" class="total-row">Remise</td><td class="total-row">${formatPrice(discount)} TND</td></tr>
            <tr><td colspan="3" class="total-row">Total</td><td class="total-row">${formatPrice(total)} TND</td></tr>
          </tbody>
        </table>

        ${notes ? `<p><strong>Notes :</strong> ${notes}</p>` : ""}

        <button onclick="window.print();window.close();" style="display:block;margin:20px auto">Imprimer</button>
      </body>
      </html>`)

    printWindow.document.close()
    printWindow.onload = () => {
      try {
        printWindow.focus()
        printWindow.print()
      } catch (err) {
        console.error(err)
        alert("Erreur lors de l'impression")
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /*                            RENDU UI                                */
  /* ------------------------------------------------------------------ */
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* ---------------------------------------------------------------- */}
      {/*                              PRODUITS                            */}
      {/* ---------------------------------------------------------------- */}
      <div className="lg:col-span-2">
        {/* Barre de recherche */}
        <div className="mb-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-9"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-muted" : ""}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Bloc filtres */}
          {showFilters && (
            <div className="flex flex-wrap gap-4 p-2 bg-muted/50 rounded-md">
              {/* Catégorie */}
              <div className="flex-1 min-w-[170px]">
                <Label>Catégorie</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Marque */}
              <div className="flex-1 min-w-[150px]">
                <Label>Marque</Label>
                <Select
                  value={selectedMarque}
                  onValueChange={setSelectedMarque}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les marques</SelectItem>
                    {marques.map(m => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Puissance */}
              <div className="flex-1 min-w-[150px]">
                <Label>Puissance</Label>
                <Select
                  value={selectedPuissance}
                  onValueChange={setSelectedPuissance}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les puissances</SelectItem>
                    {puissances.map(p => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Durée de port */}
              <div className="flex-1 min-w-[150px]">
                <Label>Durée</Label>
                <Select
                  value={selectedDureePort}
                  onValueChange={setSelectedDureePort}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les durées</SelectItem>
                    {durees.map(d => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Grille produits */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full flex h-32 items-center justify-center text-muted-foreground">
              Aucun produit trouvé.
            </div>
          ) : (
            filteredProducts.map(p => {
              const cat = categories.find(
                c => c.id === Number(p.categorie_id)
              )
              return (
                <Button
                  key={p.id}
                  variant="outline"
                  className="h-auto flex-col items-start p-4 text-left"
                  onClick={() => addToCart(p)}
                >
                  <div className="font-medium">{p.nom}</div>
                  <div className="text-sm text-muted-foreground">
                    {p.marque}
                  </div>
                  {cat && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {cat.nom}
                    </Badge>
                  )}
                  <div className="mt-2 flex w-full justify-between">
                    <span className="text-sm">
                      {formatPrice(p.prix_vente)} TND
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Stock&nbsp;: {p.stock_quantite}
                    </span>
                  </div>
                </Button>
              )
            })
          )}
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/*                               PANIER                             */}
      {/* ---------------------------------------------------------------- */}
    <div className="flex flex-col h-screen rounded-lg border bg-card shadow-sm">

        {/* En-tête panier */}
        <div className="p-4 space-y-1.5">
          <h3 className="text-lg font-semibold">Panier</h3>
          <p className="text-sm text-muted-foreground">
            {cart.length} article(s)
          </p>
        </div>
        <Separator />

        {/* Sélection client */}
        <div className="p-4">
          <Label htmlFor="client">Client</Label>
          <Select
            value={selectedClient?.toString() || ""}
            onValueChange={v => setSelectedClient(v ? +v : null)}
          >
            <SelectTrigger id="client">
              <SelectValue placeholder="Sélectionner un client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Client occasionnel</SelectItem>
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  {c.nom} {c.prenom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tableau panier */}
        <div className="flex-1 overflow-auto p-4">
          {cart.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Le panier est vide
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-right">Qté</TableHead>
                  <TableHead className="text-right">Prix</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.map(i => (
                  <TableRow key={i.id}>
                    <TableCell>
                      <div className="font-medium">{i.product.nom}</div>
                      <div className="text-xs text-muted-foreground">
                        {i.product.marque}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            updateQuantity(i.id, i.quantity - 1)
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{i.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            updateQuantity(i.id, i.quantity + 1)
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(i.total)} TND
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500"
                        onClick={() => removeFromCart(i.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <Separator />

        {/* Totaux */}
<div className="p-4 space-y-2 sticky bottom-[72px] bg-card z-10 border-t">
          <div className="flex justify-between">
            <span>Sous-total</span>
            <span>{formatPrice(subtotal)} TND</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Remise</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={discount}
              onChange={e =>
                setDiscount(parseFloat(e.target.value) || 0)
              }
              className="h-8 w-24"
            />
            <span>TND</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatPrice(total)} TND</span>
          </div>
        </div>

        {/* Boutons panier */}
<div className="p-4 grid grid-cols-2 gap-2 sticky bottom-0 bg-card border-t z-10">
          <Button variant="outline" onClick={clearCart}>
            Annuler
          </Button>
          <Button
            onClick={handleCheckout}
            disabled={cart.length === 0}
          >
            Paiement
          </Button>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/*                    DIALOGUE DE PAIEMENT                           */}
      {/* ---------------------------------------------------------------- */}
      <Dialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finaliser la vente</DialogTitle>
            <DialogDescription>
              Choisissez le mode de paiement et ajoutez des notes.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Mode de paiement */}
            <div className="grid gap-2">
              <Label htmlFor="payment-method">Mode de paiement</Label>
              <Select
                value={paymentMethod}
                onValueChange={setPaymentMethod}
              >
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="espèces">Espèces</SelectItem>
                  <SelectItem value="carte">Carte bancaire</SelectItem>
                  <SelectItem value="chèque">Chèque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Ajouter des notes..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            {/* Récap */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Sous-total</span>
                <span>{formatPrice(subtotal)} TND</span>
              </div>
              <div className="flex justify-between">
                <span>Remise</span>
                <span>{formatPrice(discount)} TND</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatPrice(total)} TND</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
            >
              Annuler
            </Button>
            <Button onClick={handlePayment} disabled={isProcessing}>
              {isProcessing ? "Traitement..." : "Confirmer"}
              <CreditCard className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------------------------------------------------------- */}
      {/*                  DIALOGUE SUCCÈS VENTE                            */}
      {/* ---------------------------------------------------------------- */}
      <Dialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-green-600">
              <Check className="mr-2 h-5 w-5" />
              Vente réussie
            </DialogTitle>
            <DialogDescription>
              La vente a bien été enregistrée.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="mb-2">
              Facture N° : <strong>{invoiceNumber}</strong>
            </p>
            <p className="mb-4">
              Montant total :{" "}
              <strong>{formatPrice(lastTotal)} TND</strong>
            </p>

            <Button onClick={printReceipt} className="w-full mb-2">
              <Printer className="mr-2 h-4 w-4" />
              Imprimer la facture
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
