/* Page Recette du mois – accès direct à PostgreSQL */

import db from "@/lib/db"
import { BadgeCheck, Undo2 } from "lucide-react"   // ← Undo2 = flèche retour

export const metadata = { title: "Recette du mois" }

export default async function RecettesPage() {
  /* ---------- Agrégation SQL (mois courant) ---------- */
  const [ventesRes, retraitsRes, retoursRes] = await Promise.all([
    db.query(`
      SELECT COALESCE(SUM(montant_paye), 0)::float AS total
      FROM   ventes
      WHERE  date_vente >= date_trunc('month', CURRENT_DATE)
    `),
    db.query(`
      SELECT COALESCE(SUM(montant), 0)::float AS total
      FROM   retraits
      WHERE  date >= date_trunc('month', CURRENT_DATE)
    `),
    db.query(`
      SELECT COALESCE(SUM(montant_total), 0)::float AS total
      FROM   retours
      WHERE  date_retour >= date_trunc('month', CURRENT_DATE)
    `),
  ])

  const ventes   = ventesRes.rows[0].total
  const retraits = retraitsRes.rows[0].total
  const retours  = retoursRes.rows[0].total
  const net      = ventes - retraits - retours

  /* --------------------- UI -------------------------- */
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <BadgeCheck className="h-5 w-5" />
        Recette du mois
      </h1>

      <p>💰 Total ventes&nbsp;: {ventes.toFixed(2)} DT</p>
      <p>🏧 Total retraits&nbsp;: {retraits.toFixed(2)} DT</p>
      <p>
        <Undo2 className="inline h-4 w-4 mr-1" />{/* icône retour */}
        Total retours&nbsp;: {retours.toFixed(2)} DT
      </p>

      <p className="font-semibold">
        ✅ Recette nette&nbsp;: {net.toFixed(2)} DT
      </p>
    </div>
  )
}
