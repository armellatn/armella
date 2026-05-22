import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getInvoices } from "../pos/actions"
import { getEchangesForFactures, getRetraitsForFactures, getRetoursColissimoForFactures } from "../echanges/actions"
import InvoicesTable from "./invoices-table"
import EchangesFacturesTable from "./echanges-factures-table"
import RapportComplet from "./rapport-complet"

export default async function InvoicesPage() {
  const [invoices, echanges, retraits, retoursColissimo] = await Promise.all([
    getInvoices(),
    getEchangesForFactures(),
    getRetraitsForFactures(),
    getRetoursColissimoForFactures(),
  ])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Factures</h1>
        <p className="text-muted-foreground">Historique des ventes, retours, échanges et dépenses</p>
      </div>

      <Tabs defaultValue="rapport">
        <TabsList>
          <TabsTrigger value="rapport">📊 Rapport complet</TabsTrigger>
          <TabsTrigger value="ventes">Ventes ({invoices.length})</TabsTrigger>
          <TabsTrigger value="echanges">Échanges & Retours ({echanges.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="rapport">
          <Card>
            <CardHeader>
              <CardTitle>Rapport financier complet</CardTitle>
              <CardDescription>
                Toutes les entrées et sorties d'argent — ventes, retraits, échanges et retours — avec export PDF / Excel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RapportComplet
                ventes={invoices}
                echanges={echanges}
                retraits={retraits}
                retoursColissimo={retoursColissimo}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ventes">
          <Card>
            <CardHeader>
              <CardTitle>Historique des factures</CardTitle>
              <CardDescription>Liste des factures filtrables par date avec export PDF / Excel</CardDescription>
            </CardHeader>
            <CardContent>
              <InvoicesTable invoices={invoices} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="echanges">
          <Card>
            <CardHeader>
              <CardTitle>Échanges & Retours</CardTitle>
              <CardDescription>Historique de tous les retours et échanges enregistrés</CardDescription>
            </CardHeader>
            <CardContent>
              <EchangesFacturesTable echanges={echanges} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

