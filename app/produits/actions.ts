"use server"

import db from "@/lib/db"
import { revalidatePath } from "next/cache"

export type Product = {
  id: number
  code_produit: string
  nom: string
  marque: string
  categorie: string
  prix_achat: number
  prix_vente: number
  stock_quantite: number
  puissance: string
  diametre: string
  courbure: string
  duree_port: string
}

export async function getProducts() {
  try {
    const result = await db.query(`
      SELECT p.id, p.code_produit, p.nom, p.marque, c.nom as categorie,
             p.prix_achat, p.prix_vente, p.stock_quantite, 
             p.puissance, p.diametre, p.courbure, p.duree_port    
      FROM produits p
      LEFT JOIN categories c ON p.categorie_id = c.id
      ORDER BY p.nom ASC
    `)
    return result.rows
  } catch (error) {
    console.error("Error fetching products:", error)
    return []
  }
}

export async function getProduct(id: number) {
  try {
    const result = await db.query(
      `SELECT p.*, c.nom as categorie_nom
       FROM produits p
       LEFT JOIN categories c ON p.categorie_id = c.id
       WHERE p.id = $1`,
      [id]
    )
    return result.rows[0] || null
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error)
    return null
  }
}

export async function getCategories() {
  try {
    const result = await db.query(`SELECT id, nom FROM categories ORDER BY nom ASC`)
    return result.rows
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

export async function checkProductCodeExists(code: string, excludeId?: number) {
  try {
    let result
    if (excludeId) {
      result = await db.query(
        `SELECT COUNT(*) as count FROM produits WHERE code_produit = $1 AND id != $2`,
        [code, excludeId]
      )
    } else {
      result = await db.query(
        `SELECT COUNT(*) as count FROM produits WHERE code_produit = $1`,
        [code]
      )
    }
    return parseInt(result.rows[0].count) > 0
  } catch (error) {
    console.error("Error checking product code:", error)
    return false
  }
}

export async function createProduct(formData: FormData) {
  const values = [
    formData.get("code_produit"),
    formData.get("nom"),
    formData.get("marque"),
    parseInt(formData.get("categorie_id") as string),
    formData.get("description"),
    parseFloat(formData.get("prix_achat") as string),
    parseFloat(formData.get("prix_vente") as string),
    parseInt(formData.get("stock_quantite") as string),
    parseInt(formData.get("stock_minimum") as string),
    formData.get("puissance"),
    formData.get("diametre"),
    formData.get("courbure"),
    formData.get("duree_port"),
    formData.get("contenu_boite"),
  ]

  try {
    const codeExists = await checkProductCodeExists(values[0] as string)
    if (codeExists) {
      return {
        success: false,
        error: "Ce code produit existe déjà. Veuillez en choisir un autre.",
      }
    }

    await db.query(
      `INSERT INTO produits (
        code_produit, nom, marque, categorie_id, description, 
        prix_achat, prix_vente, stock_quantite, stock_minimum,
        puissance, diametre, courbure, duree_port, contenu_boite
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13, $14
      )`,
      values
    )

    revalidatePath("/produits")
    return { success: true }
  } catch (error) {
    console.error("Error creating product:", error)

    const errorMessage = String(error)
    if (errorMessage.includes("duplicate key") && errorMessage.includes("produits_code_produit_key")) {
      return {
        success: false,
        error: "Ce code produit existe déjà. Veuillez en choisir un autre.",
      }
    }

    return {
      success: false,
      error: "Erreur lors de la création du produit",
    }
  }
}

export async function updateProduct(id: number, formData: FormData) {
  const values = [
    formData.get("code_produit"),
    formData.get("nom"),
    formData.get("marque"),
    parseInt(formData.get("categorie_id") as string),
    formData.get("description"),
    parseFloat(formData.get("prix_achat") as string),
    parseFloat(formData.get("prix_vente") as string),
    parseInt(formData.get("stock_quantite") as string),
    parseInt(formData.get("stock_minimum") as string),
    formData.get("puissance"),
    formData.get("diametre"),
    formData.get("courbure"),
    formData.get("duree_port"),
    formData.get("contenu_boite"),
    id,
  ]

  try {
    const codeExists = await checkProductCodeExists(values[0] as string, id)
    if (codeExists) {
      return {
        success: false,
        error: "Ce code produit est déjà utilisé par un autre produit. Veuillez en choisir un autre.",
      }
    }

    await db.query(
      `UPDATE produits SET
        code_produit = $1,
        nom = $2,
        marque = $3,
        categorie_id = $4,
        description = $5,
        prix_achat = $6,
        prix_vente = $7,
        stock_quantite = $8,
        stock_minimum = $9,
        puissance = $10,
        diametre = $11,
        courbure = $12,
        duree_port = $13,
        contenu_boite = $14,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $15`,
      values
    )

    revalidatePath("/produits")
    return { success: true }
  } catch (error) {
    console.error(`Error updating product ${id}:`, error)

    const errorMessage = String(error)
    if (errorMessage.includes("duplicate key") && errorMessage.includes("produits_code_produit_key")) {
      return {
        success: false,
        error: "Ce code produit est déjà utilisé par un autre produit. Veuillez en choisir un autre.",
      }
    }

    return {
      success: false,
      error: "Erreur lors de la mise à jour du produit",
    }
  }
}

export async function deleteProduct(id: number) {
  try {
    await db.query(`DELETE FROM produits WHERE id = $1`, [id])
    revalidatePath("/produits")
    return { success: true }
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error)
    return { success: false, error: "Erreur lors de la suppression du produit" }
  }
}
