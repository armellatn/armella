"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { getLightProducts, getLightSuppliers, createAppro } from "./actions"

export default function AddApproPage() {
  const [products, setProducts] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [productId, setProductId] = useState("")
  const [qty, setQty] = useState("")
  const [supplierId, setSupplierId] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
const [prixAchat, setPrixAchat] = useState<string>("")
const [prixVente, setPrixVente] = useState<string>("")
const [montantPaye, setMontantPaye] = useState<string>("")

  useEffect(() => {
    ;(async () => {
      setProducts(await getLightProducts())
      setSuppliers(await getLightSuppliers())
    })()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!productId || !qty || Number(qty) <= 0) return alert("Produit et quantité obligatoires")

    setLoading(true)
const res = await createAppro({
  produitId     : Number(productId),
  quantite      : Number(qty),
fournisseurId: Number(supplierId),
  notes,
  prixAchat     : Number(prixAchat),
  prixVente     : Number(prixVente),
  montantPaye   : Number(montantPaye),
})

    setLoading(false)

    if (res.success) router.push("/approvisionnements")
    else alert(res.error)
  }

  return (
    <div className="mx-auto max-w-3xl py-10">
      <h1 className="text-2xl font-bold mb-6">Ajouter un approvisionnement</h1>
      <form onSubmit={handleSubmit} className="space-y-5 bg-card p-6 rounded-lg shadow">
        <div className="space-y-2">
          <Label>Produit</Label>
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger><SelectValue placeholder="Choisir un produit" /></SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>{p.nom} ({p.code_produit})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Quantité</Label>
          <Input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Fournisseur</Label>
          <Select value={supplierId} onValueChange={setSupplierId}>
            <SelectTrigger><SelectValue placeholder="Choisir un fournisseur" /></SelectTrigger>
            <SelectContent>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>{s.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
<div className="space-y-2">
  <Label htmlFor="prixAchat">Prix d’achat</Label>
  <Input
    id="prixAchat"
    type="number"
    step="0.01"
    value={prixAchat}
    onChange={(e) => setPrixAchat(e.target.value)}
    placeholder="Prix d’achat unitaire"
  />
</div>

{/* Prix de vente */}
<div className="space-y-2">
  <Label htmlFor="prixVente">Prix de vente</Label>
  <Input
    id="prixVente"
    type="number"
    step="0.01"
    value={prixVente}
    onChange={(e) => setPrixVente(e.target.value)}
    placeholder="Prix de vente unitaire"
  />
</div>

{/* Montant payé */}
<div className="space-y-2">
  <Label htmlFor="montantPaye">Montant payé</Label>
  <Input
    id="montantPaye"
    type="number"
    step="0.01"
    value={montantPaye}
    onChange={(e) => setMontantPaye(e.target.value)}
    placeholder="Ex: 2000.00"
  />
</div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Enregistrement…" : "Ajouter"}
        </Button>
      </form>
    </div>
  )
}
