import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import PinLoginForm from "./pin-login-form"
import { redirect } from "next/navigation"
import { getSession } from "../auth/actions"

export default async function LoginPage() {
  // Vérifier si l'utilisateur est déjà connecté
  const session = await getSession()
  if (session) {
    redirect("/")
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">OptiStock</CardTitle>
          <CardDescription>Entrez votre code PIN pour vous connecter</CardDescription>
        </CardHeader>
        <CardContent>
          <PinLoginForm />
        </CardContent>
      </Card>
    </div>
  )
}
