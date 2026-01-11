"use server"

import { getHistorique, getHistoriqueStats, GetHistoriqueParams } from "@/lib/historique"

export async function fetchHistorique(params: GetHistoriqueParams) {
  return getHistorique(params)
}

export async function fetchHistoriqueStats() {
  return getHistoriqueStats()
}
