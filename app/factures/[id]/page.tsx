import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Printer } from "lucide-react"
import { getInvoiceDetails } from "../../pos/actions"

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
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
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facture {invoice.numero_facture}</h1>
          <p className="text-muted-foreground">Émise le {formatDate(invoice.date_vente)}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/factures">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
          <Link href={`/factures/${invoiceId}/imprimer`} target="_blank">
            <Button>
              <Printer className="mr-2 h-4 w-4" />
              Imprimer
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="font-medium">Statut:</dt>
              <dd>
                <Badge variant={invoice.statut === "complété" ? "success" : "outline"}>{invoice.statut}</Badge>
              </dd>

              <dt className="font-medium">Client:</dt>
              <dd>
                {invoice.client_nom && invoice.client_prenom
                  ? `${invoice.client_nom} ${invoice.client_prenom}`
                  : "Client occasionnel"}
              </dd>

              {invoice.client_email && (
                <>
                  <dt className="font-medium">Email:</dt>
                  <dd>{invoice.client_email}</dd>
                </>
              )}

              {invoice.client_telephone && (
                <>
                  <dt className="font-medium">Téléphone:</dt>
                  <dd>{invoice.client_telephone}</dd>
                </>
              )}

              <dt className="font-medium">Méthode de paiement:</dt>
              <dd className="capitalize">{invoice.methode_paiement}</dd>

              {invoice.notes && (
                <>
                  <dt className="font-medium col-span-2">Notes:</dt>
                  <dd className="col-span-2">{invoice.notes}</dd>
                </>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Résumé</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="font-medium">Sous-total:</dt>
              <dd className="text-right">{formatPrice(invoice.montant_total)} TND</dd>

              <dt className="font-medium">Remise:</dt>
              <dd className="text-right">{formatPrice(invoice.remise)} TND</dd>

              <dt className="font-medium border-t pt-2 mt-2">Total:</dt>
              <dd className="text-right font-bold border-t pt-2 mt-2">{formatPrice(invoice.montant_paye)} TND</dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Articles</CardTitle>
          <CardDescription>Détails des produits vendus</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead className="text-right">Prix unitaire</TableHead>
                <TableHead className="text-right">Quantité</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.produit_nom}</div>
                    <div className="text-xs text-muted-foreground">{item.produit_marque}</div>
                  </TableCell>
                  <TableCell className="text-right">{formatPrice(item.prix_unitaire)} TND</TableCell>
                  <TableCell className="text-right">{item.quantite}</TableCell>
                  <TableCell className="text-right">{formatPrice(item.montant_total)} TND</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
