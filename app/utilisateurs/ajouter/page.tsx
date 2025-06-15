import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import UserForm from "../user-form"
import { requireAuth } from "../../auth/actions"

export default async function AddUserPage() {
  // Vérifier que l'utilisateur est connecté et a le rôle admin
  const session = await requireAuth()
  if (session.userRole !== "admin") {
    throw new Error("Accès non autorisé")
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ajouter un utilisateur</h1>
        <p className="text-muted-foreground">Créez un nouvel utilisateur dans le système</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l'utilisateur</CardTitle>
          <CardDescription>Entrez les détails du nouvel utilisateur</CardDescription>
        </CardHeader>
        <CardContent>
          <UserForm />
        </CardContent>
      </Card>
    </div>
  )
}
