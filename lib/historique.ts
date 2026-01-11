"use server"

import db from "./db"

export type ActionType =
  | "VENTE_CREATION"
  | "VENTE_MODIFICATION"
  | "VENTE_SUPPRESSION"
  | "PRODUIT_CREATION"
  | "PRODUIT_MODIFICATION"
  | "PRODUIT_SUPPRESSION"
  | "CLIENT_CREATION"
  | "CLIENT_MODIFICATION"
  | "CLIENT_SUPPRESSION"
  | "FOURNISSEUR_CREATION"
  | "FOURNISSEUR_MODIFICATION"
  | "FOURNISSEUR_SUPPRESSION"
  | "APPROVISIONNEMENT_CREATION"
  | "APPROVISIONNEMENT_MODIFICATION"
  | "APPROVISIONNEMENT_SUPPRESSION"
  | "UTILISATEUR_CREATION"
  | "UTILISATEUR_MODIFICATION"
  | "UTILISATEUR_SUPPRESSION"
  | "CONNEXION"
  | "DECONNEXION"
  | "RETRAIT_CREATION"
  | "RETRAIT_SUPPRESSION"
  | "ECHANGE_CREATION"
  | "COLISSIMO_CREATION"
  | "COLISSIMO_MODIFICATION"
  | "STOCK_MODIFICATION"
  | "AUTRE"

export type EntiteType =
  | "vente"
  | "produit"
  | "client"
  | "fournisseur"
  | "approvisionnement"
  | "utilisateur"
  | "retrait"
  | "echange"
  | "colissimo"
  | "stock"
  | null

export interface LogActionParams {
  typeAction: ActionType
  description: string
  entiteType?: EntiteType
  entiteId?: number
  utilisateurId?: number
  utilisateurNom?: string
  donneesAvant?: Record<string, any>
  donneesApres?: Record<string, any>
}

/**
 * Enregistre une action dans l'historique
 */
export async function logAction(params: LogActionParams): Promise<void> {
  try {
    await db.query(
      `INSERT INTO historique_actions 
       (type_action, description, entite_type, entite_id, utilisateur_id, utilisateur_nom, donnees_avant, donnees_apres)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        params.typeAction,
        params.description,
        params.entiteType || null,
        params.entiteId || null,
        params.utilisateurId || null,
        params.utilisateurNom || null,
        params.donneesAvant ? JSON.stringify(params.donneesAvant) : null,
        params.donneesApres ? JSON.stringify(params.donneesApres) : null,
      ]
    )
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de l'action:", error)
    // Ne pas faire échouer l'opération principale si le logging échoue
  }
}

export interface HistoriqueEntry {
  id: number
  type_action: ActionType
  description: string
  entite_type: EntiteType
  entite_id: number | null
  utilisateur_id: number | null
  utilisateur_nom: string | null
  donnees_avant: Record<string, any> | null
  donnees_apres: Record<string, any> | null
  created_at: string
}

export interface GetHistoriqueParams {
  page?: number
  limit?: number
  typeAction?: ActionType
  entiteType?: EntiteType
  dateDebut?: string
  dateFin?: string
  search?: string
}

/**
 * Récupère l'historique des actions avec pagination et filtres
 */
export async function getHistorique(params: GetHistoriqueParams = {}): Promise<{
  entries: HistoriqueEntry[]
  total: number
  page: number
  totalPages: number
}> {
  const page = params.page || 1
  const limit = params.limit || 50
  const offset = (page - 1) * limit

  let whereClause = "WHERE 1=1"
  const queryParams: any[] = []
  let paramIndex = 1

  if (params.typeAction) {
    whereClause += ` AND type_action = $${paramIndex++}`
    queryParams.push(params.typeAction)
  }

  if (params.entiteType) {
    whereClause += ` AND entite_type = $${paramIndex++}`
    queryParams.push(params.entiteType)
  }

  if (params.dateDebut) {
    whereClause += ` AND created_at >= $${paramIndex++}`
    queryParams.push(params.dateDebut)
  }

  if (params.dateFin) {
    whereClause += ` AND created_at <= $${paramIndex++}`
    queryParams.push(params.dateFin + " 23:59:59")
  }

  if (params.search) {
    whereClause += ` AND (description ILIKE $${paramIndex} OR utilisateur_nom ILIKE $${paramIndex})`
    queryParams.push(`%${params.search}%`)
    paramIndex++
  }

  // Get total count
  const countResult = await db.query(
    `SELECT COUNT(*) as total FROM historique_actions ${whereClause}`,
    queryParams
  )
  const total = parseInt(countResult.rows[0].total, 10)

  // Get entries
  const result = await db.query(
    `SELECT * FROM historique_actions ${whereClause} 
     ORDER BY created_at DESC 
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...queryParams, limit, offset]
  )

  return {
    entries: result.rows,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

/**
 * Récupère les statistiques de l'historique
 */
export async function getHistoriqueStats(): Promise<{
  totalActions: number
  actionsAujourdhui: number
  actionsCetteSemaine: number
  topActions: { type_action: string; count: number }[]
}> {
  const [totalResult, todayResult, weekResult, topResult] = await Promise.all([
    db.query("SELECT COUNT(*) as total FROM historique_actions"),
    db.query("SELECT COUNT(*) as total FROM historique_actions WHERE created_at::date = CURRENT_DATE"),
    db.query("SELECT COUNT(*) as total FROM historique_actions WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'"),
    db.query(`
      SELECT type_action, COUNT(*) as count 
      FROM historique_actions 
      GROUP BY type_action 
      ORDER BY count DESC 
      LIMIT 5
    `),
  ])

  return {
    totalActions: parseInt(totalResult.rows[0].total, 10),
    actionsAujourdhui: parseInt(todayResult.rows[0].total, 10),
    actionsCetteSemaine: parseInt(weekResult.rows[0].total, 10),
    topActions: topResult.rows,
  }
}
