import { NextResponse } from "next/server"
import db from "@/lib/db"


export async function GET() {
  try {
    /* -------------------- Total ventes (du mois courant) ------------------- */
    const ventesResult = await db.query(`
      SELECT COALESCE(SUM(montant_paye), 0)::float AS total
      FROM   ventes
      WHERE  EXTRACT(MONTH FROM date_vente) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND  EXTRACT(YEAR  FROM date_vente) = EXTRACT(YEAR  FROM CURRENT_DATE)
    `)

    /* -------------------- Total retraits (du mois courant) ----------------- */
    const retraitsResult = await db.query(`
      SELECT COALESCE(SUM(montant), 0)::float AS total
      FROM   retraits
      WHERE  EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND  EXTRACT(YEAR  FROM date) = EXTRACT(YEAR  FROM CURRENT_DATE)
    `)

    /* -------------------- Total retours produits (du mois courant) --------- */
    const retoursResult = await db.query(`
      SELECT COALESCE(SUM(montant_total), 0)::float AS total
      FROM   retours
      WHERE  EXTRACT(MONTH FROM date_retour) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND  EXTRACT(YEAR  FROM date_retour) = EXTRACT(YEAR  FROM CURRENT_DATE)
    `)

    return NextResponse.json({
      ventes:   ventesResult.rows[0].total,
      retraits: retraitsResult.rows[0].total,
      retours:  retoursResult.rows[0].total,   // ← nouveau champ
    })
  } catch (error: any) {
    console.error("❌ Erreur API recette :", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
