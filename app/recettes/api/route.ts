import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    const ventesQuery = await db.query(`
      SELECT COALESCE(SUM(montant_paye), 0) AS total
      FROM ventes
      WHERE EXTRACT(MONTH FROM date_vente) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM date_vente) = EXTRACT(YEAR FROM CURRENT_DATE)
    `)

    const retraitsQuery = await db.query(`
      SELECT COALESCE(SUM(montant), 0) AS total
      FROM retraits
      WHERE EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
    `)

    return NextResponse.json({
      ventes: ventesQuery.rows[0].total,
      retraits: retraitsQuery.rows[0].total,
    })
  } catch (error) {
    console.error('❌ Erreur API recette :', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
