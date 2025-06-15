import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getApprovisionnements } from "./actions"
import ApprovisionnementTable from "./approvisionnements-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"

export default async function ApprovisionnementsPage() {
  const approvisionnements = await getApprovisionnements()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Approvisionnements</h1>
          <p className="text-muted-foreground">Gérez vos commandes et réceptions</p>
        </div>
        <Link href="/approvisionnements/ajouter">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle commande
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des approvisionnements</CardTitle>
          <CardDescription>Historique complet</CardDescription>
        </CardHeader>
        <CardContent>
          <ApprovisionnementTable approvisionnements={approvisionnements} />
        </CardContent>
      </Card>
    </div>
  )
}
