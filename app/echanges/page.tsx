import {
  getEchanges,
  getEchangesStats,
  getClientsForEchange,
} from "./actions"
import EchangesClient from "./echanges-client"

export const metadata = { title: "Échanges & Retours" }

export default async function EchangesPage() {
  const [echanges, stats, clients] = await Promise.all([
    getEchanges(),
    getEchangesStats(),
    getClientsForEchange(),
  ])

  return (
    <EchangesClient
      echanges={echanges}
      stats={stats}
      clients={clients}
    />
  )
}
