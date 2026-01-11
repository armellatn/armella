"use client"

import { useState, useEffect, useRef } from "react"

/* ---------------------------------------------------------------------
   UI (importés individuellement pour le tree-shaking)
---------------------------------------------------------------------- */
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import ClientSelectorDialog from "@/components/client-selector-dialog"

/* ---------------------------------------------------------------------
   Icônes
---------------------------------------------------------------------- */
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

/* ---------------------------------------------------------------------
   Types & actions
---------------------------------------------------------------------- */
import {
  type CartItem,
  type Client,
  type Product,
  type SaleType,
  createSale,
} from "./actions"
import { useUser } from "@/lib/UserContext"

/* ---------------------------------------------------------------------
   Props
---------------------------------------------------------------------- */
interface POSSystemProps {
  products: Product[]
  clients: Client[]
  categories: { id: number; nom: string }[]
  marques: string[]
  puissances: string[]
  durees: string[]
}

/* ---------------------------------------------------------------------
   Composant principal
---------------------------------------------------------------------- */
export default function POSSystem({
  products,
  clients,
  categories,
  marques,
  puissances,
  durees,
}: POSSystemProps) {
  /* ----------------------- USER ----------------------- */
  const { userId, userName } = useUser()

  /* ----------------------- STATES ----------------------- */
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedMarque, setSelectedMarque] = useState("all")
  const [selectedPuissance, setSelectedPuissance] = useState("all")
  const [selectedDureePort, setSelectedDureePort] = useState("all")

  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedClient, setSelectedClient] = useState<number | null>(null)
  const [discount, setDiscount] = useState(0)

  const [paymentMethod, setPaymentMethod] = useState("espèces")
  const [saleType, setSaleType] = useState<SaleType>("boutique") // ← nouveau
  const [notes, setNotes] = useState("")

  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [lastTotal, setLastTotal] = useState(0)
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showClientDialog, setShowClientDialog] = useState(false)

  /* Scanner douchette */
  const [scanTimeout, setScanTimeout] = useState<NodeJS.Timeout | null>(null)
  const barcodeRef = useRef("")

  /* ----------------------- HELPERS ---------------------- */
  const formatPrice = (p: any) => (isNaN(+p) ? 0 : +p).toFixed(2)
  const subtotal = cart.reduce((s, i) => s + i.total, 0)
  const total = subtotal - discount

  /* Remise 100 % automatique si “testeur” */
  const handleSaleTypeChange = (value: SaleType) => {
    setSaleType(value)
    if (value === "testeur") setDiscount(subtotal)
    else if (discount === subtotal) setDiscount(0)
  }

  useEffect(() => {
    if (saleType === "testeur") setDiscount(subtotal)
  }, [subtotal, saleType])

  /* ----------------------- PANIER ----------------------- */
  const addToCart = (product: Product) => {
    const existing = cart.find(i => i.product.id === product.id)
    if (existing) {
      if (existing.quantity >= product.stock_quantite) {
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
            : i,
        ),
      )
    } else {
      const price = parseFloat(product.prix_vente?.toString() || "0")
      setCart([
        ...cart,
        { id: Date.now(), product, quantity: 1, price, total: price },
      ])
    }
  }

  const updateQuantity = (id: number, qty: number) => {
    const item = cart.find(i => i.id === id)
    if (!item) return
    if (qty > item.product.stock_quantite) {
      alert(`Stock insuffisant pour ${item.product.nom}`)
      return
    }
    if (qty <= 0) return setCart(cart.filter(i => i.id !== id))
    setCart(
      cart.map(i =>
        i.id === id
          ? { ...i, quantity: qty, total: +(qty * +i.price).toFixed(2) }
          : i,
      ),
    )
  }

  const clearCart = () => {
    setCart([])
    setSelectedClient(null)
    setDiscount(0)
    setNotes("")
    setSaleType("boutique")
  }

  /* ---------------------- SCAN BARCODE ------------------ */
  const handleScan = (code: string) => {
    const p = products.find(pr => pr.code_produit === code)
    if (!p) return alert(`Produit introuvable : ${code}`)
    addToCart(p)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (scanTimeout) clearTimeout(scanTimeout)
      if (e.key.length > 1 && e.key !== "Enter") return

      if (e.key === "Enter") {
        const code = barcodeRef.current.trim()
        if (code) handleScan(code)
        barcodeRef.current = ""
        return
      }

      barcodeRef.current += e.key
      setScanTimeout(
        setTimeout(() => {
          barcodeRef.current = ""
        }, 300),
      )
    }

    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [scanTimeout])

  /* ----------------------- FILTRES ---------------------- */
  const filteredProducts = products.filter(p => {
    const q = searchTerm.toLowerCase()
    const s =
      p.nom.toLowerCase().includes(q) ||
      p.marque?.toLowerCase().includes(q) ||
      p.code_produit.toLowerCase().includes(q)
    const c =
      selectedCategory === "all" ||
      p.categorie_id?.toString() === selectedCategory
    const m = selectedMarque === "all" || p.marque === selectedMarque
    const pow = selectedPuissance === "all" || p.puissance === selectedPuissance
    const d = selectedDureePort === "all" || p.duree_port === selectedDureePort
    return s && c && m && pow && d
  })

  /* ---------------------- CHECKOUT ---------------------- */
  const handlePayment = async () => {
    setIsProcessing(true)
    try {
      const res = await createSale(
        selectedClient,
        cart,
        subtotal,  // ← Montant AVANT remise (pas total qui est déjà réduit)
        discount,
        paymentMethod,
        notes,
        saleType,
        userId || undefined,
        userName || undefined,
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
    } catch (e) {
      console.error(e)
      alert("Erreur lors du paiement")
    } finally {
      setIsProcessing(false)
    }
  }

  const printReceipt = () => {
    const w = window.open("", "_blank")
    if (!w) return alert("Autorisez les pop-ups pour imprimer")
    const client = clients.find(c => c.id === selectedClient)
    w.document.write(`
      <html><head><title>${invoiceNumber}</title>
      <style>
        body{font-family:Arial;margin:0;padding:20px}
        table{width:100%;border-collapse:collapse;margin-bottom:30px}
        th,td{border:1px solid #ddd;padding:6px;text-align:left}
        th{background:#f2f2f2} .total{font-weight:bold}
        @media print{button{display:none}}
      </style></head><body>
      <h2>OptiStock – Facture ${invoiceNumber}</h2>
      <p>Date : ${new Date().toLocaleDateString()}</p>
      <p>Client : ${client ? `${client.nom} ${client.prenom}` : "Occasionnel"}</p>
      <p>Mode de paiement : ${paymentMethod}</p>
      <p>Type de vente : ${saleType}</p>
      <table>
        <thead><tr><th>Produit</th><th>PU</th><th>Qté</th><th>Total</th></tr></thead>
        <tbody>
          ${cart
            .map(
              i => `<tr>
                      <td>${i.product.nom}</td>
                      <td>${formatPrice(i.price)} TND</td>
                      <td>${i.quantity}</td>
                      <td>${formatPrice(i.total)} TND</td>
                    </tr>`,
            )
            .join("")}
          <tr><td colspan="3" class="total">Sous-total</td><td class="total">${formatPrice(
            subtotal,
          )} TND</td></tr>
          <tr><td colspan="3" class="total">Remise</td><td class="total">${formatPrice(
            discount,
          )} TND</td></tr>
          <tr><td colspan="3" class="total">Total</td><td class="total">${formatPrice(
            total,
          )} TND</td></tr>
        </tbody>
      </table>
      ${notes ? `<p>Notes : ${notes}</p>` : ""}
      <button onclick="window.print();window.close()">Imprimer</button>
      </body></html>`)
    w.document.close()
  }

  /* ----------------------- RENDU UI --------------------- */
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* PRODUITS */}
      <div className="lg:col-span-2">
        {/* Barre de recherche + filtre */}
        <div className="mb-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit…"
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

              {/* Durée */}
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
              const cat = categories.find(c => c.id === Number(p.categorie_id))
              return (
                <Button
                  key={p.id}
                  variant="outline"
                  className="h-auto flex-col items-start p-4 text-left"
                  onClick={() => addToCart(p)}
                >
                  <div className="font-medium">{p.nom}</div>
                  <div className="text-sm text-muted-foreground">{p.marque}</div>
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

      {/* PANIER */}
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
          <Label>Client</Label>
          <Button
            variant="outline"
            onClick={() => setShowClientDialog(true)}
            className="w-full mt-2"
          >
            {selectedClient
              ? `${clients.find(c => c.id === selectedClient)?.nom} ${
                  clients.find(c => c.id === selectedClient)?.prenom
                }`
              : "Sélectionner ou ajouter un client"}
          </Button>
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
                          onClick={() => updateQuantity(i.id, i.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{i.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(i.id, i.quantity + 1)}
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
                        onClick={() =>
                          setCart(cart.filter(c => c.id !== i.id))
                        }
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
              onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
              className="h-8 w-24"
              disabled={saleType === "testeur"} /* ←  */
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
          <Button onClick={() => setShowPaymentDialog(true)} disabled={!cart.length}>
            Paiement
          </Button>
        </div>
      </div>

      {/* DIALOGUE DE PAIEMENT */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finaliser la vente</DialogTitle>
            <DialogDescription>
              Choisissez le mode et le type de vente, ajoutez des notes.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Mode de paiement */}
            <div className="grid gap-2">
              <Label>Mode de paiement</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="espèces">Espèces</SelectItem>
                  <SelectItem value="carte">Carte bancaire</SelectItem>
                  <SelectItem value="chèque">Chèque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type de vente */}
            <div className="grid gap-2">
              <Label>Type de vente</Label>
              <Select value={saleType} onValueChange={handleSaleTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boutique">Boutique</SelectItem>
                  <SelectItem value="colissimo">Colissimo</SelectItem>
                  <SelectItem value="testeur">Testeur (100 % remise)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Ajouter des notes…"
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
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handlePayment} disabled={isProcessing}>
              {isProcessing ? "Traitement…" : "Confirmer"}
              <CreditCard className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOGUE SUCCÈS */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-green-600">
              <Check className="mr-2 h-5 w-5" />
              Vente réussie
            </DialogTitle>
            <DialogDescription>La vente a bien été enregistrée.</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="mb-2">
              Facture N° : <strong>{invoiceNumber}</strong>
            </p>
            <p className="mb-4">
              Montant total : <strong>{formatPrice(lastTotal)} TND</strong>
            </p>
            <Button onClick={printReceipt} className="w-full mb-2">
              <Printer className="mr-2 h-4 w-4" />
              Imprimer la facture
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOGUE SÉLECTEUR CLIENT */}
      <ClientSelectorDialog
        open={showClientDialog}
        onClose={() => setShowClientDialog(false)}
        onSelectClient={(client: Client) => {
          setSelectedClient(client.id)
          if (!clients.find(c => c.id === client.id)) clients.push(client)
        }}
      />
    </div>
  )
}
