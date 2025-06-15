// app/profile/page.tsx

import { requireAuth } from "@/app/auth/actions"

export default async function ProfilePage() {
  const session = await requireAuth()

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Mon profil</h1>
      <p className="text-muted-foreground">Voici les informations liées à votre compte</p>

      <div className="border p-4 rounded-md bg-white shadow-md space-y-2">
        <p><strong>Nom complet :</strong> {session.userName}</p>
        <p><strong>Rôle :</strong> {session.userRole === "admin" ? "Administrateur" : "Utilisateur"}</p>
        <p><strong>ID utilisateur :</strong> {session.userId}</p>
      </div>
    </div>
  )
}
