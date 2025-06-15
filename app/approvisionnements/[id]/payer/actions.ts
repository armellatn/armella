"use server"

import db from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function ajouterPaiement({
  approvisionnementId,
  montant,
  methode,
  notes,
}: {
  approvisionnementId: number
  montant: number
  methode?: string
  notes?: string
}) {
  const client = await db.connect()
  try {
    await client.query("BEGIN")

    // 1. Ajouter le paiement
    await client.query(
      `INSERT INTO paiements_fournisseurs (approvisionnement_id, montant, methode, notes)
       VALUES ($1, $2, $3, $4)`,
      [approvisionnementId, montant, methode || null, notes || null]
    )

    // 2. Recalcul du montant payé
    const totalRes = await client.query(
      `SELECT COALESCE(SUM(montant), 0) as total
       FROM paiements_fournisseurs
       WHERE approvisionnement_id = $1`,
      [approvisionnementId]
    )
    const totalPayé = Number(totalRes.rows[0].total)

    // 3. Récupération montant total
    const approRes = await client.query(
      `SELECT montant_total FROM approvisionnements WHERE id = $1`,
      [approvisionnementId]
    )
    const totalAttendu = Number(approRes.rows[0].montant_total)

    const reste = totalAttendu - totalPayé
    const statutPaiement = reste <= 0 ? "payé" : "non payé"

    // 4. MAJ table approvisionnements
    await client.query(
      `UPDATE approvisionnements
       SET montant_paye = $1, statut_paiement = $2
       WHERE id = $3`,
      [totalPayé, statutPaiement, approvisionnementId]
    )

    await client.query("COMMIT")
    revalidatePath(`/approvisionnements/${approvisionnementId}`)
    return { success: true }
  } catch (err) {
    await client.query("ROLLBACK")
    console.error("Erreur paiement :", err)
    return { success: false, error: "Échec de l’enregistrement du paiement" }
  } finally {
    client.release()
  }
}
