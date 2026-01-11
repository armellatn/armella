"use server"

import db from "@/lib/db"
import { revalidatePath } from "next/cache"
import { createUser } from "../auth/actions"
import { logAction } from "@/lib/historique"

export type User = {
  id: number
  nom: string
  prenom: string
  email: string
  role: string
  actif: boolean
  derniere_connexion: string | null
}

export async function getUsers() {
  try {
    const result = await db.query(`
      SELECT id, nom, prenom, email, role, actif, derniere_connexion
      FROM utilisateurs
      ORDER BY nom ASC, prenom ASC
    `)
    return result.rows
  } catch (error) {
    console.error("Error fetching users:", error)
    return []
  }
}

export async function getUser(id: number) {
  try {
    const result = await db.query(
      `SELECT id, nom, prenom, email, role, actif FROM utilisateurs WHERE id = $1`,
      [id]
    )
    return result.rows[0] || null
  } catch (error) {
    console.error(`Error fetching user ${id}:`, error)
    return null
  }
}

export async function updateUser(id: number, formData: FormData) {
  const nom = formData.get("nom") as string
  const prenom = formData.get("prenom") as string
  const email = formData.get("email") as string
  const role = formData.get("role") as string
  const actif = formData.get("actif") === "true"
  const codePin = formData.get("code_pin") as string

  try {
    if (email) {
      const emailCheck = await db.query(
        `SELECT id FROM utilisateurs WHERE email = $1 AND id != $2`,
        [email, id]
      )
      if (emailCheck.rowCount > 0) {
        return { success: false, error: "Cet email est déjà utilisé par un autre utilisateur" }
      }
    }

    if (codePin) {
      const pinCheck = await db.query(
        `SELECT id FROM utilisateurs WHERE code_pin = $1 AND id != $2`,
        [codePin, id]
      )
      if (pinCheck.rowCount > 0) {
        return { success: false, error: "Ce code PIN est déjà utilisé par un autre utilisateur" }
      }
    }

    // Construction dynamique de la requête avec ou sans code PIN
    const values = [nom, prenom, email, role, actif, id]
    let query = `
      UPDATE utilisateurs SET
        nom = $1,
        prenom = $2,
        email = $3,
        role = $4,
        actif = $5,
        updated_at = CURRENT_TIMESTAMP
    `
    if (codePin) {
      query += `, code_pin = $6`
      values.push(codePin)
    }

    query += ` WHERE id = $${values.length}`

    await db.query(query, values)

    await logAction({
      typeAction: "UTILISATEUR_MODIFICATION",
      description: `Utilisateur modifié: ${prenom} ${nom} (${role})`,
      entiteType: "utilisateur",
      entiteId: id,
      donneesApres: { nom, prenom, email, role, actif },
    })

    revalidatePath("/utilisateurs")
    return { success: true }
  } catch (error) {
    console.error(`Error updating user ${id}:`, error)
    return { success: false, error: "Erreur lors de la mise à jour de l'utilisateur" }
  }
}

export async function deleteUser(id: number) {
  try {
    const result = await db.query(
      `SELECT COUNT(*) as count FROM utilisateurs WHERE role = 'admin' AND id != $1`,
      [id]
    )

    const adminCount = parseInt(result.rows[0].count)

    if (adminCount === 0) {
      return {
        success: false,
        error: "Impossible de supprimer le dernier administrateur",
      }
    }

    // Get user info before deletion
    const userResult = await db.query(`SELECT nom, prenom, role FROM utilisateurs WHERE id = $1`, [id])
    const userInfo = userResult.rows[0]

    await db.query(`DELETE FROM utilisateurs WHERE id = $1`, [id])

    await logAction({
      typeAction: "UTILISATEUR_SUPPRESSION",
      description: `Utilisateur supprimé: ${userInfo?.prenom || ''} ${userInfo?.nom || ''}`,
      entiteType: "utilisateur",
      entiteId: id,
      donneesAvant: userInfo,
    })

    revalidatePath("/utilisateurs")
    return { success: true }
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error)
    return { success: false, error: "Erreur lors de la suppression de l'utilisateur" }
  }
}

export { createUser }
