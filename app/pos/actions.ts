/* ------------------------------------------------------------------ */
/*  actions.ts – opérations serveur du POS                            */
/* ------------------------------------------------------------------ */

"use server"

import db from "@/lib/db"
import { revalidatePath } from "next/cache"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export type SaleType = "boutique" | "colissimo" | "testeur"

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

/* ------------------------------------------------------------------ */
/*  Produits                                                           */
/* ------------------------------------------------------------------ */
export async function getProducts() {
  try {
    const { rows } = await db.query(`
      SELECT id, code_produit, nom, marque, categorie_id,
             prix_vente::float AS prix_vente,
             stock_quantite, puissance, diametre, duree_port
      FROM produits
      WHERE stock_quantite > 0
      ORDER BY nom ASC
    `)
    return rows
  } catch (e) {
    console.error("❌ Error fetching products:", e)
    return []
  }
}

/* ------------------------------------------------------------------ */
/*  Clients                                                            */
/* ------------------------------------------------------------------ */
export async function getClients() {
  try {
    const { rows } = await db.query(`
      SELECT id, nom, prenom, email, telephone
      FROM clients
      ORDER BY nom ASC, prenom ASC
    `)
    return rows
  } catch (e) {
    console.error("❌ Error fetching clients:", e)
    return []
  }
}

/* ------------------------------------------------------------------ */
/*  Création d’une vente                                               */
/* ------------------------------------------------------------------ */
export async function createSale(
  clientId: number | null,
  items: CartItem[],
  total: number,
  discount: number,
  paymentMethod: string,
  notes: string,
  saleType: SaleType,
) {
  const clientValue = clientId ?? null

  try {
    /* Numéro de facture horodaté */
    const d = new Date()
    const invoiceNumber = `INV-${d.getFullYear()}${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${d.getDate().toString().padStart(2, "0")}-${Math.random()
      .toString()
      .slice(2, 5)}`

    /* Insertion vente */
    const { rows } = await db.query(
      `INSERT INTO ventes (
         numero_facture, client_id, montant_total, remise,
         montant_paye, methode_paiement, notes, type_vente
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id`,
      [
        invoiceNumber,
        clientValue,
        total,
        discount,
        total - discount,
        paymentMethod,
        notes,
        saleType,
      ],
    )

    const saleId = rows[0].id

    /* Détails + mouvements stock */
    for (const item of items) {
      await db.query(
        `INSERT INTO details_vente (
           vente_id, produit_id, quantite, prix_unitaire, montant_total
         )
         VALUES ($1,$2,$3,$4,$5)`,
        [saleId, item.product.id, item.quantity, item.price, item.total],
      )

      await db.query(
        `UPDATE produits
           SET stock_quantite = stock_quantite - $1
         WHERE id = $2`,
        [item.quantity, item.product.id],
      )

      await db.query(
        `INSERT INTO mouvements_stock (
           produit_id, quantite, type_mouvement,
           reference_id, reference_type, notes
         )
         VALUES ($1,$2,'sortie',$3,'vente',$4)`,
        [
          item.product.id,
          -item.quantity,
          saleId,
          `Vente ${invoiceNumber}`,
        ],
      )
    }

    /* Revalidation ISR */
    revalidatePath("/pos")
    revalidatePath("/produits")
    revalidatePath("/factures")

    return { success: true, invoiceNumber }
  } catch (e) {
    console.error("❌ Error creating sale:", e)
    return { success: false, error: "Erreur lors de l'enregistrement de la vente" }
  }
}

/* ------------------------------------------------------------------ */
/*  Factures (liste + détail) – inchangé, ajouter v.type_vente si besoin */
/* ------------------------------------------------------------------ */

export async function getInvoices() {
  try {
    const { rows } = await db.query(
      `SELECT v.id, v.numero_facture, v.date_vente, v.montant_total,
              v.remise, v.montant_paye, v.methode_paiement,
              v.statut, v.type_vente,
              c.nom || ' ' || c.prenom AS client_nom
       FROM ventes v
       LEFT JOIN clients c ON v.client_id = c.id
       ORDER BY v.date_vente DESC`,
    )
    return rows
  } catch (e) {
    console.error("❌ Error fetching invoices:", e)
    return []
  }
}

export async function getInvoiceDetails(id: number) {
  try {
    const invoiceRes = await db.query(
      `SELECT v.*, c.nom AS client_nom, c.prenom AS client_prenom,
              c.email AS client_email, c.telephone AS client_telephone
       FROM ventes v
       LEFT JOIN clients c ON v.client_id = c.id
       WHERE v.id = $1`,
      [id],
    )
    const invoice = invoiceRes.rows[0]
    if (!invoice) return null

    const itemsRes = await db.query(
      `SELECT dv.*, p.nom AS produit_nom, p.marque AS produit_marque
       FROM details_vente dv
       JOIN produits p ON dv.produit_id = p.id
       WHERE dv.vente_id = $1
       ORDER BY dv.id ASC`,
      [id],
    )

    return { ...invoice, items: itemsRes.rows }
  } catch (e) {
    console.error(`❌ Error fetching invoice ${id}:`, e)
    return null
  }
}

/* ------------------------------------------------------------------ */
/*  Recherche & création client – inchangées                           */
/* ------------------------------------------------------------------ */

export async function searchClients(q: string) {
  try {
    const { rows } = await db.query(
      `SELECT id, nom, prenom, email, telephone
       FROM clients
       WHERE nom ILIKE $1 OR prenom ILIKE $1 OR telephone ILIKE $1
       ORDER BY nom, prenom`,
      [`%${q}%`],
    )
    return rows
  } catch (e) {
    console.error("❌ Error searching clients:", e)
    return []
  }
}

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
    const { rows } = await db.query(
      `INSERT INTO clients (nom, prenom, telephone, email)
       VALUES ($1,$2,$3,$4)
       RETURNING id, nom, prenom, telephone, email`,
      [nom, prenom, telephone, email],
    )
    return rows[0]
  } catch (e) {
    console.error("❌ Error creating client:", e)
    return null
  }
}
