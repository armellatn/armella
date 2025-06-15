import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SalesChart } from "@/components/sales-chart"
import { TopProductsChart } from "@/components/top-products-chart"
import { getMonthlySalesData, getTopSellingProducts } from "@/lib/data"
import { getStockStats, getTopStockedProducts } from "@/lib/data"

import { TopStockProductsChart } from "@/components/top-stock-products-chart"

export default async function ReportsPage() {
  const monthlySalesData = await getMonthlySalesData()
  const topSellingProducts = await getTopSellingProducts()

const stockStats = await getStockStats()
const topStockProducts = await getTopStockedProducts()
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rapports</h1>
        <p className="text-muted-foreground">Analysez les performances de votre boutique</p>
      </div>

      <Tabs defaultValue="ventes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ventes">Ventes</TabsTrigger>
          <TabsTrigger value="produits">Produits</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
        </TabsList>

        <TabsContent value="ventes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ventes mensuelles</CardTitle>
              <CardDescription>Évolution des ventes sur les 12 derniers mois</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <SalesChart data={monthlySalesData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="produits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Produits les plus vendus</CardTitle>
              <CardDescription>Top 5 des produits les plus vendus (30 derniers jours)</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <TopProductsChart data={topSellingProducts} />
            </CardContent>
          </Card>
        </TabsContent>

<TabsContent value="stock" className="space-y-4">
  <Card>
    <CardHeader>
      <CardTitle>Analyse du stock</CardTitle>
      <CardDescription>Statistiques sur l'état du stock</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4 text-sm">
      <div><strong>Nombre de produits :</strong> {stockStats.totalProduits}</div>
      <div><strong>Quantité totale en stock :</strong> {stockStats.totalQuantite}</div>
      <div><strong>Valeur totale du stock :</strong> {stockStats.valeurTotaleStock.toFixed(2)} TND</div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Top 5 produits avec le plus de stock</CardTitle>
    </CardHeader>
    <CardContent className="h-[400px]">
      <TopStockProductsChart data={topStockProducts} />
    </CardContent>
  </Card>
</TabsContent>

      </Tabs>
    </div>
  )
}
