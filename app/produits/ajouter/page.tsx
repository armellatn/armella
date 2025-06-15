import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ProductForm from "../product-form"
import { getCategories } from "../actions"

export default async function AddProductPage() {
  const categories = await getCategories()

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ajouter un produit</h1>
        <p className="text-muted-foreground">Créez un nouveau produit dans votre inventaire</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du produit</CardTitle>
          <CardDescription>Entrez les détails du nouveau produit</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  )
}
