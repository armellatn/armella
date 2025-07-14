/* ------------------------------------------------------------------
   Page /colissimo  –  Server Component
------------------------------------------------------------------- */

import { getColissimoSales } from "./actions"
import { getProducts } from "@/app/pos/actions"
import ReturnFormWrapper from "./return-form-wrapper"   // ← wrapper client

/* UI (serveur) */
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table"
import { Eye } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Ventes Colissimo" }

export default async function ColissimoPage() {
  const [ventes, produits] = await Promise.all([
    getColissimoSales(),
    getProducts(),
  ])

  const fmt = (n: number) => n.toFixed(2)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commandes Colissimo</CardTitle>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        {/* ---------- Formulaire Retour (client) ---------- */}
        <ReturnFormWrapper products={produits} />

        {/* ---------- Tableau ventes ---------- */}
        {ventes.length === 0 ? (
          <p className="text-muted-foreground">Aucune commande Colissimo.</p>
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
      </CardContent>
    </Card>
  )
}
