"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  ShoppingCart, ArrowDownCircle, RefreshCcw, Undo2, TrendingDown,
  Printer, FileSpreadsheet, Truck, ShoppingBag, CalendarRange,
} from "lucide-react"
import type { Invoice } from "./invoices-table"
import type { EchangeFacture } from "./echanges-factures-table"
import type { RetraitRow, RetourColissimoRow } from "../echanges/actions"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

interface Props {
  ventes: Invoice[]
  echanges: EchangeFacture[]
  retraits: RetraitRow[]
  retoursColissimo: RetourColissimoRow[]
}

export default function RapportComplet({ ventes, echanges, retraits, retoursColissimo }: Props) {
  const [startDate, setStartDate] = useState("")
  const [endDate,   setEndDate]   = useState("")

  const fmt    = (n: number) => n.toFixed(2)
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  })

  /* ── Date filter helpers ── */
  const inRange = (dateStr: string) => {
    const d = new Date(dateStr)
    let endObj: Date | null = null
    if (endDate) { endObj = new Date(endDate); endObj.setDate(endObj.getDate() + 1) }
    return (!startDate || d >= new Date(startDate)) && (!endObj || d < endObj)
  }

  /* ── Filtered data ── */
  const fVentes   = useMemo(() => ventes.filter(v => inRange(v.date_vente)),          [ventes,   startDate, endDate])
  const fEchanges = useMemo(() => echanges.filter(e => inRange(e.date_echange)),       [echanges, startDate, endDate])
  const fRetraits = useMemo(() => retraits.filter(r => inRange(r.date)),               [retraits, startDate, endDate])
  const fRetours  = useMemo(() => retoursColissimo.filter(r => inRange(r.date_retour)),[retoursColissimo, startDate, endDate])

  /* ── Totals ── */
  const totalVentes   = fVentes.reduce((s, v)  => s + +v.montant_paye,   0)
  const totalRetraits = fRetraits.reduce((s, r) => s + +r.montant,        0)
  const totalEchanges = fEchanges.reduce((s, e) => s + +e.montant_net,    0)  // positive = refund
  const totalRetours  = fRetours.reduce((s, r)  => s + +r.montant_total,  0)
  const recetteNette  = totalVentes - totalRetraits - totalEchanges - totalRetours

  const ventesBoutique   = fVentes.filter(v => v.type_vente === "boutique").reduce((s,v)  => s + +v.montant_paye, 0)
  const ventesColissimo  = fVentes.filter(v => v.type_vente === "colissimo").reduce((s,v) => s + +v.montant_paye, 0)
  const ventesTesteur    = fVentes.filter(v => v.type_vente === "testeur").reduce((s,v)   => s + +v.montant_paye, 0)

  /* ── Export PDF ── */
  const exportPDF = () => {
    const doc = new jsPDF()
    const dateLabel = startDate || endDate
      ? ` (${startDate || "…"} → ${endDate || "…"})`
      : " (toutes dates)"

    doc.setFontSize(16)
    doc.text("Rapport financier complet" + dateLabel, 14, 15)
    doc.setFontSize(10)
    doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, 14, 22)

    let y = 30
    const summary = [
      ["Total ventes", fmt(totalVentes) + " TND"],
      ["  dont Boutique", fmt(ventesBoutique) + " TND"],
      ["  dont Colissimo", fmt(ventesColissimo) + " TND"],
      ["  dont Testeur", fmt(ventesTesteur) + " TND"],
      ["Retraits d'argent", "- " + fmt(totalRetraits) + " TND"],
      ["Échanges / retours boutique (net)", "- " + fmt(totalEchanges) + " TND"],
      ["Retours Colissimo", "- " + fmt(totalRetours) + " TND"],
      ["RECETTE NETTE", fmt(recetteNette) + " TND"],
    ]
    autoTable(doc, {
      startY: y,
      head: [["Rubrique", "Montant"]],
      body: summary,
      theme: "striped",
    })
    y = (doc as any).lastAutoTable.finalY + 10

    doc.setFontSize(13)
    doc.text("Détail des ventes", 14, y)
    autoTable(doc, {
      startY: y + 4,
      head: [["N° Facture", "Date", "Client", "Type", "Méthode", "Montant"]],
      body: fVentes.map(v => [v.numero_facture, fmtDate(v.date_vente), v.client_nom || "Occasionnel", v.type_vente, v.methode_paiement, fmt(+v.montant_paye) + " TND"]),
    })
    y = (doc as any).lastAutoTable.finalY + 10

    doc.setFontSize(13)
    doc.text("Retraits d'argent", 14, y)
    autoTable(doc, {
      startY: y + 4,
      head: [["Date", "Description", "Montant"]],
      body: fRetraits.map(r => [fmtDate(r.date), r.description, fmt(+r.montant) + " TND"]),
    })
    y = (doc as any).lastAutoTable.finalY + 10

    doc.setFontSize(13)
    doc.text("Échanges & Retours boutique/colissimo", 14, y)
    autoTable(doc, {
      startY: y + 4,
      head: [["N°", "Date", "Type", "Origine", "Client", "Retourné", "Remplacé", "Impact net"]],
      body: fEchanges.map(e => [
        e.numero_echange, fmtDate(e.date_echange),
        e.type_operation, e.type_vente_origine,
        e.client_nom || "—",
        fmt(+e.montant_retour) + " TND",
        fmt(+e.montant_remplacement) + " TND",
        (e.montant_net > 0 ? "-" : e.montant_net < 0 ? "+" : "") + fmt(Math.abs(+e.montant_net)) + " TND",
      ]),
    })
    y = (doc as any).lastAutoTable.finalY + 10

    if (fRetours.length > 0) {
      doc.setFontSize(13)
      doc.text("Retours Colissimo", 14, y)
      autoTable(doc, {
        startY: y + 4,
        head: [["Date", "Produit", "Code", "Qté", "Montant", "Notes"]],
        body: fRetours.map(r => [fmtDate(r.date_retour), r.produit_nom, r.code_produit, r.quantite, fmt(+r.montant_total) + " TND", r.notes || "—"]),
      })
    }

    doc.save("rapport-complet.pdf")
  }

  /* ── Export Excel ── */
  const exportExcel = () => {
    const wb = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
      { Rubrique: "Total ventes",                   Montant: fmt(totalVentes) },
      { Rubrique: "  Boutique",                     Montant: fmt(ventesBoutique) },
      { Rubrique: "  Colissimo",                    Montant: fmt(ventesColissimo) },
      { Rubrique: "  Testeur",                      Montant: fmt(ventesTesteur) },
      { Rubrique: "Retraits d'argent",              Montant: fmt(totalRetraits) },
      { Rubrique: "Échanges/retours net",           Montant: fmt(totalEchanges) },
      { Rubrique: "Retours Colissimo",              Montant: fmt(totalRetours) },
      { Rubrique: "RECETTE NETTE",                  Montant: fmt(recetteNette) },
    ]), "Récapitulatif")

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      fVentes.map(v => ({
        "N° Facture": v.numero_facture,
        Date: fmtDate(v.date_vente),
        Client: v.client_nom || "Occasionnel",
        Type: v.type_vente,
        Méthode: v.methode_paiement,
        "Montant (TND)": fmt(+v.montant_paye),
      }))
    ), "Ventes")

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      fRetraits.map(r => ({
        Date: fmtDate(r.date),
        Description: r.description,
        "Montant (TND)": fmt(+r.montant),
      }))
    ), "Retraits")

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      fEchanges.map(e => ({
        "N° Échange": e.numero_echange,
        Date: fmtDate(e.date_echange),
        Type: e.type_operation,
        Origine: e.type_vente_origine,
        Client: e.client_nom || "—",
        "Retourné (TND)": fmt(+e.montant_retour),
        "Remplacé (TND)": fmt(+e.montant_remplacement),
        "Impact net (TND)": fmt(+e.montant_net),
      }))
    ), "Échanges & Retours")

    if (fRetours.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
        fRetours.map(r => ({
          Date: fmtDate(r.date_retour),
          Produit: r.produit_nom,
          Code: r.code_produit,
          Quantité: r.quantite,
          "Montant (TND)": fmt(+r.montant_total),
          Notes: r.notes || "",
        }))
      ), "Retours Colissimo")
    }

    XLSX.writeFile(wb, "rapport-complet.xlsx")
  }

  return (
    <div className="space-y-6">

      {/* ── Filters + Export ── */}
      <div className="flex flex-wrap items-center gap-2">
        <CalendarRange className="h-4 w-4 text-muted-foreground" />
        <Input type="date" className="w-40" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <span className="text-muted-foreground text-sm">→</span>
        <Input type="date" className="w-40" value={endDate}   onChange={e => setEndDate(e.target.value)} />
        <Button variant="outline" size="sm" onClick={() => { setStartDate(""); setEndDate("") }}>
          Tout afficher
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={exportExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-1" /> Export Excel
        </Button>
        <Button variant="outline" size="sm" onClick={exportPDF}>
          <Printer className="h-4 w-4 mr-1" /> Export PDF
        </Button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <ShoppingCart className="h-3.5 w-3.5 text-green-600" /> Total ventes
            </div>
            <div className="text-2xl font-bold text-green-600">+{fmt(totalVentes)} TND</div>
            <div className="text-xs text-muted-foreground mt-1">
              <span className="text-blue-600">{fmt(ventesBoutique)} boutique</span> ·{" "}
              <span className="text-orange-600">{fmt(ventesColissimo)} colissimo</span>
              {ventesTesteur > 0 && <> · <span className="text-purple-600">{fmt(ventesTesteur)} testeur</span></>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <ArrowDownCircle className="h-3.5 w-3.5 text-red-600" /> Retraits d'argent
            </div>
            <div className="text-2xl font-bold text-red-600">-{fmt(totalRetraits)} TND</div>
            <div className="text-xs text-muted-foreground">{fRetraits.length} retrait(s)</div>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <RefreshCcw className="h-3.5 w-3.5 text-orange-600" /> Échanges / Retours
            </div>
            <div className="text-2xl font-bold text-orange-600">-{fmt(totalEchanges + totalRetours)} TND</div>
            <div className="text-xs text-muted-foreground">
              {fEchanges.length} échange(s) · {fRetours.length} retour(s) colis
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 ${recetteNette >= 0 ? "border-indigo-400" : "border-red-400"}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <TrendingDown className="h-3.5 w-3.5 text-indigo-600" /> Recette nette
            </div>
            <div className={`text-2xl font-bold ${recetteNette >= 0 ? "text-indigo-600" : "text-red-600"}`}>
              {fmt(recetteNette)} TND
            </div>
            <div className="text-xs text-muted-foreground">
              {fVentes.length} facture(s)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Ventes breakdown ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-green-600" />
            Ventes ({fVentes.length}) — {fmt(totalVentes)} TND
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead>N° Facture</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Méthode</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fVentes.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-4 text-muted-foreground">Aucune vente.</TableCell></TableRow>
                ) : fVentes.map(v => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono text-xs">{v.numero_facture}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{fmtDate(v.date_vente)}</TableCell>
                    <TableCell>{v.client_nom || "Occasionnel"}</TableCell>
                    <TableCell>
                      {v.type_vente === "boutique"
                        ? <Badge variant="outline" className="text-blue-600 border-blue-300 gap-1"><ShoppingBag className="h-3 w-3"/>Boutique</Badge>
                        : v.type_vente === "colissimo"
                        ? <Badge variant="outline" className="text-orange-600 border-orange-300 gap-1"><Truck className="h-3 w-3"/>Colissimo</Badge>
                        : <Badge variant="outline" className="text-purple-600 border-purple-300">Testeur</Badge>}
                    </TableCell>
                    <TableCell>{v.methode_paiement}</TableCell>
                    <TableCell className="text-right font-semibold text-green-700">{fmt(+v.montant_paye)} TND</TableCell>
                  </TableRow>
                ))}
                {fVentes.length > 0 && (
                  <TableRow className="font-bold bg-muted/40">
                    <TableCell colSpan={5} className="text-right">Total ventes</TableCell>
                    <TableCell className="text-right text-green-700">+{fmt(totalVentes)} TND</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Retraits ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowDownCircle className="h-4 w-4 text-red-600" />
            Retraits d'argent ({fRetraits.length}) — -{fmt(totalRetraits)} TND
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description / motif</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fRetraits.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">Aucun retrait.</TableCell></TableRow>
                ) : fRetraits.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs whitespace-nowrap">{fmtDate(r.date)}</TableCell>
                    <TableCell>{r.description}</TableCell>
                    <TableCell className="text-right font-semibold text-red-600">-{fmt(+r.montant)} TND</TableCell>
                  </TableRow>
                ))}
                {fRetraits.length > 0 && (
                  <TableRow className="font-bold bg-muted/40">
                    <TableCell colSpan={2} className="text-right">Total retraits</TableCell>
                    <TableCell className="text-right text-red-600">-{fmt(totalRetraits)} TND</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Échanges & Retours (boutique / colissimo via /echanges) ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCcw className="h-4 w-4 text-indigo-600" />
            Échanges & Retours ({fEchanges.length}) — impact net -{fmt(totalEchanges)} TND
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Origine</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Retourné</TableHead>
                  <TableHead className="text-right">Remplacé</TableHead>
                  <TableHead className="text-right">Impact net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fEchanges.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-4 text-muted-foreground">Aucun échange.</TableCell></TableRow>
                ) : fEchanges.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-xs">{e.numero_echange}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{fmtDate(e.date_echange)}</TableCell>
                    <TableCell>
                      {e.type_operation === "retour"
                        ? <Badge variant="secondary" className="text-orange-700 bg-orange-100 gap-1 text-xs"><Undo2 className="h-3 w-3"/>Retour</Badge>
                        : <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 gap-1 text-xs"><RefreshCcw className="h-3 w-3"/>Échange</Badge>}
                    </TableCell>
                    <TableCell>
                      {e.type_vente_origine === "colissimo"
                        ? <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs gap-1"><Truck className="h-2.5 w-2.5"/>Colissimo</Badge>
                        : <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs gap-1"><ShoppingBag className="h-2.5 w-2.5"/>Boutique</Badge>}
                    </TableCell>
                    <TableCell>{e.client_nom || "—"}</TableCell>
                    <TableCell className="text-right text-orange-700">{fmt(+e.montant_retour)} TND</TableCell>
                    <TableCell className="text-right text-green-700">
                      {e.montant_remplacement > 0 ? `${fmt(+e.montant_remplacement)} TND` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {e.montant_net > 0
                        ? <span className="text-red-600">-{fmt(+e.montant_net)} TND</span>
                        : e.montant_net < 0
                        ? <span className="text-green-600">+{fmt(Math.abs(+e.montant_net))} TND</span>
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                ))}
                {fEchanges.length > 0 && (
                  <TableRow className="font-bold bg-muted/40">
                    <TableCell colSpan={7} className="text-right">Impact net total</TableCell>
                    <TableCell className="text-right text-red-600">-{fmt(totalEchanges)} TND</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Retours Colissimo ── */}
      {(fRetours.length > 0 || retoursColissimo.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4 text-orange-600" />
              Retours Colissimo ({fRetours.length}) — -{fmt(totalRetours)} TND
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Qté</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fRetours.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-4 text-muted-foreground">Aucun retour colissimo.</TableCell></TableRow>
                  ) : fRetours.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs whitespace-nowrap">{fmtDate(r.date_retour)}</TableCell>
                      <TableCell>{r.produit_nom}</TableCell>
                      <TableCell className="font-mono text-xs">{r.code_produit}</TableCell>
                      <TableCell className="text-right">{r.quantite}</TableCell>
                      <TableCell className="text-right font-semibold text-red-600">-{fmt(+r.montant_total)} TND</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {fRetours.length > 0 && (
                    <TableRow className="font-bold bg-muted/40">
                      <TableCell colSpan={4} className="text-right">Total retours colissimo</TableCell>
                      <TableCell className="text-right text-red-600">-{fmt(totalRetours)} TND</TableCell>
                      <TableCell />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Grand Total ── */}
      <Card className={`border-2 ${recetteNette >= 0 ? "border-indigo-400 bg-indigo-50/50" : "border-red-400 bg-red-50/50"}`}>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="text-green-600">Ventes : <strong>+{fmt(totalVentes)} TND</strong></div>
              <div className="text-red-600">Retraits : <strong>-{fmt(totalRetraits)} TND</strong></div>
              <div className="text-orange-600">Échanges / Retours boutique : <strong>-{fmt(totalEchanges)} TND</strong></div>
              {totalRetours > 0 && <div className="text-orange-600">Retours Colissimo : <strong>-{fmt(totalRetours)} TND</strong></div>}
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Recette nette</div>
              <div className={`text-4xl font-bold ${recetteNette >= 0 ? "text-indigo-700" : "text-red-600"}`}>
                {fmt(recetteNette)} TND
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
