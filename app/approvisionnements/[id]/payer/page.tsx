"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ajouterPaiement } from "./actions"

interface PageProps {
  params: { id: string }
}

export default function AjouterPaiementPage({ params }: PageProps) {
  const approId = Number(params.id)
  const router = useRouter()

  const [montant, setMontant] = useState("")
  const [methode, setMethode] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!montant || isNaN(Number(montant)) || Number(montant) <= 0) {
      return alert("Montant invalide")
    }

    setLoading(true)
    const res = await ajouterPaiement({
      approvisionnementId: approId,
      montant: Number(montant),
      methode: methode.trim() || undefined,
      notes: notes.trim() || undefined,
    })

    setLoading(false)

    if (res.success) {
      router.push(`/approvisionnements/${approId}`)
    } else {
      alert(res.error || "Erreur inconnue")
    }
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Ajouter un paiement</h1>

      <form onSubmit={handleSubmit} className="space-y-5 bg-card p-6 rounded-md border">
        {/* Montant */}
        <div className="space-y-2">
          <Label htmlFor="montant">Montant</Label>
          <Input
            id="montant"
            type="number"
            step="0.01"
            min="0"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        {/* Méthode (optionnel) */}
        <div className="space-y-2">
          <Label htmlFor="methode">Méthode (ex: espèces, virement)</Label>
          <Input
            id="methode"
            value={methode}
            onChange={(e) => setMethode(e.target.value)}
            placeholder="Espèces, Virement..."
          />
        </div>

        {/* Notes (optionnel) */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Référence du paiement, remarques..."
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Enregistrement..." : "Valider le paiement"}
        </Button>
      </form>
    </div>
  )
}
