import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { logAction } from '@/lib/historique'

export async function GET() {
  try {
    const result = await db.query(`
      SELECT id, montant, description, date
      FROM retraits
      WHERE EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
      ORDER BY date DESC
    `)

    return NextResponse.json(Array.isArray(result.rows) ? result.rows : [])
  } catch (error: any) {
    console.error('❌ Erreur API retraits GET :', error.message)
    return NextResponse.json({ error: 'Erreur serveur: ' + error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { montant, description } = await req.json()

    if (!montant || !description) {
      return NextResponse.json({ error: 'Champs requis' }, { status: 400 })
    }

    const insertResult = await db.query(
      `INSERT INTO retraits (montant, description) VALUES ($1, $2) RETURNING id`,
      [montant, description]
    )

    const retraitId = insertResult.rows[0].id

    await logAction({
      typeAction: "RETRAIT_CREATION",
      description: `Nouveau retrait: ${montant} TND - ${description}`,
      entiteType: "retrait",
      entiteId: retraitId,
      donneesApres: { montant, description },
    })

    const result = await db.query(`
      SELECT id, montant, description, date
      FROM retraits
      WHERE EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
      ORDER BY date DESC
    `)

    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('❌ Erreur API retraits POST :', error.message)
    return NextResponse.json({ error: 'Erreur serveur: ' + error.message }, { status: 500 })
  }
}
