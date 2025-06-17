'use client'

import { useEffect, useState } from 'react'

type Retrait = {
  id: number
  montant: number
  description: string
  date: string
}

export default function RetraitsPage() {
  const [retraits, setRetraits] = useState<Retrait[]>([])
  const [montant, setMontant] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetch('/retraits/api')
      .then(res => res.json())
      .then(data => setRetraits(data))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const res = await fetch('/retraits/api', {
      method: 'POST',
      body: JSON.stringify({ montant, description }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (res.ok) {
      setMontant('')
      setDescription('')
      const updated = await res.json()
      setRetraits(updated)
    } else {
      alert("Erreur lors de l'enregistrement.")
    }

    setIsSubmitting(false)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🏦 Retraits d'argent</h1>

      <form onSubmit={handleSubmit} className="mb-6 space-y-4 max-w-md">
        <input
          type="number"
          step="0.01"
          placeholder="Montant en DT"
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          {isSubmitting ? 'Enregistrement...' : 'Ajouter un retrait'}
        </button>
      </form>

      <hr className="my-6" />

      {retraits.length === 0 ? (
        <p>Aucun retrait enregistré ce mois.</p>
      ) : (
        <ul className="space-y-2">
          {retraits.map((r) => (
            <li key={r.id} className="border p-3 rounded shadow-sm bg-white">
              <div><strong>{r.montant} DT</strong></div>
              <div>{r.description}</div>
              <div className="text-sm text-muted-foreground">
                {new Date(r.date).toLocaleString('fr-FR')}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
