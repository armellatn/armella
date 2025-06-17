'use client'

import { useEffect, useState } from 'react'

export default function RecettesPage() {
  const [ventes, setVentes] = useState(0)
  const [retraits, setRetraits] = useState(0)

  useEffect(() => {
    fetch('/recettes/api')
      .then((res) => res.json())
      .then((data) => {
        setVentes(data.ventes)
        setRetraits(data.retraits)
      })
  }, [])

  const recetteNette = ventes - retraits

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold">📊 Recette du mois</h1>
      <p>🛒 Total ventes : <strong>{ventes} DT</strong></p>
      <p>🏦 Total retraits : <strong>{retraits} DT</strong></p>
      <p className="text-xl font-semibold mt-2">✅ Recette nette : {recetteNette} DT</p>
    </div>
  )
}
