import { redirect } from "next/navigation"
import { getSession } from "@/app/auth/actions" 

import {
  getStockAlerts,
  getRecentSales,
  getDashboardStats,
  getMonthlySalesData,
  getTopSellingProducts,
} from "@/lib/data"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CircleDollarSign, Package, ShoppingCart, Users } from "lucide-react"
import { SalesChart } from "@/components/sales-chart"
import { TopProductsChart } from "@/components/top-products-chart"

export default async function DashboardPage() {
  const session = await getSession()

  // 🚫 Si l'utilisateur est caissier => redirect
  if (!session || session.userRole?.toLowerCase() === "utilisateur") {
    redirect("/pos")
  }

  const {
    totalProducts,
    totalCustomers,
    totalSales,
    lowStockCount,
    recentSalesCount,
    currentMonthRevenue,
    revenueChangePercentage,
  } = await getDashboardStats()

  const stockAlerts = await getStockAlerts()
  const recentSales = await getRecentSales()
  const monthlySalesData = await getMonthlySalesData()
  const topSellingProducts = await getTopSellingProducts()

  const formatPrice = (price: number | string | null | undefined): string => {
    if (price === null || price === undefined) return "0.00"
    const numericPrice = typeof price === "string" ? parseFloat(price) : price
    return isNaN(numericPrice) ? "0.00" : numericPrice.toFixed(2)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">Aperçu de votre boutique de lentilles de contact</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="analytics">Analytiques</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produits en stock</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProducts}</div>
                <p className="text-xs text-muted-foreground">{lowStockCount} produits en stock faible</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCustomers}</div>
                <p className="text-xs text-muted-foreground">Base de clients</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ventes</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSales}</div>
                <p className="text-xs text-muted-foreground">+{recentSalesCount} depuis 24h</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenus</CardTitle>
                <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(currentMonthRevenue)} TND</div>
                <p className="text-xs text-muted-foreground">
                  {revenueChangePercentage > 0 ? "+" : ""}
                  {typeof revenueChangePercentage === "number" ? revenueChangePercentage.toFixed(1) : "0.0"}% depuis le mois dernier
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Ventes récentes</CardTitle>
                <CardDescription>{recentSales.length} ventes effectuées récemment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentSales.map((sale) => (
                    <div key={sale.id} className="flex items-center">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{sale.clientName}</p>
                        <p className="text-sm text-muted-foreground">{sale.date}</p>
                      </div>
                      <div className="ml-auto font-medium">+{formatPrice(sale.amount)} TND</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Stock faible</CardTitle>
                <CardDescription>Produits nécessitant un réapprovisionnement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stockAlerts.map((product) => (
                    <div key={product.id} className="flex items-center">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.brand}</p>
                      </div>
                      <div className="ml-auto font-medium text-red-500">
                        {product.stock} / {product.min_stock}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Ventes mensuelles</CardTitle>
                <CardDescription>Évolution des ventes sur les 12 derniers mois</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <SalesChart data={monthlySalesData} />
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Produits les plus vendus</CardTitle>
                <CardDescription>Top 5 des produits les plus vendus (30 derniers jours)</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <TopProductsChart data={topSellingProducts} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
