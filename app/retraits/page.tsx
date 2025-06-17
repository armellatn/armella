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
  const [error, setError] = useState('')

  useEffect(() => {
    fetchRetraits()
  }, [])

  const fetchRetraits = async () => {
    try {
      const res = await fetch('/retraits/api')
      const data = await res.json()
      if (Array.isArray(data)) {
        setRetraits(data)
      } else {
        setError(data.error || 'Erreur inconnue.')
      }
    } catch (err) {
      console.error('❌ Erreur réseau :', err)
      setError("Erreur lors du chargement des retraits.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    if (!montant || !description) {
      setError("Tous les champs sont requis.")
      setIsSubmitting(false)
      return
    }

    try {
      const res = await fetch('/retraits/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ montant, description }),
      })

      if (res.ok) {
        const updated = await res.json()
        setRetraits(updated)
        setMontant('')
        setDescription('')
      } else {
        const errData = await res.json()
        setError(errData.error || "Erreur lors de l'enregistrement.")
      }
    } catch (err) {
      console.error('❌ Erreur POST retrait:', err)
      setError("Erreur serveur.")
    }

    setIsSubmitting(false)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🏦 Retraits d'argent</h1>

      <form onSubmit={handleSubmit} className="mb-6 space-y-4 bg-white p-4 border rounded shadow-sm">
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
        {error && <p className="text-red-600">{error}</p>}
      </form>

      <hr className="my-6" />

      {retraits.length === 0 ? (
        <p className="text-gray-500">Aucun retrait enregistré ce mois.</p>
      ) : (
        <ul className="space-y-2">
          {retraits.map((r) => (
            <li key={r.id} className="border p-3 rounded shadow-sm bg-white">
              <div><strong>{r.montant} DT</strong></div>
              <div>{r.description}</div>
              <div className="text-sm text-gray-500">
                {new Date(r.date).toLocaleString('fr-FR')}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
