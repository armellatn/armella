import { notFound } from "next/navigation"
import db from "@/lib/db"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface PageProps {
  params: { id: string }
}

export default async function ApproDetailsPage({ params }: PageProps) {
  const id = Number(params.id)
  if (isNaN(id)) return notFound()

  // Récupération des infos approvisionnement
  const approRes = await db.query(
    `
    SELECT a.numero_commande, a.date_commande, a.date_reception, a.montant_total,
           a.montant_paye, a.statut_paiement, a.statut, a.notes,
           f.nom AS fournisseur
    FROM approvisionnements a
    LEFT JOIN fournisseurs f ON a.fournisseur_id = f.id
    WHERE a.id = $1
  `,
    [id]
  )

  if (approRes.rows.length === 0) return notFound()
  const appro = approRes.rows[0]
  const reste = Number(appro.montant_total) - Number(appro.montant_paye)

  // Récupération des produits
  const detailsRes = await db.query(
    `
    SELECT p.nom AS produit, p.code_produit, d.quantite, d.prix_unitaire, d.montant_total
    FROM details_approvisionnement d
    JOIN produits p ON d.produit_id = p.id
    WHERE d.approvisionnement_id = $1
    ORDER BY d.id ASC
  `,
    [id]
  )

  // Récupération des paiements
  const paiementsRes = await db.query(
    `
    SELECT id, montant, date_paiement, methode, notes
    FROM paiements_fournisseurs
    WHERE approvisionnement_id = $1
    ORDER BY date_paiement ASC
  `,
    [id]
  )
  const paiements = paiementsRes.rows

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Détails de l’approvisionnement</h1>

      <div className="border rounded-md p-4 bg-card space-y-2 text-sm">
        <p><strong>N° Commande :</strong> {appro.numero_commande}</p>
        <p><strong>Date Commande :</strong> {formatDate(appro.date_commande)}</p>
        <p><strong>Date Réception :</strong> {appro.date_reception ? formatDate(appro.date_reception) : "—"}</p>
        <p><strong>Fournisseur :</strong> {appro.fournisseur || "—"}</p>
        <p><strong>Montant total :</strong> {Number(appro.montant_total).toFixed(2)} TND</p>
        <p><strong>Montant payé :</strong> {Number(appro.montant_paye).toFixed(2)} TND</p>
        <p><strong>Statut paiement :</strong> {appro.statut_paiement}</p>
        <p><strong>Statut :</strong> {appro.statut}</p>
        <p><strong>Reste à payer :</strong>{" "}
          <span className={reste <= 0 ? "text-green-600" : "text-red-600"}>
            {reste.toFixed(2)} TND
          </span>
        </p>
        {appro.notes && <p><strong>Notes :</strong> {appro.notes}</p>}
      </div>

      {/* Produits */}
      <div className="border rounded-md p-4 bg-card">
        <h2 className="text-lg font-semibold mb-4">Produits</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th>Produit</th>
              <th>Quantité</th>
              <th>Prix unitaire</th>
              <th>Montant</th>
            </tr>
          </thead>
          <tbody>
            {detailsRes.rows.map((row: any, i: number) => (
              <tr key={i} className="border-t">
                <td>{row.produit} ({row.code_produit})</td>
                <td>{row.quantite}</td>
                <td>{Number(row.prix_unitaire).toFixed(2)} TND</td>
                <td>{Number(row.montant_total).toFixed(2)} TND</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Historique des paiements */}
      <div className="border rounded-md p-4 bg-card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Historique des paiements</h2>
          <Link href={`/approvisionnements/${id}/payer`}>
            <Button>Ajouter un paiement</Button>
          </Link>
        </div>
        {paiements.length === 0 ? (
          <p className="text-muted-foreground">Aucun paiement enregistré.</p>
        ) : (
          <ul className="text-sm space-y-2">
            {paiements.map((p) => (
              <li key={p.id}>
                <span className="font-medium">{formatDate(p.date_paiement)}</span>:{" "}
                {Number(p.montant).toFixed(2)} TND{" "}
                {p.methode && <em>({p.methode})</em>}
                {p.notes && <span className="ml-2 text-muted-foreground">– {p.notes}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
