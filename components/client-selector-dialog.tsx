"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { searchClients, createClient } from "@/app/pos/actions"

export default function ClientSelectorDialog({ open, onClose, onSelectClient }) {
  const [tab, setTab] = useState<"existing" | "new">("existing")
  const [search, setSearch] = useState("")
  const [results, setResults] = useState([])
  const [form, setForm] = useState({ nom: "", prenom: "", telephone: "" })

  const handleSearch = async () => {
    const clients = await searchClients(search)
    setResults(clients)
  }

  const handleCreate = async () => {
    const client = await createClient(form)
    if (client) {
      onSelectClient(client)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sélectionner ou créer un client</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button variant={tab === "existing" ? "default" : "outline"} onClick={() => setTab("existing")}>Client existant</Button>
          <Button variant={tab === "new" ? "default" : "outline"} onClick={() => setTab("new")}>Nouveau client</Button>
        </div>

        {tab === "existing" ? (
          <div>
            <Input placeholder="Nom, prénom ou téléphone" value={search} onChange={e => setSearch(e.target.value)} />
            <Button onClick={handleSearch} className="mt-2 w-full">Rechercher</Button>

            <ul className="mt-4 space-y-1 max-h-40 overflow-auto">
              {results.map(client => (
                <li key={client.id}>
                  <Button variant="ghost" onClick={() => {
                    onSelectClient(client)
                    onClose()
                  }} className="w-full justify-start">
                    {client.nom} {client.prenom} ({client.telephone})
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="space-y-2">
            <Input placeholder="Nom" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
            <Input placeholder="Prénom" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} />
            <Input placeholder="Téléphone" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />
            <Button onClick={handleCreate} className="w-full mt-2">Créer et utiliser</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
