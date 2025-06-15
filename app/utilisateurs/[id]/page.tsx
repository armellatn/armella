import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import UserForm from "../user-form"
import { getUser } from "../actions"
import { notFound } from "next/navigation"
import { requireAuth } from "../../auth/actions"

export default async function EditUserPage({ params }: { params: { id: string } }) {
  // Vérifier que l'utilisateur est connecté et a le rôle admin
  const session = await requireAuth()
  if (session.userRole !== "admin") {
    throw new Error("Accès non autorisé")
  }

  const userId = Number.parseInt(params.id)
  const user = await getUser(userId)

  if (!user) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Modifier un utilisateur</h1>
        <p className="text-muted-foreground">Modifiez les informations de l'utilisateur</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l'utilisateur</CardTitle>
          <CardDescription>Modifiez les détails de l'utilisateur</CardDescription>
        </CardHeader>
        <CardContent>
          <UserForm user={user} />
        </CardContent>
      </Card>
    </div>
  )
}
