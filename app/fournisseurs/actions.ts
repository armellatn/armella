"use server"

import db from "@/lib/db"
import { revalidatePath } from "next/cache"



export type Fournisseur = {
  id: number
  nom: string
  contact_nom: string
  email: string
  telephone: string
  adresse: string
  ville: string
  code_postal: string
  notes: string
}

export async function getFournisseurs() {
  try {
    const result = await db.query( // CHANGED
      `SELECT id, nom, contact_nom, email, telephone, ville
       FROM fournisseurs
       ORDER BY nom ASC`
    ) // CHANGED
    return result.rows // CHANGED
  } catch (error) {
    console.error("Error fetching fournisseurs:", error)
    return []
  }
}

export async function getFournisseur(id: number) {
  try {
    const result = await db.query( // CHANGED
      `SELECT * FROM fournisseurs WHERE id = $1`,
      [id]
    ) // CHANGED
    return result.rows[0] || null // CHANGED
  } catch (error) {
    console.error(`Error fetching fournisseur ${id}:`, error)
    return null
  }
}

export async function createFournisseur(formData: FormData) {
  const nom = formData.get("nom") as string
  const contact_nom = formData.get("contact_nom") as string
  const email = formData.get("email") as string
  const telephone = formData.get("telephone") as string
  const adresse = formData.get("adresse") as string
  const ville = formData.get("ville") as string
  const code_postal = formData.get("code_postal") as string
  const notes = formData.get("notes") as string

  try {
    await db.query( // CHANGED
      `INSERT INTO fournisseurs (
        nom, contact_nom, email, telephone, adresse, ville, 
        code_postal, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      )`,
      [nom, contact_nom, email, telephone, adresse, ville, code_postal, notes]
    ) // CHANGED

    revalidatePath("/fournisseurs")
    return { success: true }
  } catch (error) {
    console.error("Error creating fournisseur:", error)
    return { success: false, error: "Erreur lors de la création du fournisseur" }
  }
}

export async function updateFournisseur(id: number, formData: FormData) {
  const nom = formData.get("nom") as string
  const contact_nom = formData.get("contact_nom") as string
  const email = formData.get("email") as string
  const telephone = formData.get("telephone") as string
  const adresse = formData.get("adresse") as string
  const ville = formData.get("ville") as string
  const code_postal = formData.get("code_postal") as string
  const notes = formData.get("notes") as string

  try {
    await db.query( // CHANGED
      `UPDATE fournisseurs SET
        nom = $1,
        contact_nom = $2,
        email = $3,
        telephone = $4,
        adresse = $5,
        ville = $6,
        code_postal = $7,
        notes = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9`,
      [nom, contact_nom, email, telephone, adresse, ville, code_postal, notes, id]
    ) // CHANGED

    revalidatePath("/fournisseurs")
    return { success: true }
  } catch (error) {
    console.error(`Error updating fournisseur ${id}:`, error)
    return { success: false, error: "Erreur lors de la mise à jour du fournisseur" }
  }
}

export async function deleteFournisseur(id: number) {
  try {
    const result = await db.query( // CHANGED
      `SELECT COUNT(*) as count FROM approvisionnements WHERE fournisseur_id = $1`,
      [id]
    ) // CHANGED

    const count = parseInt(result.rows[0].count) // CHANGED

    if (count > 0) {
      return {
        success: false,
        error: "Ce fournisseur est associé à des approvisionnements et ne peut pas être supprimé",
      }
    }

    await db.query(`DELETE FROM fournisseurs WHERE id = $1`, [id]) // CHANGED
    revalidatePath("/fournisseurs")
    return { success: true }
  } catch (error) {
    console.error(`Error deleting fournisseur ${id}:`, error)
    return { success: false, error: "Erreur lors de la suppression du fournisseur" }
  }
}
