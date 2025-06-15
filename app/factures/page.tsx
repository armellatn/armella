import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getInvoices } from "../pos/actions"
import InvoicesTable from "./invoices-table"

export default async function InvoicesPage() {
  const invoices = await getInvoices()

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Factures</h1>
        <p className="text-muted-foreground">Historique des ventes et factures</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des factures</CardTitle>
          <CardDescription>Liste des factures filtrables par date avec export PDF / Excel</CardDescription>
        </CardHeader>
        <CardContent>
          <InvoicesTable invoices={invoices} />
        </CardContent>
      </Card>
    </div>
  )
}
