"use client"

import { useState }        from "react"
import { useRouter }       from "next/navigation"
import Link                from "next/link"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
}                           from "@/components/ui/table"
import { Button }          from "@/components/ui/button"
import { Input }           from "@/components/ui/input"
import { Badge }           from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
}                           from "@/components/ui/select"
import { Eye, Printer, Search } from "lucide-react"
import * as XLSX           from "xlsx"
import jsPDF               from "jspdf"
import autoTable           from "jspdf-autotable"

type SaleType = "boutique" | "colissimo" | "testeur"

export interface Invoice {
  id:            number
  numero_facture:string
  date_vente:    string
  montant_total: number
  remise:        number
  montant_paye:  number
  methode_paiement: string
  statut:        string
  client_nom:    string
  type_vente:    SaleType         // ← NOUVEAU
}

export default function InvoicesTable({ invoices }:{ invoices: Invoice[] }) {
  const [searchTerm, setSearchTerm]     = useState("")
  const [startDate,  setStartDate]      = useState("")
  const [endDate,    setEndDate]        = useState("")
  const [saleFilter, setSaleFilter]     = useState<SaleType | "all">("all")
  const router = useRouter()

  /* ---------- helpers ---------- */
  const fmtPrice = (p: any)   => (isNaN(+p)?0:+p).toFixed(2)
  const fmtDate  = (d: string)=> new Date(d).toLocaleDateString("fr-FR", {
                                  day:"2-digit", month:"2-digit", year:"numeric",
                                  hour:"2-digit", minute:"2-digit"
                                })

  /* ---------- filtrage ---------- */
  const filtered = invoices.filter(inv => {
    const matchSearch =
      inv.numero_facture.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.client_nom?.toLowerCase().includes(searchTerm.toLowerCase())    ||
      inv.methode_paiement.toLowerCase().includes(searchTerm.toLowerCase())

    const d = new Date(inv.date_vente)
    
    // Pour endDate, on ajoute 1 jour pour inclure toute la journée
    let endDateObj: Date | null = null
    if (endDate) {
      endDateObj = new Date(endDate)
      endDateObj.setDate(endDateObj.getDate() + 1) // Inclure toute la journée de fin
    }
    
    const dateOk = (!startDate || d >= new Date(startDate))
                && (!endDateObj || d < endDateObj)
    const typeOk = saleFilter === "all" || inv.type_vente === saleFilter
    return matchSearch && dateOk && typeOk
  })

  /* ---------- export Excel ---------- */
  const exportExcel = () => {
    const data = filtered.map(inv => ({
      "N° Facture" : inv.numero_facture,
      "Date"       : fmtDate(inv.date_vente),
      "Client"     : inv.client_nom,
      "Méthode"    : inv.methode_paiement,
      "Statut"     : inv.statut,
      "Type"       : inv.type_vente,
      "Montant"    : fmtPrice(inv.montant_paye) + " TND",
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Factures")
    XLSX.writeFile(wb, `factures_${saleFilter}.xlsx`)
  }

  /* ---------- export PDF ---------- */
  const exportPDF = () => {
    const doc = new jsPDF()

    const rows = filtered.map(inv => [
      inv.numero_facture,
      fmtDate(inv.date_vente),
      inv.client_nom,
      inv.type_vente,
      inv.methode_paiement,
      fmtPrice(inv.montant_paye) + " TND",
    ])

    const total = filtered.reduce((s, inv) => s + +inv.montant_paye, 0)
    const totalRow = ["", "", "", "", "Total", fmtPrice(total) + " TND"]

    autoTable(doc, {
      head: [["N°", "Date", "Client", "Type", "Méthode", "Montant"]],
      body: [...rows, totalRow],
      didDrawCell: data => {          // gras sur dernière ligne
        if (data.row.index === rows.length) doc.setFont("helvetica","bold")
      },
    })

    doc.save(`factures_${saleFilter}.pdf`)
  }

  /* ---------- impression d’une facture ---------- */
  const printOne = (id:number) => router.push(`/factures/${id}/imprimer`)

  /* ---------- UI ---------- */
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher…" className="h-9 w-[200px]"
               value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />

        <Input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} />
        <Input type="date" value={endDate}   onChange={e=>setEndDate(e.target.value)} />

        {/* ---- filtre type de vente ---- */}
        <Select value={saleFilter} onValueChange={v=>setSaleFilter(v as any)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="boutique">Boutique</SelectItem>
            <SelectItem value="colissimo">Colissimo</SelectItem>
            <SelectItem value="testeur">Testeur</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={exportExcel}>Export&nbsp;Excel</Button>
        <Button variant="outline" onClick={exportPDF}>
          Export&nbsp;PDF <Printer className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Méthode</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6">
                  Aucune facture.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(inv => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.numero_facture}</TableCell>
                  <TableCell>{fmtDate(inv.date_vente)}</TableCell>
                  <TableCell>{inv.client_nom || "Occasionnel"}</TableCell>
                  <TableCell>{inv.type_vente}</TableCell>
                  <TableCell>{inv.methode_paiement}</TableCell>
                  <TableCell>
                    <Badge variant={inv.statut === "payé" ? "success" : "outline"}>
                      {inv.statut}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {fmtPrice(inv.montant_paye)}&nbsp;TND
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/factures/${inv.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
