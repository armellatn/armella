"use client"

import { useState, useRef, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  createEchange,
  deleteEchange,
  getEchangeDetails,
  getProductByBarcode,
} from "./actions"
import type { EchangeRow, DetailEchangeInput, TypeOperation, TypeVenteOrigine } from "./actions"
import { useUser } from "@/lib/UserContext"

/* ── UI ── */
import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { Label }    from "@/components/ui/label"
import { Badge }    from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

/* ── Icons ── */
import {
  Barcode, RefreshCcw, Undo2, Trash2, Search,
  ArrowDownToLine, ArrowUpFromLine, Check, X,
  ChevronDown, ChevronUp, AlertCircle, TrendingDown, TrendingUp, Minus,
  ShoppingBag, Truck,
} from "lucide-react"

/* ─────────────────── Types ─────────────────── */

interface ScannedProduct {
  id: number
  code_produit: string
  nom: string
  marque: string
  prix_vente: number
  stock_quantite: number
}

interface Client {
  id: number
  nom: string
  prenom: string
  telephone: string
}

interface Props {
  echanges: EchangeRow[]
  clients:  Client[]
  stats: {
    totalCount: number
    retoursCount: number
    echangesCount: number
    boutiqueCount: number
    colissimoCount: number
    totalRetour: number
    totalRemplacement: number
    totalNet: number
    netBoutique: number
    netColissimo: number
  }
}

/* ─────────────────── Component ─────────────────── */

export default function EchangesClient({ echanges, clients, stats }: Props) {
  const router  = useRouter()
  const { userId, userName } = useUser()

  /* ── Mode ── */
  const [mode, setMode] = useState<TypeOperation>("retour")
  const [typeVente, setTypeVente] = useState<TypeVenteOrigine>("boutique")

  /* ── Scanner states ── */
  const [barcodeRetour,  setBarcodeRetour]  = useState("")
  const [barcodeSortie,  setBarcodeSortie]  = useState("")
  const [scanErrorRetour, setScanErrorRetour] = useState("")
  const [scanErrorSortie, setScanErrorSortie] = useState("")

  /* ── Scanned products ── */
  const [prodRetour,  setProdRetour]  = useState<ScannedProduct | null>(null)
  const [prodSortie,  setProdSortie]  = useState<ScannedProduct | null>(null)
  const [qtyRetour,   setQtyRetour]   = useState(1)
  const [qtySortie,   setQtySortie]   = useState(1)

  /* ── Form fields ── */
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [methodePaiement,  setMethodePaiement]  = useState("espèces")
  const [notes,            setNotes]            = useState("")
  const [isSubmitting,     setIsSubmitting]      = useState(false)
  const [formError,        setFormError]         = useState("")
  const [successMsg,       setSuccessMsg]        = useState("")

  /* ── History ── */
  const [histSearch,   setHistSearch]   = useState("")
  const [expandedId,   setExpandedId]   = useState<number | null>(null)
  const [expandedDetails, setExpandedDetails] = useState<any[]>([])
  const [loadingDetails,  setLoadingDetails]  = useState(false)
  const [deleteId,     setDeleteId]     = useState<number | null>(null)

  /* ── Refs ── */
  const inputRetourRef = useRef<HTMLInputElement>(null)
  const inputSortieRef = useRef<HTMLInputElement>(null)

  /* ─── Computed financials ─── */
  const montantRetour      = (prodRetour?.prix_vente ?? 0) * qtyRetour
  const montantRemplacement = mode === "echange" ? (prodSortie?.prix_vente ?? 0) * qtySortie : 0
  const montantNet         = montantRetour - montantRemplacement
  // montantNet > 0 → store refunds client (recette ↓)
  // montantNet < 0 → client pays extra (recette ↑)
  // montantNet = 0 → no financial impact

  const fmt = (n: number) => n.toFixed(2)

  /* ─── Barcode lookup ─── */
  const lookupBarcode = useCallback(async (
    code: string,
    setProduct: (p: ScannedProduct | null) => void,
    setError: (e: string) => void,
    setBarcode: (v: string) => void,
  ) => {
    if (!code.trim()) return
    setError("")
    const found = await getProductByBarcode(code.trim())
    if (!found) {
      setError(`Produit introuvable : « ${code.trim()} »`)
      setProduct(null)
    } else {
      setProduct(found)
      setBarcode("")
    }
  }, [])

  const handleRetourBarcode = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      lookupBarcode(barcodeRetour, setProdRetour, setScanErrorRetour, setBarcodeRetour)
      if (mode === "echange") setTimeout(() => inputSortieRef.current?.focus(), 100)
    }
  }

  const handleSortieBarcode = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      lookupBarcode(barcodeSortie, setProdSortie, setScanErrorSortie, setBarcodeSortie)
    }
  }

  /* ─── Reset form ─── */
  const resetForm = () => {
    setBarcodeRetour(""); setScanErrorRetour(""); setProdRetour(null); setQtyRetour(1)
    setBarcodeSortie(""); setScanErrorSortie(""); setProdSortie(null); setQtySortie(1)
    setSelectedClientId(null); setMethodePaiement("espèces"); setNotes("")
    setFormError(""); setSuccessMsg("")
    setTimeout(() => inputRetourRef.current?.focus(), 100)
  }

  const switchMode = (m: TypeOperation) => { setMode(m); resetForm() }
  const switchTypeVente = (t: TypeVenteOrigine) => { setTypeVente(t); resetForm() }

  /* ─── Submit ─── */
  const handleSubmit = async () => {
    setFormError(""); setSuccessMsg("")
    if (!prodRetour) { setFormError("Scannez le produit à retourner."); return }
    if (mode === "echange" && !prodSortie) {
      setFormError("Scannez le produit à donner en remplacement."); return
    }
    if (mode === "echange" && prodSortie && prodSortie.stock_quantite < qtySortie) {
      setFormError(`Stock insuffisant pour « ${prodSortie.nom} » (dispo: ${prodSortie.stock_quantite})`); return
    }

    setIsSubmitting(true)
    try {
      const items: DetailEchangeInput[] = [
        { produit_id: prodRetour.id, quantite: qtyRetour, prix_unitaire: prodRetour.prix_vente, sens: "retour" },
        ...(mode === "echange" && prodSortie
          ? [{ produit_id: prodSortie.id, quantite: qtySortie, prix_unitaire: prodSortie.prix_vente, sens: "sortie" as const }]
          : []),
      ]

      const result = await createEchange({
        type_operation:     mode,
        type_vente_origine: typeVente,
        client_id:          selectedClientId,
        vente_originale_id: null,
        items,
        methode_paiement:   methodePaiement,
        notes,
        utilisateur_id:  userId  ?? undefined,
        utilisateur_nom: userName ?? undefined,
      })

      if (result.success) {
        setSuccessMsg(`✓ ${mode === "retour" ? "Retour" : "Échange"} enregistré — ${result.numero_echange}`)
        resetForm()
        router.refresh()
      } else {
        setFormError(result.error ?? "Erreur inconnue")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ─── Expand details ─── */
  const toggleDetails = async (id: number) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    setLoadingDetails(true)
    try {
      const details = await getEchangeDetails(id)
      setExpandedDetails(details)
    } finally {
      setLoadingDetails(false)
    }
  }

  /* ─── Delete ─── */
  const handleDelete = async () => {
    if (!deleteId) return
    const res = await deleteEchange(deleteId)
    setDeleteId(null)
    if (res.success) router.refresh()
    else alert(res.error ?? "Erreur lors de la suppression")
  }

  const filteredHistory = useMemo(() => {
    const q = histSearch.toLowerCase()
    return echanges.filter(e =>
      e.numero_echange.toLowerCase().includes(q) ||
      (e.client_nom ?? "").toLowerCase().includes(q)
    )
  }, [echanges, histSearch])

  /* ─────────────────── SCANNER CARD ─────────────────── */
  const ScannerInput = ({
    label, icon, value, onChange, onKeyDown, product, qty, setQty, error, inputRef, accent,
  }: {
    label: string
    icon: React.ReactNode
    value: string
    onChange: (v: string) => void
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
    product: ScannedProduct | null
    qty: number
    setQty: (n: number) => void
    error: string
    inputRef: React.RefObject<HTMLInputElement>
    accent: "orange" | "green"
  }) => {
    const colors = accent === "orange"
      ? { border: "border-orange-200", bg: "bg-orange-50", text: "text-orange-700", badge: "bg-orange-100 text-orange-800" }
      : { border: "border-green-200",  bg: "bg-green-50",  text: "text-green-700",  badge: "bg-green-100 text-green-800" }

    return (
      <div className={`rounded-xl border-2 ${product ? colors.border : "border-dashed border-muted-foreground/30"} p-4 space-y-3`}>
        <div className={`flex items-center gap-2 font-semibold text-sm ${product ? colors.text : "text-muted-foreground"}`}>
          {icon}
          {label}
          {product && <Check className="h-4 w-4 ml-auto" />}
        </div>

        {/* Barcode input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Barcode className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              className="pl-9 font-mono"
              placeholder="Scanner le code-barres…"
              value={value}
              onChange={e => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              autoComplete="off"
            />
          </div>
          <Button
            type="button" variant="outline" size="icon"
            onClick={() => {
              if (accent === "orange") lookupBarcode(value, setProdRetour, setScanErrorRetour, setBarcodeRetour)
              else lookupBarcode(value, setProdSortie, setScanErrorSortie, setBarcodeSortie)
            }}
          >
            <Search className="h-4 w-4" />
          </Button>
          {product && (
            <Button type="button" variant="ghost" size="icon" onClick={() => {
              if (accent === "orange") { setProdRetour(null); setBarcodeRetour("") }
              else { setProdSortie(null); setBarcodeSortie("") }
            }}>
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </div>

        {/* Error */}
        {error && !product && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" /> {error}
          </p>
        )}

        {/* Product found */}
        {product && (
          <div className={`rounded-lg ${colors.bg} px-3 py-2.5 space-y-2`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold">{product.nom}</div>
                {product.marque && <div className="text-xs text-muted-foreground">{product.marque}</div>}
                <div className="text-xs font-mono text-muted-foreground mt-0.5">{product.code_produit}</div>
              </div>
              <div className="text-right shrink-0">
                <div className={`font-bold text-lg ${colors.text}`}>{fmt(product.prix_vente)} TND</div>
                <div className="text-xs text-muted-foreground">stock: {product.stock_quantite}</div>
              </div>
            </div>

            {/* Qty */}
            <div className="flex items-center gap-2">
              <Label className="text-xs shrink-0">Quantité :</Label>
              <Input
                type="number" min={1}
                max={accent === "sortie" ? product.stock_quantite : undefined}
                value={qty}
                onChange={e => setQty(Math.max(1, Number(e.target.value)))}
                className="w-20 h-8 text-center"
              />
              <span className={`text-sm font-semibold ${colors.text}`}>
                = {fmt(qty * product.prix_vente)} TND
              </span>
            </div>

            {/* Stock warning for sortie */}
            {accent === "green" && product.stock_quantite < qty && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                Stock insuffisant ({product.stock_quantite} disponible)
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  /* ─────────────────── RENDER ─────────────────── */

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">

      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <RefreshCcw className="h-7 w-7 text-indigo-500" />
          Échanges & Retours
        </h1>
        <p className="text-muted-foreground">Scan du code-barres → enregistrement stock + caisse automatique</p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3">
          <div className="text-xs text-muted-foreground">Total ce mois</div>
          <div className="text-2xl font-bold">{stats.totalCount}</div>
          <div className="text-xs text-muted-foreground">{stats.retoursCount} retour(s) · {stats.echangesCount} échange(s)</div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><ShoppingBag className="h-3 w-3"/>Boutique</div>
          <div className="text-2xl font-bold text-blue-600">{stats.boutiqueCount}</div>
          <div className="text-xs text-muted-foreground">
            {stats.netBoutique > 0 ? "-" : stats.netBoutique < 0 ? "+" : ""}{fmt(Math.abs(stats.netBoutique))} TND
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Truck className="h-3 w-3"/>Colissimo</div>
          <div className="text-2xl font-bold text-orange-600">{stats.colissimoCount}</div>
          <div className="text-xs text-muted-foreground">
            {stats.netColissimo > 0 ? "-" : stats.netColissimo < 0 ? "+" : ""}{fmt(Math.abs(stats.netColissimo))} TND
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="text-xs text-muted-foreground">Impact net caisse</div>
          <div className={`text-2xl font-bold ${stats.totalNet > 0 ? "text-red-600" : stats.totalNet < 0 ? "text-green-600" : "text-muted-foreground"}`}>
            {stats.totalNet > 0 ? "-" : stats.totalNet < 0 ? "+" : ""}
            {fmt(Math.abs(stats.totalNet))} TND
          </div>
        </CardContent></Card>
      </div>

      {/* ── Operation form ── */}
      <Card>
        <CardHeader className="pb-3">
          {/* Type de vente origine */}
          <div className="mb-3">
            <p className="text-xs text-muted-foreground font-medium uppercase mb-1.5">Origine de la vente</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => switchTypeVente("boutique")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 py-2 text-sm font-semibold transition-colors
                  ${typeVente === "boutique" ? "border-blue-400 bg-blue-50 text-blue-700" : "border-muted hover:border-blue-200 text-muted-foreground"}`}
              >
                <ShoppingBag className="h-4 w-4" />
                Boutique
              </button>
              <button
                type="button"
                onClick={() => switchTypeVente("colissimo")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 py-2 text-sm font-semibold transition-colors
                  ${typeVente === "colissimo" ? "border-orange-400 bg-orange-50 text-orange-700" : "border-muted hover:border-orange-200 text-muted-foreground"}`}
              >
                <Truck className="h-4 w-4" />
                Colissimo
              </button>
            </div>
          </div>
          {/* Mode tabs */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => switchMode("retour")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-sm font-semibold transition-colors
                ${mode === "retour" ? "border-orange-400 bg-orange-50 text-orange-700" : "border-muted hover:border-orange-200 text-muted-foreground"}`}
            >
              <Undo2 className="h-4 w-4" />
              Retour produit
            </button>
            <button
              type="button"
              onClick={() => switchMode("echange")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-sm font-semibold transition-colors
                ${mode === "echange" ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-muted hover:border-indigo-200 text-muted-foreground"}`}
            >
              <RefreshCcw className="h-4 w-4" />
              Échange de produit
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* Scanner — retour */}
          <ScannerInput
            label={mode === "retour" ? "Produit retourné par le client" : "Produit retourné (scan)"}
            icon={<ArrowDownToLine className="h-4 w-4" />}
            value={barcodeRetour}
            onChange={setBarcodeRetour}
            onKeyDown={handleRetourBarcode}
            product={prodRetour}
            qty={qtyRetour}
            setQty={setQtyRetour}
            error={scanErrorRetour}
            inputRef={inputRetourRef}
            accent="orange"
          />

          {/* Scanner — sortie (échange only) */}
          {mode === "echange" && (
            <ScannerInput
              label="Produit donné en remplacement (scan)"
              icon={<ArrowUpFromLine className="h-4 w-4" />}
              value={barcodeSortie}
              onChange={setBarcodeSortie}
              onKeyDown={handleSortieBarcode}
              product={prodSortie}
              qty={qtySortie}
              setQty={setQtySortie}
              error={scanErrorSortie}
              inputRef={inputSortieRef}
              accent="green"
            />
          )}

          {/* Financial summary — show only when at least one product is scanned */}
          {prodRetour && (
            <div className={`rounded-lg border-2 px-4 py-3 flex items-center justify-between
              ${montantNet > 0
                ? "border-red-200 bg-red-50"
                : montantNet < 0
                ? "border-green-200 bg-green-50"
                : "border-gray-200 bg-gray-50"}`}>
              <div className="flex items-center gap-2 text-sm font-medium">
                {montantNet > 0
                  ? <><TrendingDown className="h-5 w-5 text-red-500" /> Recette <strong>diminue</strong> de</>
                  : montantNet < 0
                  ? <><TrendingUp className="h-5 w-5 text-green-600" /> Recette <strong>augmente</strong> de</>
                  : <><Minus className="h-5 w-5 text-gray-400" /> Aucun impact financier</>}
              </div>
              <div className={`text-2xl font-bold
                ${montantNet > 0 ? "text-red-600" : montantNet < 0 ? "text-green-600" : "text-gray-400"}`}>
                {montantNet !== 0 && `${fmt(Math.abs(montantNet))} TND`}
              </div>
            </div>
          )}

          {/* Client + payment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Client (optionnel)</Label>
              <Select
                value={selectedClientId ? String(selectedClientId) : "none"}
                onValueChange={v => setSelectedClientId(v === "none" ? null : Number(v))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="— Aucun —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Aucun —</SelectItem>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nom} {c.prenom} {c.telephone ? `· ${c.telephone}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Mode de règlement</Label>
              <Select value={methodePaiement} onValueChange={setMethodePaiement}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="espèces">Espèces</SelectItem>
                  <SelectItem value="carte">Carte bancaire</SelectItem>
                  <SelectItem value="virement">Virement</SelectItem>
                  <SelectItem value="avoir">Avoir</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs">Notes / raison</Label>
            <Textarea
              className="mt-1" rows={2}
              placeholder="Raison du retour ou de l'échange…"
              value={notes} onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Errors / success */}
          {formError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" /> {formError}
            </p>
          )}
          {successMsg && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2 flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" /> {successMsg}
            </p>
          )}

          {/* Submit */}
          <div className="flex gap-2">
            <Button
              className="flex-1 gap-2"
              onClick={handleSubmit}
              disabled={isSubmitting || !prodRetour}
            >
              {isSubmitting ? "Enregistrement…" : (
                mode === "retour"
                  ? <><Undo2 className="h-4 w-4" /> Confirmer le retour</>
                  : <><RefreshCcw className="h-4 w-4" /> Confirmer l'échange</>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>
              Réinitialiser
            </Button>
          </div>

        </CardContent>
      </Card>

      {/* ── History ── */}
      <Card>
        <CardHeader>
          <CardTitle>Historique</CardTitle>
          <div className="relative mt-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Rechercher…" value={histSearch} onChange={e => setHistSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {filteredHistory.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              Aucun échange ou retour enregistré.
            </p>
          ) : (
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>N°</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Retourné</TableHead>
                  <TableHead className="text-right">Remplacé</TableHead>
                  <TableHead className="text-right">Impact caisse</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map(row => (
                  <>
                    <TableRow key={row.id} className="hover:bg-muted/40">
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleDetails(row.id)}>
                          {expandedId === row.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{row.numero_echange}</TableCell>
                      <TableCell className="text-xs">
                        {new Date(row.date_echange).toLocaleDateString("fr-FR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {row.type_operation === "retour"
                            ? <Badge variant="secondary" className="gap-1 text-orange-700 bg-orange-100"><Undo2 className="h-3 w-3"/>Retour</Badge>
                            : <Badge className="gap-1 bg-indigo-100 text-indigo-700 border-indigo-200"><RefreshCcw className="h-3 w-3"/>Échange</Badge>}
                          {row.type_vente_origine === "colissimo"
                            ? <Badge variant="outline" className="gap-1 text-orange-600 border-orange-300 text-xs py-0"><Truck className="h-2.5 w-2.5"/>Colissimo</Badge>
                            : <Badge variant="outline" className="gap-1 text-blue-600 border-blue-300 text-xs py-0"><ShoppingBag className="h-2.5 w-2.5"/>Boutique</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{row.client_nom ?? "—"}</TableCell>
                      <TableCell className="text-right text-sm text-orange-700">{fmt(row.montant_retour)} TND</TableCell>
                      <TableCell className="text-right text-sm text-green-700">
                        {row.montant_remplacement > 0 ? `${fmt(row.montant_remplacement)} TND` : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold">
                        {row.montant_net > 0
                          ? <span className="text-red-600">−{fmt(row.montant_net)} TND</span>
                          : row.montant_net < 0
                          ? <span className="text-green-600">+{fmt(Math.abs(row.montant_net))} TND</span>
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDeleteId(row.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Expandable details */}
                    {expandedId === row.id && (
                      <TableRow key={`${row.id}-d`}>
                        <TableCell colSpan={9} className="bg-muted/30 px-4 py-3">
                          {loadingDetails ? (
                            <p className="text-sm text-muted-foreground">Chargement…</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {expandedDetails.map((d, i) => (
                                <div key={i} className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border
                                  ${d.sens === "retour" ? "bg-orange-50 border-orange-200 text-orange-800" : "bg-green-50 border-green-200 text-green-800"}`}>
                                  {d.sens === "retour"
                                    ? <ArrowDownToLine className="h-3.5 w-3.5" />
                                    : <ArrowUpFromLine className="h-3.5 w-3.5" />}
                                  <span className="font-medium">{d.produit_nom}</span>
                                  <span className="opacity-70">×{d.quantite}</span>
                                  <span className="font-mono text-xs">{fmt(d.montant_total)} TND</span>
                                </div>
                              ))}
                              {row.notes && (
                                <span className="text-xs text-muted-foreground italic self-center ml-2">
                                  « {row.notes} »
                                </span>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ─── Delete confirm ─── */}
      <AlertDialog open={deleteId !== null} onOpenChange={open => { if (!open) setDeleteId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler cette opération ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les mouvements de stock seront <strong>inversés</strong> et l'impact sur la caisse sera annulé.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Garder</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              Confirmer la suppression
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
