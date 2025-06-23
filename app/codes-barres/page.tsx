import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import BarcodeGenerator from "./barcode-generator"
import { getProducts } from "../produits/actions"

export default async function BarcodesPage() {
  const products = await getProducts()

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Codes-barres</h1>
        <p className="text-muted-foreground">Générez et imprimez des codes-barres pour vos produits</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Générateur de codes-barres</CardTitle>
          <CardDescription>Sélectionnez un ou plusieurs produits et générez les codes-barres</CardDescription>
        </CardHeader>
        <CardContent>
          <BarcodeGenerator products={products} />
        </CardContent>
      </Card>
    </div>
  )
}
