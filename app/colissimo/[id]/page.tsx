/**
 * Détail d'une vente Colissimo
 */

import { getInvoiceDetails } from "@/app/pos/actions"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function ColissimoInvoicePage({
  params,
}: {
  params: { id: string }
}) {
  const invoice = await getInvoiceDetails(Number(params.id))
  if (!invoice) return notFound()

  /* petit helper pour caster proprement */
  const fmt = (n: any) => Number(n).toFixed(2)

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        Facture {invoice.numero_facture} – Colissimo
      </h1>

      {/* ---- Infos générales ---- */}
      <section className="border rounded-md p-4 space-y-1">
        <h2 className="font-semibold">Informations générales</h2>
        <p>Date : {new Date(invoice.date_vente).toLocaleDateString()}</p>
        <p>
          Client :{" "}
          {invoice.client_nom
            ? `${invoice.client_nom} ${invoice.client_prenom ?? ""}`
            : "Occasionnel"}
        </p>
        <p>Montant total : {fmt(invoice.montant_total)} TND</p>
        <p>Remise : {fmt(invoice.remise)} TND</p>
        <p>Mode de paiement : {invoice.methode_paiement}</p>
      </section>

      {/* ---- Articles ---- */}
      <section className="border rounded-md p-4">
        <h2 className="font-semibold mb-2">Articles</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-1">Produit</th>
              <th className="text-right py-1">PU</th>
              <th className="text-right py-1">Qté</th>
              <th className="text-right py-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it: any) => (
              <tr key={it.id} className="border-b last:border-none">
                <td>{it.produit_nom}</td>
                <td className="text-right">{fmt(it.prix_unitaire)} </td>
                <td className="text-right">{it.quantite}</td>
                <td className="text-right">{fmt(it.montant_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}
