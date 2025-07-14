"use client"

import { useState } from "react"
import { createReturns, type ReturnItem } from "./retour-actions"

/* --------- UI : imports individuels --------- */
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

/* Icônes */
import { RotateCcw, Plus, Trash2 } from "lucide-react"

/* Type minimal produit */
interface Product { id: number; nom: string; prix_vente: number }

/* ---------- Ligne de retour ---------- */
function ReturnRow({
  idx, products, row, update, remove,
}: {
  idx: number
  products: Product[]
  row: ReturnItem
  update: (i: number, field: keyof ReturnItem, v: any) => void
  remove: (i: number) => void
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
      {/* Produit */}
      <div className="col-span-2">
        <Label>Produit</Label>
        <Select
          value={row.productId ? String(row.productId) : ""}
          onValueChange={val => {
            const prod = products.find(p => p.id === Number(val))
            update(idx, "productId", Number(val))
            if (prod) update(idx, "prixUnitaire", prod.prix_vente)
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner" />
          </SelectTrigger>
          <SelectContent>
            {products.map(p => (
              <SelectItem key={p.id} value={p.id.toString()}>
                {p.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quantité */}
      <div>
        <Label>Qté</Label>
        <Input
          type="number"
          min={1}
          value={row.quantity}
          onChange={e => update(idx, "quantity", Number(e.target.value))}
        />
      </div>

      {/* PU */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Label>PU (TND)</Label>
          <Input
            type="number"
            step="0.01"
            value={row.prixUnitaire}
            onChange={e => update(idx, "prixUnitaire", Number(e.target.value))}
          />
        </div>
        {/* Supprimer ligne */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="self-center mt-4 text-red-600"
          onClick={() => remove(idx)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

/* ---------- Formulaire multi-retours ---------- */
export default function MultiReturnForm({ products }: { products: Product[] }) {
  const { toast } = useToast()

  const [rows, setRows] = useState<ReturnItem[]>([
    { productId: 0, quantity: 1, prixUnitaire: 0 },
  ])
  const [notes, setNotes] = useState("")

  const update = (i: number, field: keyof ReturnItem, v: any) =>
    setRows(r => r.map((row, idx) => (idx === i ? { ...row, [field]: v } : row)))

  const remove = (i: number) =>
    setRows(r => (r.length > 1 ? r.filter((_, idx) => idx !== i) : r))

  const add = () =>
    setRows(r => [...r, { productId: 0, quantity: 1, prixUnitaire: 0 }])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const clean = rows.filter(
      r => r.productId && r.quantity > 0 && r.prixUnitaire > 0,
    )
    if (clean.length === 0) return

    const res = await createReturns(clean, notes)
    if (res.success) {
      toast({ title: "Retour enregistré ✔️" })
      setRows([{ productId: 0, quantity: 1, prixUnitaire: 0 }])
      setNotes("")
    } else {
      toast({ title: "Erreur", description: res.error, variant: "destructive" })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-8">
      <h3 className="font-semibold flex items-center gap-2">
        <RotateCcw className="h-4 w-4" /> Retour produit Colissimo
      </h3>

      {rows.map((row, idx) => (
        <ReturnRow
          key={idx}
          idx={idx}
          products={products}
          row={row}
          update={update}
          remove={remove}
        />
      ))}

      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="h-3 w-3 mr-1" /> Ajouter une ligne
      </Button>

      <div>
        <Label>Notes</Label>
        <Textarea
          placeholder="Raison générale du retour (facultatif)…"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      <Button type="submit">Enregistrer le retour</Button>
    </form>
  )
}
