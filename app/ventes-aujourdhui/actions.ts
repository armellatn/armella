"use server"

import db from "@/lib/db"

/**
 * Renvoie toutes les ventes du jour, avec les produits et quantités
 * au format « NOM xQTE » séparés par un retour à la ligne.
 */
export async function getTodaySales() {
  const { rows } = await db.query(`
    SELECT v.id,
           v.numero_facture,
           v.montant_total::float                       AS total,
           c.nom || ' ' || c.prenom                     AS client,
           string_agg(
             p.nom || ' x' || dv.quantite,
             E'\n'            ORDER BY p.nom
           )                                            AS produits
    FROM   ventes v
           JOIN details_vente dv ON dv.vente_id  = v.id
           JOIN produits       p ON p.id         = dv.produit_id
           LEFT JOIN clients   c ON v.client_id  = c.id
    WHERE  v.date_vente::date = CURRENT_DATE
    GROUP  BY v.id, c.nom, c.prenom, v.numero_facture, v.montant_total
    ORDER  BY v.id DESC
  `)

  return rows
}
