"use server"
import db from "@/lib/db"
export async function getColissimoSales() {
  const { rows } = await db.query(`
    SELECT v.id,
           v.numero_facture,
           v.date_vente,
           v.montant_total::float              AS montant_total,
           v.statut,
           c.nom || ' ' || c.prenom            AS client_nom,
           string_agg(
             p.nom || ' x' || dv.quantite,     -- ex. "ALOE GRAY 1ans x2"
             E'\n'                             -- ← séparateur retour-ligne
             ORDER BY p.nom
           )                                   AS produits
    FROM   ventes v
           JOIN details_vente dv ON dv.vente_id = v.id
           JOIN produits       p ON p.id       = dv.produit_id
           LEFT JOIN clients   c ON v.client_id = c.id
    WHERE  v.type_vente = 'colissimo'
    GROUP  BY v.id, c.nom, c.prenom, v.numero_facture,
              v.date_vente, v.montant_total, v.statut
    ORDER  BY v.date_vente DESC
  `)
  return rows
}
/* …déjà présent… */

export async function getColissimoReturns() {
  const { rows } = await db.query(`
    SELECT r.id,
           r.date_retour,
           p.nom                         AS produit,
           r.quantite,
           r.montant_total::float        AS montant_total,
           r.notes,
           r.type_vente
    FROM   retours r
           JOIN produits p ON p.id = r.produit_id
    WHERE  r.type_vente = 'colissimo'
    ORDER  BY r.date_retour DESC
  `)
  return rows
}
