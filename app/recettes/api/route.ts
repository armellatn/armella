import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    const ventes = await db.query(`
      SELECT COALESCE(SUM(montant_paye), 0) AS total
      FROM ventes
      WHERE EXTRACT(MONTH FROM date_vente) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM date_vente) = EXTRACT(YEAR FROM CURRENT_DATE)
    `)

    const retraits = await db.query(`
      SELECT COALESCE(SUM(montant), 0) AS total
      FROM retraits
      WHERE EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
    `)

    return NextResponse.json({
      ventes: ventes.rows[0].total,
      retraits: retraits.rows[0].total,
    })
  } catch (error: any) {
    console.error('❌ Erreur API recette :', error.message)
    return NextResponse.json({ error: 'Erreur serveur: ' + error.message }, { status: 500 })
  }
}
