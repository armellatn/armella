"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Table, TableHeader, TableRow, TableHead,
  TableBody, TableCell
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Eye, Trash2, CheckCircle, XCircle, MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Approvisionnement,
  deleteApprovisionnement,
  cancelApprovisionnement,
  receiveApprovisionnement
} from "./actions"
import { formatDate } from "@/lib/utils"

export default function ApprovisionnementTable({ approvisionnements }: { approvisionnements: Approvisionnement[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  const filtered = approvisionnements.filter((a) =>
    a.numero_commande.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.fournisseur_nom?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (id: number) => {
    if (confirm("Supprimer cet approvisionnement ?")) {
      const res = await deleteApprovisionnement(id)
      if (!res.success) alert(res.error)
      router.refresh()
    }
  }

  const handleCancel = async (id: number) => {
    if (confirm("Annuler cet approvisionnement ?")) {
      await cancelApprovisionnement(id)
      router.refresh()
    }
  }

  const handleReceive = async (id: number) => {
    const date = new Date().toISOString().split("T")[0]
    if (confirm("Réceptionner cet approvisionnement ?")) {
      await receiveApprovisionnement(id, date)
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Rechercher..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>N° Commande</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Fournisseur</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>Reste à payer</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((a) => {
            const reste = Number(a.montant_total) - Number(a.montant_paye)
            return (
              <TableRow key={a.id}>
                <TableCell>{a.numero_commande}</TableCell>
                <TableCell>{formatDate(a.date_commande)}</TableCell>
                <TableCell>{a.fournisseur_nom}</TableCell>
                <TableCell>{Number(a.montant_total).toFixed(2)} TND</TableCell>
                <TableCell>
                  <span className={reste > 0 ? "text-red-500" : "text-green-600"}>
                    {reste.toFixed(2)} TND
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={
                    a.statut === "reçu" ? "success" :
                    a.statut === "annulé" ? "destructive" : "outline"
                  }>
                    {a.statut}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="p-0 h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/approvisionnements/${a.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir détails
                        </Link>
                      </DropdownMenuItem>
                      {a.statut === "en attente" && (
                        <>
                          <DropdownMenuItem onClick={() => handleReceive(a.id)}>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                            Réceptionner
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCancel(a.id)}>
                            <XCircle className="mr-2 h-4 w-4 text-yellow-500" />
                            Annuler
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem onClick={() => handleDelete(a.id)}>
                        <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
