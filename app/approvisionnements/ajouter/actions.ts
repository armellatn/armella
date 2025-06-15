"use server"

import db from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getLightProducts() {
  const { rows } = await db.query(`SELECT id, code_produit, nom FROM produits ORDER BY nom ASC`)
  return rows
}

export async function getLightSuppliers() {
  const { rows } = await db.query(`SELECT id, nom FROM fournisseurs ORDER BY nom ASC`)
  return rows
}

export async function createAppro({
  produitId,
  quantite,
  prixAchat,
  prixVente,
  montantPaye,
  fournisseurId,
  notes,
}: {
  produitId: number
  quantite: number
  prixAchat: number
  prixVente: number
  montantPaye: number
  fournisseurId: number
  notes: string
}) {
  const client = await db.connect()

  try {
    await client.query("BEGIN")

    const numeroCommande = `APPRO-${Date.now()}`
    const montantTotal = prixAchat * quantite
    const statutPaiement = montantPaye >= montantTotal ? "payé" : "non payé"

    // Approvisionnement principal
    const approResult = await client.query(
      `INSERT INTO approvisionnements (
         fournisseur_id, numero_commande, date_commande, date_reception,
         montant_total, montant_paye, statut_paiement, statut, notes
       )
       VALUES ($1, $2, NOW(), NOW(), $3, $4, $5, 'reçu', $6)
       RETURNING id`,
      [fournisseurId, numeroCommande, montantTotal, montantPaye, statutPaiement, notes]
    )

    const approId = approResult.rows[0].id

    // Détails produit
    await client.query(
      `INSERT INTO details_approvisionnement (
         approvisionnement_id, produit_id, quantite, prix_unitaire, montant_total
       ) VALUES ($1, $2, $3, $4, $5)`,
      [approId, produitId, quantite, prixAchat, montantTotal]
    )

    // Mise à jour produit
    await client.query(
      `UPDATE produits
       SET stock_quantite = stock_quantite + $1,
           prix_achat = $2,
           prix_vente = $3
       WHERE id = $4`,
      [quantite, prixAchat, prixVente, produitId]
    )

    // Mouvement de stock
    await client.query(
      `INSERT INTO mouvements_stock (
         produit_id, quantite, type_mouvement, reference_id, reference_type, notes
       ) VALUES ($1, $2, 'entrée', $3, 'approvisionnement', $4)`,
      [produitId, quantite, approId, `Appro #${approId}`]
    )

    // Paiement initial s'il existe
    if (montantPaye > 0) {
      await client.query(
        `INSERT INTO paiements_fournisseurs (
           approvisionnement_id, montant, methode, notes, date_paiement
         )
         VALUES ($1, $2, 'initial', 'Paiement à la création', NOW())`,
        [approId, montantPaye]
      )
    }

    await client.query("COMMIT")
    revalidatePath("/approvisionnements")
    return { success: true }

  } catch (err) {
    await client.query("ROLLBACK")
    console.error("Erreur createAppro:", err)
    return { success: false, error: "Erreur lors de l’approvisionnement" }
  } finally {
    client.release()
  }
}
