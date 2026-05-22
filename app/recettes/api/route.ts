import { NextResponse } from "next/server"
import db from "@/lib/db"


export async function GET() {
  try {
    /* -------------------- Total ventes (du mois courant) ------------------- */
    const ventesResult = await db.query(`
      SELECT COALESCE(SUM(montant_paye), 0)::float AS total
      FROM   ventes
      WHERE  date_vente >= date_trunc('month', CURRENT_DATE)
    `)

    /* -------------------- Total retraits (du mois courant) ----------------- */
    const retraitsResult = await db.query(`
      SELECT COALESCE(SUM(montant), 0)::float AS total
      FROM   retraits
      WHERE  date >= date_trunc('month', CURRENT_DATE)
    `)

    /* -------------------- Total retours produits (du mois courant) --------- */
    const retoursResult = await db.query(`
      SELECT COALESCE(SUM(montant_total), 0)::float AS total
      FROM   retours
      WHERE  date_retour >= date_trunc('month', CURRENT_DATE)
    `)

    /* -------------------- Échanges / retours boutique (net positif) -------- */
    const echangesResult = await db.query(`
      SELECT COALESCE(SUM(montant_net), 0)::float AS total
      FROM   echanges
      WHERE  date_echange >= date_trunc('month', CURRENT_DATE)
    `).catch(e => { console.error("API recette echanges:", e.message); return { rows: [{ total: 0 }] } })

    return NextResponse.json({
      ventes:   ventesResult.rows[0].total,
      retraits: retraitsResult.rows[0].total,
      retours:  retoursResult.rows[0].total,
      echanges: echangesResult.rows[0].total,
    })
  } catch (error: any) {
    console.error("❌ Erreur API recette :", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
