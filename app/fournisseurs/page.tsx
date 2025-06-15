import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { getFournisseurs } from "./actions"
import FournisseursTable from "./fournisseurs-table"

export default async function FournisseursPage() {
  const fournisseurs = await getFournisseurs()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fournisseurs</h1>
          <p className="text-muted-foreground">Gérez vos fournisseurs de lentilles de contact</p>
        </div>
        <Link href="/fournisseurs/ajouter">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un fournisseur
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des fournisseurs</CardTitle>
          <CardDescription>Tous les fournisseurs enregistrés dans votre système</CardDescription>
        </CardHeader>
        <CardContent>
          <FournisseursTable fournisseurs={fournisseurs} />
        </CardContent>
      </Card>
    </div>
  )
}
