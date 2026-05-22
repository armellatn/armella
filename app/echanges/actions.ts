"use server"

import db from "@/lib/db"
import { revalidatePath } from "next/cache"
import { logAction } from "@/lib/historique"

/* ─────────────────────────── Types ──────────────────────────── */

export type TypeOperation = "retour" | "echange"

export interface DetailEchangeInput {
  produit_id: number
  quantite: number
  prix_unitaire: number
  sens: "retour" | "sortie"
}

export type TypeVenteOrigine = "boutique" | "colissimo"

export interface CreateEchangeInput {
  type_operation: TypeOperation
  type_vente_origine: TypeVenteOrigine
  client_id: number | null
  vente_originale_id: number | null
  items: DetailEchangeInput[]
  methode_paiement: string
  notes: string
  utilisateur_id?: number
  utilisateur_nom?: string
}

export interface EchangeRow {
  id: number
  numero_echange: string
  date_echange: string
  type_operation: TypeOperation
  type_vente_origine: TypeVenteOrigine
  client_nom: string | null
  vente_numero: string | null
  montant_retour: number
  montant_remplacement: number
  montant_net: number
  methode_paiement: string
  notes: string | null
  utilisateur_nom: string | null
}

export interface EchangeDetail {
  produit_nom: string
  marque: string
  quantite: number
  prix_unitaire: number
  montant_total: number
  sens: "retour" | "sortie"
}

/* ─────────────────────────── Selectors ───────────────────────── */

export async function getEchanges(): Promise<EchangeRow[]> {
  try {
    const { rows } = await db.query(`
      SELECT
        e.id,
        e.numero_echange,
        e.date_echange,
        e.type_operation,
        e.type_vente_origine,
        e.montant_retour::float        AS montant_retour,
        e.montant_remplacement::float  AS montant_remplacement,
        e.montant_net::float           AS montant_net,
        e.methode_paiement,
        e.notes,
        e.utilisateur_nom,
        CASE WHEN c.id IS NOT NULL
             THEN c.nom || ' ' || c.prenom
             ELSE NULL END              AS client_nom,
        v.numero_facture                AS vente_numero
      FROM   echanges e
      LEFT JOIN clients c ON c.id = e.client_id
      LEFT JOIN ventes  v ON v.id = e.vente_originale_id
      ORDER  BY e.date_echange DESC
    `)
    return rows
  } catch (err) {
    console.error("❌ getEchanges:", err)
    return []
  }
}

export async function getEchangeDetails(echangeId: number): Promise<EchangeDetail[]> {
  try {
    const { rows } = await db.query(`
      SELECT
        p.nom          AS produit_nom,
        p.marque,
        d.quantite,
        d.prix_unitaire::float  AS prix_unitaire,
        d.montant_total::float  AS montant_total,
        d.sens
      FROM   details_echange d
      JOIN   produits p ON p.id = d.produit_id
      WHERE  d.echange_id = $1
      ORDER  BY d.sens, p.nom
    `, [echangeId])
    return rows
  } catch (err) {
    console.error("❌ getEchangeDetails:", err)
    return []
  }
}

export async function getEchangesStats() {
  try {
    const { rows } = await db.query(`
      SELECT
        COUNT(*)                                            AS total_count,
        COUNT(*) FILTER (WHERE type_operation = 'retour')  AS retours_count,
        COUNT(*) FILTER (WHERE type_operation = 'echange') AS echanges_count,
        COUNT(*) FILTER (WHERE type_vente_origine = 'boutique')   AS boutique_count,
        COUNT(*) FILTER (WHERE type_vente_origine = 'colissimo')  AS colissimo_count,
        COALESCE(SUM(montant_retour), 0)::float            AS total_retour,
        COALESCE(SUM(montant_remplacement), 0)::float      AS total_remplacement,
        COALESCE(SUM(montant_net), 0)::float               AS total_net,
        COALESCE(SUM(montant_net) FILTER (WHERE type_vente_origine = 'boutique'),  0)::float AS net_boutique,
        COALESCE(SUM(montant_net) FILTER (WHERE type_vente_origine = 'colissimo'), 0)::float AS net_colissimo
      FROM echanges
      WHERE date_echange >= date_trunc('month', CURRENT_DATE)
    `)
    return {
      totalCount:       parseInt(rows[0].total_count) || 0,
      retoursCount:     parseInt(rows[0].retours_count) || 0,
      echangesCount:    parseInt(rows[0].echanges_count) || 0,
      boutiqueCount:    parseInt(rows[0].boutique_count) || 0,
      colissimoCount:   parseInt(rows[0].colissimo_count) || 0,
      totalRetour:      rows[0].total_retour,
      totalRemplacement:rows[0].total_remplacement,
      totalNet:         rows[0].total_net,
      netBoutique:      rows[0].net_boutique,
      netColissimo:     rows[0].net_colissimo,
    }
  } catch (err) {
    console.error("❌ getEchangesStats:", err)
    return {
      totalCount: 0, retoursCount: 0, echangesCount: 0,
      boutiqueCount: 0, colissimoCount: 0,
      totalRetour: 0, totalRemplacement: 0, totalNet: 0,
      netBoutique: 0, netColissimo: 0,
    }
  }
}

/* Products and clients lookups */
export async function getProductsForEchange() {
  try {
    const { rows } = await db.query(`
      SELECT id, code_produit, nom, marque, prix_vente::float AS prix_vente,
             stock_quantite
      FROM   produits
      ORDER  BY nom ASC
    `)
    return rows
  } catch (err) {
    console.error("❌ getProductsForEchange:", err)
    return []
  }
}

export async function getClientsForEchange() {
  try {
    const { rows } = await db.query(`
      SELECT id, nom, prenom, telephone
      FROM   clients
      ORDER  BY nom ASC, prenom ASC
    `)
    return rows
  } catch (err) {
    console.error("❌ getClientsForEchange:", err)
    return []
  }
}

export async function getRecentInvoicesForLookup() {
  try {
    const { rows } = await db.query(`
      SELECT v.id,
             v.numero_facture,
             v.date_vente,
             v.montant_paye::float  AS montant_paye,
             COALESCE(c.nom || ' ' || c.prenom, 'Client occasionnel') AS client_nom,
             json_agg(json_build_object(
               'produit_id',    p.id,
               'produit_nom',   p.nom,
               'marque',        p.marque,
               'quantite',      dv.quantite,
               'prix_unitaire', dv.prix_unitaire::float,
               'montant_total', dv.montant_total::float
             ) ORDER BY p.nom) AS items
      FROM   ventes v
      JOIN   details_vente dv ON dv.vente_id = v.id
      JOIN   produits       p  ON p.id       = dv.produit_id
      LEFT JOIN clients     c  ON c.id       = v.client_id
      GROUP  BY v.id, c.nom, c.prenom
      ORDER  BY v.date_vente DESC
      LIMIT  100
    `)
    return rows
  } catch (err) {
    console.error("❌ getRecentInvoicesForLookup:", err)
    return []
  }
}

/* ─────────────────────────── Mutations ───────────────────────── */

export async function createEchange(input: CreateEchangeInput) {
  const client = await db.connect()

  try {
    await client.query("BEGIN")

    /* ── Validate stock for 'sortie' items ── */
    for (const item of input.items) {
      if (item.sens === "sortie") {
        const { rows } = await client.query(
          `SELECT stock_quantite, nom FROM produits WHERE id = $1`,
          [item.produit_id]
        )
        if (!rows[0] || rows[0].stock_quantite < item.quantite) {
          await client.query("ROLLBACK")
          return {
            success: false,
            error: `Stock insuffisant pour "${rows[0]?.nom ?? "produit inconnu"}" (disponible: ${rows[0]?.stock_quantite ?? 0})`,
          }
        }
      }
    }

    /* ── Compute amounts ── */
    const montant_retour = input.items
      .filter(i => i.sens === "retour")
      .reduce((s, i) => s + i.quantite * i.prix_unitaire, 0)

    const montant_remplacement = input.items
      .filter(i => i.sens === "sortie")
      .reduce((s, i) => s + i.quantite * i.prix_unitaire, 0)

    /* ── Build unique exchange number ── */
    const d = new Date()
    const prefix = input.type_operation === "retour" ? "RET" : "ECH"
    const numero_echange = `${prefix}-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${Math.random().toString().slice(2, 6)}`

    /* ── Insert echange header ── */
    const { rows: echangeRows } = await client.query(
      `INSERT INTO echanges (
         numero_echange, client_id, vente_originale_id, type_operation,
         type_vente_origine, montant_retour, montant_remplacement,
         methode_paiement, notes, utilisateur_id, utilisateur_nom
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id`,
      [
        numero_echange,
        input.client_id ?? null,
        input.vente_originale_id ?? null,
        input.type_operation,
        input.type_vente_origine,
        montant_retour,
        montant_remplacement,
        input.methode_paiement,
        input.notes || null,
        input.utilisateur_id ?? null,
        input.utilisateur_nom ?? null,
      ]
    )
    const echangeId = echangeRows[0].id

    /* ── Insert detail lines + update stock ── */
    for (const item of input.items) {
      const montant = item.quantite * item.prix_unitaire

      await client.query(
        `INSERT INTO details_echange (echange_id, produit_id, quantite, prix_unitaire, montant_total, sens)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [echangeId, item.produit_id, item.quantite, item.prix_unitaire, montant, item.sens]
      )

      /* Stock adjustment */
      const stockDelta = item.sens === "retour" ? item.quantite : -item.quantite
      await client.query(
        `UPDATE produits SET stock_quantite = stock_quantite + $1 WHERE id = $2`,
        [stockDelta, item.produit_id]
      )

      /* Mouvement stock — inline literal like other actions to match DB encoding */
      const notesMvt = item.sens === "retour"
        ? `Retour via ${numero_echange}`
        : `Remplacement échange ${numero_echange}`

      await client.query(
        `INSERT INTO mouvements_stock (produit_id, quantite, type_mouvement, reference_id, reference_type, notes)
         VALUES ($1,$2,'${item.sens === "retour" ? "entree" : "sortie"}',$3,'echange',$4)`,
        [item.produit_id, item.quantite, echangeId, notesMvt]
      )
    }

    await client.query("COMMIT")

    /* ── Audit log ── */
    const montantNet = montant_retour - montant_remplacement
    await logAction({
      typeAction: "ECHANGE_CREATION",
      description: `${input.type_operation === "retour" ? "Retour" : "Échange"} ${numero_echange} — net ${montantNet >= 0 ? "-" : "+"}${Math.abs(montantNet).toFixed(2)} TND`,
      entiteType: "echange",
      entiteId: echangeId,
      utilisateurId: input.utilisateur_id,
      utilisateurNom: input.utilisateur_nom,
      donneesApres: {
        numero_echange,
        type_operation: input.type_operation,
        type_vente_origine: input.type_vente_origine,
        montant_retour,
        montant_remplacement,
        montant_net: montantNet,
      },
    })

    revalidatePath("/echanges")
    revalidatePath("/produits")
    revalidatePath("/recettes")
    revalidatePath("/rapports")

    return { success: true, numero_echange }
  } catch (err) {
    await client.query("ROLLBACK")
    console.error("❌ createEchange:", err)
    return { success: false, error: "Erreur lors de l'enregistrement" }
  } finally {
    client.release()
  }
}

export async function deleteEchange(id: number) {
  const client = await db.connect()

  try {
    await client.query("BEGIN")

    /* Reverse stock movements */
    const { rows: details } = await client.query(
      `SELECT produit_id, quantite, sens FROM details_echange WHERE echange_id = $1`,
      [id]
    )

    for (const d of details) {
      /* Reverse: retour → was +qty → now -qty ; sortie → was -qty → now +qty */
      const reverseDelta = d.sens === "retour" ? -d.quantite : d.quantite
      await client.query(
        `UPDATE produits SET stock_quantite = stock_quantite + $1 WHERE id = $2`,
        [reverseDelta, d.produit_id]
      )
    }

    /* Delete mouvements_stock linked to this echange */
    await client.query(
      `DELETE FROM mouvements_stock WHERE reference_id = $1 AND reference_type = 'echange'`,
      [id]
    )

    /* Delete details then header (cascade would handle it but explicit is safer) */
    const { rows: headerRows } = await client.query(
      `DELETE FROM echanges WHERE id = $1 RETURNING numero_echange, utilisateur_id, utilisateur_nom`,
      [id]
    )

    await client.query("COMMIT")

    if (headerRows[0]) {
      await logAction({
        typeAction: "ECHANGE_SUPPRESSION",
        description: `Annulation échange/retour ${headerRows[0].numero_echange}`,
        entiteType: "echange",
        entiteId: id,
        utilisateurId: headerRows[0].utilisateur_id,
        utilisateurNom: headerRows[0].utilisateur_nom,
      })
    }

    revalidatePath("/echanges")
    revalidatePath("/produits")
    revalidatePath("/recettes")

    return { success: true }
  } catch (err) {
    await client.query("ROLLBACK")
    console.error("❌ deleteEchange:", err)
    return { success: false, error: "Erreur lors de la suppression" }
  } finally {
    client.release()
  }
}

/* ─── Net impact for recettes (this month) ─── */
/* montant_net = montant_retour - montant_remplacement
 *   > 0 → money leaving store  (decreases recette)
 *   < 0 → money coming in      (increases recette, client paid supplement)
 *   = 0 → no financial impact
 * We return the full signed sum so recettes can subtract it correctly. */
export async function getEchangesNetImpact(): Promise<number> {
  try {
    const { rows } = await db.query(`
      SELECT COALESCE(SUM(montant_net), 0)::float AS net
      FROM   echanges
      WHERE  date_echange >= date_trunc('month', CURRENT_DATE)
    `)
    return rows[0].net
  } catch (err) {
    console.error("❌ getEchangesNetImpact:", err)
    return 0
  }
}

/* ─── Product lookup by barcode ─── */
export async function getProductByBarcode(code: string) {
  try {
    const { rows } = await db.query(
      `SELECT id, code_produit, nom, marque, prix_vente::float AS prix_vente,
              stock_quantite
       FROM   produits
       WHERE  code_produit = $1`,
      [code.trim()]
    )
    return rows[0] ?? null
  } catch (err) {
    console.error("❌ getProductByBarcode:", err)
    return null
  }
}

/* ─── Echanges list for factures page ─── */
export async function getEchangesForFactures() {
  try {
    const { rows } = await db.query(`
      SELECT
        e.id,
        e.numero_echange,
        e.date_echange,
        e.type_operation,
        e.montant_retour::float        AS montant_retour,
        e.montant_remplacement::float  AS montant_remplacement,
        e.montant_net::float           AS montant_net,
        e.type_vente_origine,
        e.methode_paiement,
        e.notes,
        e.utilisateur_nom,
        CASE WHEN c.id IS NOT NULL THEN c.nom || ' ' || c.prenom ELSE NULL END AS client_nom
      FROM   echanges e
      LEFT JOIN clients c ON c.id = e.client_id
      ORDER  BY e.date_echange DESC
    `)
    return rows
  } catch (err) {
    console.error("❌ getEchangesForFactures:", err)
    return []
  }
}

/* ── Retraits d'argent ────────────────────────────────────────── */
export interface RetraitRow {
  id: number
  montant: number
  description: string
  date: string
}

export async function getRetraitsForFactures(): Promise<RetraitRow[]> {
  try {
    const { rows } = await db.query(`
      SELECT id, montant::float AS montant, description, date
      FROM   retraits
      ORDER  BY date DESC
    `)
    return rows
  } catch (err) {
    console.error("❌ getRetraitsForFactures:", err)
    return []
  }
}

/* ── Retours Colissimo (table retours) ───────────────────────── */
export interface RetourColissimoRow {
  id: number
  date_retour: string
  produit_nom: string
  code_produit: string
  quantite: number
  montant_total: number
  notes: string | null
}

export async function getRetoursColissimoForFactures(): Promise<RetourColissimoRow[]> {
  try {
    const { rows } = await db.query(`
      SELECT
        r.id,
        r.date_retour,
        p.nom           AS produit_nom,
        p.code_produit,
        r.quantite,
        r.montant_total::float AS montant_total,
        r.notes
      FROM   retours r
      LEFT JOIN produits p ON p.id = r.produit_id
      ORDER  BY r.date_retour DESC
    `)
    return rows
  } catch (err) {
    console.error("❌ getRetoursColissimoForFactures:", err)
    return []
  }
}
