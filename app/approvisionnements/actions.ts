"use server"

import db from "@/lib/db"
import { revalidatePath } from "next/cache"

export type Approvisionnement = {
  id: number
  numero_commande: string
  date_commande: string
  date_reception: string | null
  fournisseur_id: number
  fournisseur_nom: string
  montant_total: number
  montant_paye: number 
  statut: string
  notes: string
}

export async function getApprovisionnements() {
  const result = await db.query(`
    SELECT a.id, a.numero_commande, a.date_commande, a.date_reception,
           a.fournisseur_id, f.nom AS fournisseur_nom,
           a.montant_total, a.montant_paye,                -- ✅ Ajout ici aussi
           a.statut, a.notes
    FROM approvisionnements a
    JOIN fournisseurs f ON a.fournisseur_id = f.id
    ORDER BY a.date_commande DESC
  `)
  return result.rows
}

export async function deleteApprovisionnement(id: number) {
  const client = await db.connect()

  try {
    await client.query("BEGIN")

    // Récupérer les détails pour ajuster le stock si besoin
    const resDetails = await client.query(
      `SELECT produit_id, quantite FROM details_approvisionnement WHERE approvisionnement_id = $1`,
      [id]
    )

    // Diminuer le stock si l'approvisionnement était déjà reçu
    const approRes = await client.query(
      `SELECT statut FROM approvisionnements WHERE id = $1`,
      [id]
    )
    const statut = approRes.rows[0]?.statut

    if (statut === "reçu") {
      for (const row of resDetails.rows) {
        await client.query(
          `UPDATE produits SET stock_quantite = stock_quantite - $1 WHERE id = $2`,
          [row.quantite, row.produit_id]
        )
      }
    }

    // Supprimer les mouvements de stock liés
    await client.query(
      `DELETE FROM mouvements_stock WHERE reference_id = $1 AND reference_type = 'approvisionnement'`,
      [id]
    )

    // Supprimer les paiements liés
    await client.query(
      `DELETE FROM paiements_fournisseurs WHERE approvisionnement_id = $1`,
      [id]
    )

    // Supprimer les détails
    await client.query(
      `DELETE FROM details_approvisionnement WHERE approvisionnement_id = $1`,
      [id]
    )

    // Supprimer l'approvisionnement principal
    await client.query(
      `DELETE FROM approvisionnements WHERE id = $1`,
      [id]
    )

    await client.query("COMMIT")

    revalidatePath("/approvisionnements")
    revalidatePath("/produits")

    return { success: true }

  } catch (err) {
    await client.query("ROLLBACK")
    console.error("Erreur suppression approvisionnement :", err)
    return { success: false, error: "Échec de la suppression" }
  } finally {
    client.release()
  }
}
