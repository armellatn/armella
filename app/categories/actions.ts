"use server"

import db from "@/lib/db"
import { revalidatePath } from "next/cache"

// const sql = neon(process.env.DATABASE_URL!) // ❌ Supprimé — CHANGED

export async function createCategory(formData: FormData) {
  const nom = formData.get("nom") as string
  const description = formData.get("description") as string

  if (!nom.trim()) {
    return { success: false, error: "Le nom de la catégorie est requis" }
  }

  try {
    await db.query( // CHANGED
      `INSERT INTO categories (nom, description) VALUES ($1, $2)`,
      [nom, description]
    ) // CHANGED

    revalidatePath("/produits")
    revalidatePath("/pos")
    revalidatePath("/categories")

    return { success: true }
  } catch (error) {
    console.error("Error creating category:", error)
    return { success: false, error: "Erreur lors de la création de la catégorie" }
  }
}

export async function getCategories() {
  try {
    const result = await db.query( // CHANGED
      `SELECT id, nom, description FROM categories ORDER BY nom ASC`
    ) // CHANGED
    return result.rows // CHANGED
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

export async function deleteCategory(id: number) {
  try {
    const result = await db.query( // CHANGED
      `SELECT COUNT(*) as count FROM produits WHERE categorie_id = $1`,
      [id]
    ) // CHANGED

    const count = parseInt(result.rows[0].count) // CHANGED

    if (count > 0) {
      return {
        success: false,
        error: "Cette catégorie est utilisée par des produits et ne peut pas être supprimée",
      }
    }

    await db.query(`DELETE FROM categories WHERE id = $1`, [id]) // CHANGED

    revalidatePath("/produits")
    revalidatePath("/pos")
    revalidatePath("/categories")

    return { success: true }
  } catch (error) {
    console.error(`Error deleting category ${id}:`, error)
    return { success: false, error: "Erreur lors de la suppression de la catégorie" }
  }
}
