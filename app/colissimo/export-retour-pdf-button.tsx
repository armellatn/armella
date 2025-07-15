"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

type Retour = {
  id:            number
  date_retour:   string
  produit:       string
  quantite:      number
  montant_total: number
  notes:         string | null
}

export default function ExportRetourPDF({ retours }: { retours: Retour[] }) {
  const fmt  = (n: number) => n.toFixed(2)
  const fdat = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"2-digit", year:"numeric" })

  const onExport = () => {
    const doc  = new jsPDF()
    const rows = retours.map(r => [
      fdat(r.date_retour),
      r.produit,
      r.quantite.toString(),
      fmt(r.montant_total) + " TND",
      r.notes ?? "",
    ])

    const total = retours.reduce((s, r) => s + r.montant_total, 0)
    const totalRow = ["", "", "Total", fmt(total) + " TND", ""]

    autoTable(doc, {
      head: [["Date", "Produit", "Qté", "Montant", "Notes"]],
      body: [...rows, totalRow],
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 1: { cellWidth: 60 }, 4: { cellWidth: 40 } },
      didDrawCell: d => {
        if (d.row.index === rows.length) doc.setFont("helvetica", "bold")
      },
    })
    doc.save("retours-colissimo.pdf")
  }

  return (
    <Button variant="outline" onClick={onExport}>
      Export&nbsp;retours <Printer className="ml-1 h-4 w-4" />
    </Button>
  )
}
