"use client"

import { useState, useMemo } from "react"
import { Input }  from "@/components/ui/input"
import { Badge }  from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Search, Undo2, RefreshCcw, TrendingDown, TrendingUp, Minus, ShoppingBag, Truck } from "lucide-react"

export interface EchangeFacture {
  id: number
  numero_echange: string
  date_echange: string
  type_operation: "retour" | "echange"
  type_vente_origine: "boutique" | "colissimo"
  montant_retour: number
  montant_remplacement: number
  montant_net: number
  methode_paiement: string
  notes: string | null
  utilisateur_nom: string | null
  client_nom: string | null
}

export default function EchangesFacturesTable({ echanges }: { echanges: EchangeFacture[] }) {
  const [search, setSearch]         = useState("")
  const [typeFilter, setTypeFilter]     = useState<"all" | "retour" | "echange">("all")
  const [origineFilter, setOrigineFilter] = useState<"all" | "boutique" | "colissimo">("all")
  const [startDate, setStartDate] = useState("")
  const [endDate,   setEndDate]   = useState("")

  const fmt      = (n: number) => n.toFixed(2)
  const fmtDate  = (d: string) => new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })

  const filtered = useMemo(() => {
    return echanges.filter(e => {
      const q = search.toLowerCase()
      const matchSearch =
        e.numero_echange.toLowerCase().includes(q) ||
        (e.client_nom ?? "").toLowerCase().includes(q) ||
        (e.notes ?? "").toLowerCase().includes(q)

      const d = new Date(e.date_echange)
      let endObj: Date | null = null
      if (endDate) { endObj = new Date(endDate); endObj.setDate(endObj.getDate() + 1) }
      const matchDate = (!startDate || d >= new Date(startDate)) && (!endObj || d < endObj)

      const matchType    = typeFilter    === "all" || e.type_operation    === typeFilter
      const matchOrigine = origineFilter === "all" || e.type_vente_origine === origineFilter

      return matchSearch && matchDate && matchType && matchOrigine
    })
  }, [echanges, search, typeFilter, origineFilter, startDate, endDate])

  const totalRetour = filtered.reduce((s, e) => s + e.montant_retour, 0)
  const totalNet    = filtered.reduce((s, e) => s + e.montant_net,    0)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={v => setTypeFilter(v as any)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="retour">Retours</SelectItem>
            <SelectItem value="echange">Échanges</SelectItem>
          </SelectContent>
        </Select>
        <Select value={origineFilter} onValueChange={v => setOrigineFilter(v as any)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes origines</SelectItem>
            <SelectItem value="boutique">Boutique</SelectItem>
            <SelectItem value="colissimo">Colissimo</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" className="w-38" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <Input type="date" className="w-38" value={endDate}   onChange={e => setEndDate(e.target.value)} />
      </div>

      {/* Summary */}
      <div className="flex gap-6 text-sm text-muted-foreground border rounded-lg px-4 py-2">
        <span>{filtered.length} opération(s)</span>
        <span>Valeur retournée : <strong className="text-orange-600">{fmt(totalRetour)} TND</strong></span>
        <span>
          Impact net caisse :{" "}
          <strong className={totalNet > 0 ? "text-red-600" : totalNet < 0 ? "text-green-600" : ""}>
            {totalNet > 0 ? `−${fmt(totalNet)}` : totalNet < 0 ? `+${fmt(Math.abs(totalNet))}` : "0.00"} TND
          </strong>
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Origine</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Retourné</TableHead>
              <TableHead className="text-right">Remplacé</TableHead>
              <TableHead className="text-right">Impact caisse</TableHead>
              <TableHead>Règlement</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  Aucun résultat.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs">{e.numero_echange}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{fmtDate(e.date_echange)}</TableCell>
                  <TableCell>
                    {e.type_operation === "retour"
                      ? <Badge variant="secondary" className="gap-1 text-orange-700 bg-orange-100 text-xs">
                          <Undo2 className="h-3 w-3" /> Retour
                        </Badge>
                      : <Badge className="gap-1 bg-indigo-100 text-indigo-700 border-indigo-200 text-xs">
                          <RefreshCcw className="h-3 w-3" /> Échange
                        </Badge>}
                  </TableCell>
                  <TableCell>
                    {e.type_vente_origine === "colissimo"
                      ? <Badge variant="outline" className="gap-1 text-orange-600 border-orange-300 text-xs">
                          <Truck className="h-3 w-3" /> Colissimo
                        </Badge>
                      : <Badge variant="outline" className="gap-1 text-blue-600 border-blue-300 text-xs">
                          <ShoppingBag className="h-3 w-3" /> Boutique
                        </Badge>}
                  </TableCell>
                  <TableCell className="text-sm">{e.client_nom ?? "—"}</TableCell>
                  <TableCell className="text-right text-sm text-orange-700">
                    {fmt(e.montant_retour)} TND
                  </TableCell>
                  <TableCell className="text-right text-sm text-green-700">
                    {e.montant_remplacement > 0 ? `${fmt(e.montant_remplacement)} TND` : "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm font-semibold">
                    {e.montant_net > 0
                      ? <span className="text-red-600 flex items-center justify-end gap-1">
                          <TrendingDown className="h-3.5 w-3.5" />
                          −{fmt(e.montant_net)} TND
                        </span>
                      : e.montant_net < 0
                      ? <span className="text-green-600 flex items-center justify-end gap-1">
                          <TrendingUp className="h-3.5 w-3.5" />
                          +{fmt(Math.abs(e.montant_net))} TND
                        </span>
                      : <span className="text-muted-foreground flex items-center justify-end gap-1">
                          <Minus className="h-3.5 w-3.5" /> 0.00 TND
                        </span>}
                  </TableCell>
                  <TableCell className="text-xs capitalize">{e.methode_paiement}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-32 truncate">{e.notes ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
