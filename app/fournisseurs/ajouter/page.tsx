import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import FournisseurForm from "../fournisseur-form"

export default function AddFournisseurPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ajouter un fournisseur</h1>
        <p className="text-muted-foreground">Créez un nouveau fournisseur dans votre système</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du fournisseur</CardTitle>
          <CardDescription>Entrez les détails du nouveau fournisseur</CardDescription>
        </CardHeader>
        <CardContent>
          <FournisseurForm />
        </CardContent>
      </Card>
    </div>
  )
}
