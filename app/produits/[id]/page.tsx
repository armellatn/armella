import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ProductForm from "../product-form"
import { getProduct, getCategories } from "../actions"
import { notFound } from "next/navigation"

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const productId = Number.parseInt(params.id)
  const [product, categories] = await Promise.all([getProduct(productId), getCategories()])

  if (!product) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Modifier un produit</h1>
        <p className="text-muted-foreground">Modifiez les informations du produit</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du produit</CardTitle>
          <CardDescription>Modifiez les détails du produit</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm product={product} categories={categories} />
        </CardContent>
      </Card>
    </div>
  )
}
