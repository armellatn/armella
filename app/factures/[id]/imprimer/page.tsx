"use client"

import { notFound } from "next/navigation"
import { getInvoiceDetails } from "../../../pos/actions"

export default async function PrintInvoicePage({ params }: { params: { id: string } }) {
  const invoiceId = Number.parseInt(params.id)
  const invoice = await getInvoiceDetails(invoiceId)

  if (!invoice) {
    notFound()
  }

  // Fonction pour formater le prix avec 2 décimales
  const formatPrice = (price: any): string => {
    const numPrice = typeof price === "number" ? price : Number(price)
    return isNaN(numPrice) ? "0.00" : numPrice.toFixed(2)
  }

  // Fonction pour formater la date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  const clientName =
    invoice.client_nom && invoice.client_prenom
      ? `${invoice.client_nom} ${invoice.client_prenom}`
      : "Client occasionnel"

  return (
    <div className="print-container p-8 max-w-4xl mx-auto bg-white">
      <style jsx global>{`
        @media print {
          body { 
            padding: 0; 
            margin: 0;
            background: white;
          }
          .print-container {
            padding: 20px;
            max-width: 100%;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">OptiStock</h1>
        <p>Boutique de lentilles de contact</p>
      </div>

      <div className="flex justify-between mb-8">
        <div>
          <h2 className="text-lg font-semibold mb-2">Facturé à:</h2>
          <p>{clientName}</p>
          {invoice.client_email && <p>{invoice.client_email}</p>}
          {invoice.client_telephone && <p>{invoice.client_telephone}</p>}
        </div>
        <div className="text-right">
          <h2 className="text-lg font-semibold mb-2">Facture</h2>
          <p>
            <strong>N°:</strong> {invoice.numero_facture}
          </p>
          <p>
            <strong>Date:</strong> {formatDate(invoice.date_vente)}
          </p>
          <p>
            <strong>Méthode:</strong> {invoice.methode_paiement}
          </p>
        </div>
      </div>

      <table className="w-full mb-8 border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="py-2 text-left">Produit</th>
            <th className="py-2 text-right">Prix unitaire</th>
            <th className="py-2 text-right">Quantité</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item) => (
            <tr key={item.id} className="border-b border-gray-200">
              <td className="py-2">
                <div>{item.produit_nom}</div>
                <div className="text-sm text-gray-600">{item.produit_marque}</div>
              </td>
              <td className="py-2 text-right">{formatPrice(item.prix_unitaire)} TND</td>
              <td className="py-2 text-right">{item.quantite}</td>
              <td className="py-2 text-right">{formatPrice(item.montant_total)} TND</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="py-2 text-right font-semibold">
              Sous-total:
            </td>
            <td className="py-2 text-right">{formatPrice(invoice.montant_total)} TND</td>
          </tr>
          <tr>
            <td colSpan={3} className="py-2 text-right font-semibold">
              Remise:
            </td>
            <td className="py-2 text-right">{formatPrice(invoice.remise)} TND</td>
          </tr>
          <tr className="border-t-2 border-gray-300">
            <td colSpan={3} className="py-2 text-right font-bold">
              Total:
            </td>
            <td className="py-2 text-right font-bold">{formatPrice(invoice.montant_paye)} TND</td>
          </tr>
        </tfoot>
      </table>

      {invoice.notes && (
        <div className="mb-8">
          <h3 className="font-semibold mb-2">Notes:</h3>
          <p>{invoice.notes}</p>
        </div>
      )}

      <div className="text-center text-sm text-gray-600 mt-16">
        <p>Merci pour votre achat!</p>
      </div>

      <div className="mt-8 text-center no-print">
        <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Imprimer
        </button>
      </div>
    </div>
  )
}
