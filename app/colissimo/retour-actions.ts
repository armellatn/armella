"use server"

import db from "@/lib/db"
import { revalidatePath } from "next/cache"

export type ReturnItem = {
  productId: number
  quantity: number
  prixUnitaire: number
}

/**
 * Traite UN retour (utilisé par createReturns)
 */
async function createSingleReturn(
  item: ReturnItem,
  notes: string,
  client = null,
) {
  const montant = item.quantity * item.prixUnitaire

  /* 1) Insérer retour */
  const { rows } = await db.query(
    `INSERT INTO retours (
       produit_id, quantite, montant_total, notes
     ) VALUES ($1,$2,$3,$4)
     RETURNING id`,
    [item.productId, item.quantity, montant, notes],
  )

  /* 2) Réinjecter stock */
  await db.query(
    `UPDATE produits
     SET stock_quantite = stock_quantite + $1
     WHERE id = $2`,
    [item.quantity, item.productId],
  )

  /* 3) Mouvement stock */
  await db.query(
    `INSERT INTO mouvements_stock (
       produit_id, quantite, type_mouvement,
       reference_id, reference_type, notes
     ) VALUES ($1,$2,'entrée',$3,'retour',$4)`,
    [item.productId, item.quantity, rows[0].id, "Retour Colissimo"],
  )
}

/* ------------------------------------------------------------------ */
/*  createReturns : tableau d’items + notes                            */
/* ------------------------------------------------------------------ */
export async function createReturns(items: ReturnItem[], notes: string) {
  try {
    for (const it of items) {
      await createSingleReturn(it, notes)
    }

    /* Revalidation pages concernées */
    revalidatePath("/colissimo")
    revalidatePath("/recettes")

    return { success: true }
  } catch (e) {
    console.error("❌ Error createReturns:", e)
    return { success: false, error: "Erreur enregistrement retour" }
  }
}
