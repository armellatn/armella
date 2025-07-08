import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import POSSystem from "./pos-system"
import { getProducts, getClients } from "./actions"
import { getCategories } from "../produits/actions"

export default async function POSPage() {
  const [products, clients, categories] = await Promise.all([
    getProducts(),
    getClients(),
    getCategories(),
  ])

  // Extraire les valeurs uniques pour les nouveaux filtres
const marques = Array.from(
  new Map(
    products
      .filter(p => p.marque)
      .map(p => [p.marque.toLowerCase(), p.marque])
  ).values()
)

  const puissances = Array.from(new Set(products.map(p => p.puissance).filter(Boolean)))
  const durees = Array.from(new Set(products.map(p => p.duree_port).filter(Boolean)))

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Point de Vente</h1>
        <p className="text-muted-foreground">
          Système de caisse pour votre boutique de lentilles
        </p>
      </div>

      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Caisse enregistreuse</CardTitle>
          <CardDescription>
            Enregistrez les ventes et imprimez les reçus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <POSSystem
            products={products}
            clients={clients}
            categories={categories}
            marques={marques}
            puissances={puissances}
            durees={durees}
          />
        </CardContent>
      </Card>
    </div>
  )
}
