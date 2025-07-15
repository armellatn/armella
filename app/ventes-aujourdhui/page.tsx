/* ------------------------------------------------------------------
   Ventes d’aujourd’hui  –  tableau + bouton PDF
------------------------------------------------------------------- */

import { getTodaySales } from "./actions"
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import PrintButton from "@/components/print-button"
import PrintOnlyAreaStyles from "@/components/print-only-area"   // ← styles print

export const metadata = { title: "Ventes d’aujourd’hui" }

export default async function TodaySalesPage() {
  const ventes = await getTodaySales()
  const fmt = (n: number) => n.toFixed(2)
  const totalDay = ventes.reduce((s, v) => s + v.total, 0)

  return (
    <>
      {/* Injecte le CSS qui ne s’applique qu’en mode print */}
      <PrintOnlyAreaStyles />

      {/* --------- zone à imprimer --------- */}
      <div id="print-area">
        <Card>
          <CardHeader className="flex items-center justify-between print:justify-center">
            <CardTitle>Ventes d’aujourd’hui</CardTitle>
            {/* masqué grâce à .print:hidden dans le composant */}
            <PrintButton />
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

                  {/* Total journée */}
                  <TableRow className="font-semibold border-t">
                    <TableCell colSpan={3} className="text-right">
                      Total journée
                    </TableCell>
                    <TableCell className="text-right">
                      {fmt(totalDay)} TND
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
