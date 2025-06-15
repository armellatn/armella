import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { getUsers } from "./actions"
import UsersTable from "./users-table"
import { requireAuth } from "../auth/actions"

export default async function UsersPage() {
  // Vérifier que l'utilisateur est connecté et a le rôle admin
  const session = await requireAuth()
  if (session.userRole !== "admin") {
    throw new Error("Accès non autorisé")
  }

  const users = await getUsers()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="text-muted-foreground">Gérez les utilisateurs de la plateforme</p>
        </div>
        <Link href="/utilisateurs/ajouter">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un utilisateur
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
          <CardDescription>Tous les utilisateurs enregistrés dans le système</CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable users={users} />
        </CardContent>
      </Card>
    </div>
  )
}
