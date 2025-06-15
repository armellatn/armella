import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import FournisseurForm from "../fournisseur-form"
import { getFournisseur } from "../actions"
import { notFound } from "next/navigation"

export default async function EditFournisseurPage({ params }: { params: { id: string } }) {
  const fournisseurId = Number.parseInt(params.id)
  const fournisseur = await getFournisseur(fournisseurId)

  if (!fournisseur) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Modifier un fournisseur</h1>
        <p className="text-muted-foreground">Modifiez les informations du fournisseur</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du fournisseur</CardTitle>
          <CardDescription>Modifiez les détails du fournisseur</CardDescription>
        </CardHeader>
        <CardContent>
          <FournisseurForm fournisseur={fournisseur} />
        </CardContent>
      </Card>
    </div>
  )
}
