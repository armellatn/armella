/* ------------------------------------------------------------------
   Page /colissimo – ventes, retours, export PDF
------------------------------------------------------------------- */
import { getColissimoSales, getColissimoReturns } from "./actions"
import { getProducts }       from "@/app/pos/actions"
import ReturnFormWrapper     from "./return-form-wrapper"

/* UI */
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table"
import { Eye } from "lucide-react"
import Link   from "next/link"
import ExportRetourPDF from "./export-retour-pdf-button"   // ← nouveau

export const metadata = { title: "Colissimo – ventes & retours" }

export default async function ColissimoPage() {
  const [ventes, produits, retours] = await Promise.all([
    getColissimoSales(),
    getProducts(),
    getColissimoReturns(),
  ])

  const fmt = (n: number) => n.toFixed(2)

  /* ----- TOTAL retours pour info ----- */
  const totalRet   = retours.reduce((s,r) => s + r.montant_total, 0)
  const nbRet      = retours.length

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Commandes Colissimo</CardTitle>
        {nbRet > 0 && <ExportRetourPDF retours={retours} />}
      </CardHeader>

      <CardContent className="space-y-10 overflow-x-auto">

        {/* -------- formulaire RETOUR (client) -------- */}
        <ReturnFormWrapper products={produits} />

        {/* -------- Tableau VENTES -------- */}
        <section>
          <h3 className="font-semibold mb-2">Ventes</h3>
          {ventes.length === 0 ? (
            <p className="text-muted-foreground">Aucune vente Colissimo.</p>
          ) : (
            <Table className="min-w-[1040px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-44">N° facture</TableHead>
                  <TableHead className="w-32">Date</TableHead>
                  <TableHead className="w-72">Produits</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="w-32 text-right">Total</TableHead>
                  <TableHead className="w-24 text-center">Statut</TableHead>
                  <TableHead className="w-16 text-center">Voir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventes.map(v => (
                  <TableRow key={v.id}>
                    <TableCell>{v.numero_facture}</TableCell>
                    <TableCell>{new Date(v.date_vente).toLocaleDateString()}</TableCell>
                    <TableCell className="whitespace-pre-line">{v.produits}</TableCell>
                    <TableCell>{v.client_nom || "Occasionnel"}</TableCell>
                    <TableCell className="text-right">{fmt(v.montant_total)} TND</TableCell>
                    <TableCell className="text-center capitalize">{v.statut}</TableCell>
                    <TableCell className="text-center">
                      <Link
                        href={`/colissimo/${v.id}`}
                        target="_blank"
                        className="inline-block p-1 hover:bg-muted rounded-md"
                        title="Voir le détail"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>

        {/* -------- Tableau RETOURS -------- */}
        <section>
          <h3 className="font-semibold mb-2">
            Retours ({nbRet}) – total&nbsp;{fmt(totalRet)}&nbsp;TND
          </h3>
          {nbRet === 0 ? (
            <p className="text-muted-foreground">Aucun retour Colissimo.</p>
          ) : (
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Date</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead className="w-16 text-right">Qté</TableHead>
                  <TableHead className="w-24 text-right">Montant</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retours.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{new Date(r.date_retour).toLocaleDateString()}</TableCell>
                    <TableCell>{r.produit}</TableCell>
                    <TableCell className="text-right">{r.quantite}</TableCell>
                    <TableCell className="text-right">{fmt(r.montant_total)} TND</TableCell>
                    <TableCell>{r.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>

      </CardContent>
    </Card>
  )
}
