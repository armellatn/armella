import { getTodaySales } from "./actions"
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

export const metadata = { title: "Ventes d’aujourd’hui" }

export default async function TodaySalesPage() {
  const ventes = await getTodaySales()
  const fmt = (n: number) => n.toFixed(2)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventes d’aujourd’hui</CardTitle>
      </CardHeader>

      <CardContent>
        {ventes.length === 0 ? (
          <p className="text-muted-foreground">
            Aucune vente enregistrée aujourd’hui.
          </p>
        ) : (
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">N° facture</TableHead>
                <TableHead className="w-60">Client</TableHead>
                <TableHead className="w-[380px]">Produits</TableHead>
                <TableHead className="w-28 text-right">Total</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {ventes.map(v => (
                <TableRow key={v.id}>
                  <TableCell>{v.numero_facture}</TableCell>
                  <TableCell>{v.client || "Occasionnel"}</TableCell>
                  <TableCell className="whitespace-pre-line">
                    {v.produits}
                  </TableCell>
                  <TableCell className="text-right">
                    {fmt(v.total)} TND
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
