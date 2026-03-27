/* Page Recette du mois – accès direct à PostgreSQL */

import db from "@/lib/db"
import { BadgeCheck, Undo2, Package } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import RecettesTable from "./recettes-table"

export const metadata = { title: "Recette du mois" }

export default async function RecettesPage() {
  /* ---------- Agrégation SQL (mois courant) ---------- */
  const [ventesRes, retraitsRes, retoursRes, salesDetailsRes] = await Promise.all([
    db.query(`
      SELECT COALESCE(SUM(montant_paye), 0)::float AS total
      FROM   ventes
      WHERE  date_vente >= date_trunc('month', CURRENT_DATE)
    `),
    db.query(`
      SELECT COALESCE(SUM(montant), 0)::float AS total
      FROM   retraits
      WHERE  date >= date_trunc('month', CURRENT_DATE)
    `),
    db.query(`
      SELECT COALESCE(SUM(montant_total), 0)::float AS total
      FROM   retours
      WHERE  date_retour >= date_trunc('month', CURRENT_DATE)
    `),
    db.query(`
      SELECT 
        v.id as vente_id,
        v.numero_facture,
        v.date_vente,
        COALESCE(c.nom || ' ' || c.prenom, 'Client occasionnel') as client_nom,
        COALESCE(v.type_vente, 'boutique') as type_vente,
        p.id as produit_id,
        p.nom as produit_nom,
        p.code_produit,
        p.marque as produit_marque,
        cat.nom as categorie,
        dv.quantite,
        dv.prix_unitaire::float as prix_unitaire,
        dv.montant_total::float as montant_total
      FROM details_vente dv
      JOIN ventes v ON dv.vente_id = v.id
      JOIN produits p ON dv.produit_id = p.id
      LEFT JOIN clients c ON v.client_id = c.id
      LEFT JOIN categories cat ON p.categorie_id = cat.id
      WHERE v.date_vente >= date_trunc('month', CURRENT_DATE)
      ORDER BY v.date_vente DESC, v.id DESC
    `),
  ])

  const ventes   = ventesRes.rows[0].total
  const retraits = retraitsRes.rows[0].total
  const retours  = retoursRes.rows[0].total
  const net      = ventes - retraits - retours
  
  const salesDetails = salesDetailsRes.rows.map((item: any) => ({
    venteId: item.vente_id,
    numeroFacture: item.numero_facture || "",
    dateVente: item.date_vente ? new Date(item.date_vente).toLocaleDateString('fr-FR') : "",
    clientNom: item.client_nom || "Client occasionnel",
    typeVente: item.type_vente || "boutique",
    produitId: item.produit_id,
    produitNom: item.produit_nom,
    produitCode: item.code_produit || "",
    produitMarque: item.produit_marque || "",
    categorie: item.categorie || "Non catégorisé",
    quantite: parseInt(item.quantite) || 0,
    prixUnitaire: item.prix_unitaire || 0,
    montantTotal: item.montant_total || 0,
  }))

  const totalProductsSold = salesDetails.reduce((sum: number, d: any) => sum + d.quantite, 0)

  /* --------------------- UI -------------------------- */
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BadgeCheck className="h-6 w-6" />
          Recette du mois
        </h1>
        <p className="text-muted-foreground">Résumé des ventes et détails des produits vendus ce mois</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total ventes</div>
            <div className="text-2xl font-bold text-green-600">{ventes.toFixed(2)} DT</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total retraits</div>
            <div className="text-2xl font-bold text-orange-600">{retraits.toFixed(2)} DT</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Undo2 className="h-3 w-3" /> Total retours
            </div>
            <div className="text-2xl font-bold text-red-600">{retours.toFixed(2)} DT</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Recette nette</div>
            <div className="text-2xl font-bold text-blue-600">{net.toFixed(2)} DT</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Package className="h-3 w-3" /> Produits vendus
            </div>
            <div className="text-2xl font-bold">{totalProductsSold}</div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Details Table with Filters */}
      <RecettesTable salesDetails={salesDetails} />
    </div>
  )
}
