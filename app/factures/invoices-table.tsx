"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Eye, Printer, Search, FileDown } from "lucide-react"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface Invoice {
  id: number
  numero_facture: string
  date_vente: string
  montant_total: number
  remise: number
  montant_paye: number
  methode_paiement: string
  statut: string
  client_nom: string
}

interface InvoicesTableProps {
  invoices: Invoice[]
}

export default function InvoicesTable({ invoices }: InvoicesTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const router = useRouter()

  const filteredInvoices = invoices.filter((invoice) => {
    const matchSearch =
      invoice.numero_facture.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.methode_paiement.toLowerCase().includes(searchTerm.toLowerCase())

    const invoiceDate = new Date(invoice.date_vente)
    const afterStart = !startDate || invoiceDate >= new Date(startDate)
    const beforeEnd = !endDate || invoiceDate <= new Date(endDate)

    return matchSearch && afterStart && beforeEnd
  })

  const formatPrice = (price: any): string => {
    const num = typeof price === "number" ? price : parseFloat(price)
    return isNaN(num) ? "0.00" : num.toFixed(2)
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const printInvoice = (id: number) => {
    router.push(`/factures/${id}/imprimer`)
  }

  const exportExcel = () => {
    const data = filteredInvoices.map(inv => ({
      "N° Facture": inv.numero_facture,
      "Date": formatDate(inv.date_vente),
      "Client": inv.client_nom,
      "Méthode": inv.methode_paiement,
      "Statut": inv.statut,
      "Montant payé": formatPrice(inv.montant_paye) + " TND"
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Factures")
    XLSX.writeFile(wb, "factures.xlsx")
  }

const exportPDF = () => {
  const doc = new jsPDF()

  const bodyData = filteredInvoices.map(inv => [
    inv.numero_facture,
    formatDate(inv.date_vente),
    inv.client_nom,
    inv.methode_paiement,
    inv.statut,
    formatPrice(inv.montant_paye) + " TND"
  ])

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.montant_paye.toString()), 0)
  const totalRow = ["", "", "", "", "Total", formatPrice(totalAmount) + " TND"]

  // Ajouter le tableau
  autoTable(doc, {
    head: [["N° Facture", "Date", "Client", "Méthode", "Statut", "Montant"]],
    body: [...bodyData, totalRow],
    didDrawCell: (data) => {
      // Rendre la dernière ligne en gras
      if (data.row.index === bodyData.length) {
        doc.setFont("helvetica", "bold")
      }
    }
  })

  doc.save("factures.pdf")
}


  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher une facture..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-9 w-[200px]" />
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
   {/*     <Button onClick={exportExcel} variant="outline">
          Export Excel <FileDown className="ml-2 h-4 w-4" />
        </Button> */}
        <Button onClick={exportPDF} variant="outline">
          Export PDF <Printer className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Facture</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Méthode</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6">Aucune facture trouvée.</TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{invoice.numero_facture}</TableCell>
                  <TableCell>{formatDate(invoice.date_vente)}</TableCell>
                  <TableCell>{invoice.client_nom || "Client occasionnel"}</TableCell>
                  <TableCell>{invoice.methode_paiement}</TableCell>
                  <TableCell>
                    <Badge variant={invoice.statut === "payé" ? "success" : "outline"}>{invoice.statut}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatPrice(invoice.montant_paye)} TND</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/factures/${invoice.id}`}>
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
