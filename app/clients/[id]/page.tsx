import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ClientForm from "../client-form"
import { getClient } from "../actions"
import { notFound } from "next/navigation"

export default async function EditClientPage({ params }: { params: { id: string } }) {
  const clientId = Number.parseInt(params.id)
  const client = await getClient(clientId)

  if (!client) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Modifier un client</h1>
        <p className="text-muted-foreground">Modifiez les informations du client</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du client</CardTitle>
          <CardDescription>Modifiez les détails du client</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm client={client} />
        </CardContent>
      </Card>
    </div>
  )
}
