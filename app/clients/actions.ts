"use server"

import db from "@/lib/db"
import { revalidatePath } from "next/cache"

// const sql = neon(process.env.DATABASE_URL!) // ❌ Supprimé — CHANGED

export type Client = {
  id: number
  nom: string
  prenom: string
  email: string
  telephone: string
  adresse: string
  ville: string
  code_postal: string
  date_naissance: string
  prescription: string
  notes: string
}

export async function getClients() {
  try {
    const result = await db.query( // CHANGED
      `SELECT id, nom, prenom, email, telephone, ville
       FROM clients
       ORDER BY nom ASC, prenom ASC`
    ) // CHANGED
    return result.rows // CHANGED
  } catch (error) {
    console.error("Error fetching clients:", error)
    return []
  }
}

export async function getClient(id: number) {
  try {
    const result = await db.query( // CHANGED
      `SELECT * FROM clients WHERE id = $1`,
      [id]
    ) // CHANGED
    return result.rows[0] || null // CHANGED
  } catch (error) {
    console.error(`Error fetching client ${id}:`, error)
    return null
  }
}

export async function createClient(formData: FormData) {
  const nom = formData.get("nom") as string
  const prenom = formData.get("prenom") as string
  const email = formData.get("email") as string
  const telephone = formData.get("telephone") as string
  const adresse = formData.get("adresse") as string
  const ville = formData.get("ville") as string
  const code_postal = formData.get("code_postal") as string
  const date_naissance = formData.get("date_naissance") as string
  const prescription = formData.get("prescription") as string
  const notes = formData.get("notes") as string

  try {
    await db.query( // CHANGED
      `INSERT INTO clients (
        nom, prenom, email, telephone, adresse, ville, 
        code_postal, date_naissance, prescription, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10
      )`,
      [
        nom,
        prenom,
        email,
        telephone,
        adresse,
        ville,
        code_postal,
        date_naissance || null,
        prescription,
        notes,
      ]
    ) // CHANGED

    revalidatePath("/clients")
    return { success: true }
  } catch (error) {
    console.error("Error creating client:", error)
    return { success: false, error: "Erreur lors de la création du client" }
  }
}

export async function updateClient(id: number, formData: FormData) {
  const nom = formData.get("nom") as string
  const prenom = formData.get("prenom") as string
  const email = formData.get("email") as string
  const telephone = formData.get("telephone") as string
  const adresse = formData.get("adresse") as string
  const ville = formData.get("ville") as string
  const code_postal = formData.get("code_postal") as string
  const date_naissance = formData.get("date_naissance") as string
  const prescription = formData.get("prescription") as string
  const notes = formData.get("notes") as string

  try {
    await db.query( // CHANGED
      `UPDATE clients SET
        nom = $1,
        prenom = $2,
        email = $3,
        telephone = $4,
        adresse = $5,
        ville = $6,
        code_postal = $7,
        date_naissance = $8,
        prescription = $9,
        notes = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11`,
      [
        nom,
        prenom,
        email,
        telephone,
        adresse,
        ville,
        code_postal,
        date_naissance || null,
        prescription,
        notes,
        id,
      ]
    ) // CHANGED

    revalidatePath("/clients")
    return { success: true }
  } catch (error) {
    console.error(`Error updating client ${id}:`, error)
    return { success: false, error: "Erreur lors de la mise à jour du client" }
  }
}

export async function deleteClient(id: number) {
  try {
    await db.query(`DELETE FROM clients WHERE id = $1`, [id]) // CHANGED
    revalidatePath("/clients")
    return { success: true }
  } catch (error) {
    console.error(`Error deleting client ${id}:`, error)
    return { success: false, error: "Erreur lors de la suppression du client" }
  }
}
