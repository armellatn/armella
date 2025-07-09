"use server"

import db from "@/lib/db"
import { revalidatePath } from "next/cache"

export type Product = {
  id: number
  code_produit: string
  nom: string
  marque: string
  categorie_id: number
  prix_vente: number
  stock_quantite: number
  puissance: string
  diametre: string
  duree_port: string
}

export type Client = {
  id: number
  nom: string
  prenom: string
  email: string
  telephone: string
}

export type CartItem = {
  id: number
  product: Product
  quantity: number
  price: number
  total: number
}

// 🛒 Produits disponibles
export async function getProducts() {
  try {
    const result = await db.query(`
      SELECT id, code_produit, nom, marque, categorie_id,
             prix_vente::float AS prix_vente,
             stock_quantite, puissance, diametre, duree_port
      FROM produits
      WHERE stock_quantite > 0
      ORDER BY nom ASC
    `)
    return result.rows
  } catch (error) {
    console.error("❌ Error fetching products:", error)
    return []
  }
}

// 👤 Clients
export async function getClients() {
  try {
    const result = await db.query(`
      SELECT id, nom, prenom, email, telephone
      FROM clients
      ORDER BY nom ASC, prenom ASC
    `)
    return result.rows
  } catch (error) {
    console.error("❌ Error fetching clients:", error)
    return []
  }
}

// ✅ Création d'une vente
export async function createSale(
  clientId: number | null,
  items: CartItem[],
  total: number,
  discount: number,
  paymentMethod: string,
  notes: string
) {
  const clientValue = clientId ?? null

  try {
    const date = new Date()
    const invoiceNumber = `INV-${date.getFullYear()}${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}-${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`

    const result = await db.query(
      `INSERT INTO ventes (
        numero_facture, client_id, montant_total, remise, montant_paye, methode_paiement, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      [invoiceNumber, clientValue, total, discount, total - discount, paymentMethod, notes]
    )

    const saleId = result.rows[0].id

    for (const item of items) {
      await db.query(
        `INSERT INTO details_vente (
          vente_id, produit_id, quantite, prix_unitaire, montant_total
        ) VALUES ($1, $2, $3, $4, $5)`,
        [saleId, item.product.id, item.quantity, item.price, item.total]
      )

      await db.query(
        `UPDATE produits
         SET stock_quantite = stock_quantite - $1
         WHERE id = $2`,
        [item.quantity, item.product.id]
      )

      await db.query(
        `INSERT INTO mouvements_stock (
          produit_id, quantite, type_mouvement, reference_id, reference_type, notes
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          item.product.id,
          -item.quantity,
          "sortie",
          saleId,
          "vente",
          `Vente ${invoiceNumber}`,
        ]
      )
    }

    // Revalidation
    revalidatePath("/pos")
    revalidatePath("/produits")
    revalidatePath("/factures")

    return { success: true, invoiceNumber }
  } catch (error) {
    console.error("❌ Error creating sale:", error)
    return { success: false, error: "Erreur lors de l'enregistrement de la vente" }
  }
}

// 📄 Liste des factures
export async function getInvoices(limit = 50) {
  try {
    const result = await db.query(
      `SELECT v.id, v.numero_facture, v.date_vente, v.montant_total, v.remise,
              v.montant_paye, v.methode_paiement, v.statut,
              c.nom || ' ' || c.prenom as client_nom
       FROM ventes v
       LEFT JOIN clients c ON v.client_id = c.id
       ORDER BY v.date_vente DESC
       LIMIT $1`,
      [limit]
    )
    return result.rows
  } catch (error) {
    console.error("❌ Error fetching invoices:", error)
    return []
  }
}

// 🧾 Détail d’une facture
export async function getInvoiceDetails(id: number) {
  try {
    const invoiceResult = await db.query(
      `SELECT v.*, c.nom as client_nom, c.prenom as client_prenom,
              c.email as client_email, c.telephone as client_telephone
       FROM ventes v
       LEFT JOIN clients c ON v.client_id = c.id
       WHERE v.id = $1`,
      [id]
    )

    const invoice = invoiceResult.rows[0]
    if (!invoice) return null

    const itemsResult = await db.query(
      `SELECT dv.*, p.nom as produit_nom, p.marque as produit_marque
       FROM details_vente dv
       JOIN produits p ON dv.produit_id = p.id
       WHERE dv.vente_id = $1
       ORDER BY dv.id ASC`,
      [id]
    )

    return {
      ...invoice,
      items: itemsResult.rows,
    }
  } catch (error) {
    console.error(`❌ Error fetching invoice ${id}:`, error)
    return null
  }
}

// 🔍 Recherche client
export async function searchClients(query: string) {
  try {
    const result = await db.query(`
      SELECT id, nom, prenom, email, telephone
      FROM clients
      WHERE nom ILIKE $1 OR prenom ILIKE $1 OR telephone ILIKE $1
      ORDER BY nom, prenom
    `, [`%${query}%`])
    return result.rows
  } catch (error) {
    console.error("❌ Error searching clients:", error)
    return []
  }
}

// ➕ Création d’un nouveau client
export async function createClient({
  nom,
  prenom,
  telephone,
  email = "",
}: {
  nom: string
  prenom: string
  telephone: string
  email?: string
}) {
  try {
    const result = await db.query(`
      INSERT INTO clients (nom, prenom, telephone, email)
      VALUES ($1, $2, $3, $4)
      RETURNING id, nom, prenom, telephone, email
    `, [nom, prenom, telephone, email])
    return result.rows[0]
  } catch (error) {
    console.error("❌ Error creating client:", error)
    return null
  }
}
