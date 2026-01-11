/**
 * Colissimo SOAP Client
 * Handles communication with Colissimo Tunisia API
 */

import * as soap from "soap"

const WSDL_URL = process.env.COLISSIMO_WSDL_URL || "http://delivery.colissimo.com.tn/wsColissimoGo/wsColissimoGo.asmx?wsdl"

export interface ColissimoCredentials {
  username: string
  password: string
}

export interface ColissimoParcel {
  code_barre: string
  reference: string
  client_nom: string
  client_telephone: string
  gouvernorat: string
  ville: string
  adresse: string
  prix: number
  etat: string
  date_creation: string
  date_mise_a_jour?: string
}

export interface ColissimoResponse<T> {
  result_type: "success" | "error"
  result_code: string
  result_content: T
}

export interface ListeColisResult {
  parcels: ColissimoParcel[]
  total_count: number
  page: number
  has_more: boolean
}

/**
 * Create a SOAP client with authentication header
 */
async function createSoapClient(credentials: ColissimoCredentials): Promise<soap.Client> {
  return new Promise((resolve, reject) => {
    soap.createClient(WSDL_URL, { wsdl_options: { timeout: 30000 } }, (err, client) => {
      if (err) {
        reject(new Error(`Failed to create SOAP client: ${err.message}`))
        return
      }

      // Add authentication header
      const authHeader = {
        AuthHeader: {
          Utilisateur: credentials.username,
          Pass: credentials.password,
        },
      }
      
      client.addSoapHeader(authHeader, "", "tns", "http://delivery.colissimo.com.tn/wsColissimoGo/")
      
      resolve(client)
    })
  })
}

/**
 * Parse SOAP response and normalize to JSON
 */
function parseColisResponse(rawResult: any): ColissimoParcel[] {
  try {
    // The SOAP response structure may vary - adapt based on actual response
    // Common patterns: result.ListeColisResult.Colis or result[0].Colis
    const parcels: ColissimoParcel[] = []
    
    let colisArray = null
    
    // Try different possible response structures
    if (rawResult?.ListeColisResult?.Colis) {
      colisArray = rawResult.ListeColisResult.Colis
    } else if (rawResult?.Colis) {
      colisArray = rawResult.Colis
    } else if (Array.isArray(rawResult)) {
      colisArray = rawResult
    } else if (rawResult?.ListeColisResult?.diffgram?.NewDataSet?.Table) {
      colisArray = rawResult.ListeColisResult.diffgram.NewDataSet.Table
    }
    
    if (!colisArray) {
      return parcels
    }
    
    // Ensure it's an array
    const items = Array.isArray(colisArray) ? colisArray : [colisArray]
    
    for (const item of items) {
      parcels.push({
        code_barre: item.CodeBarre || item.code_barre || item.Code || "",
        reference: item.Reference || item.reference || item.Ref || "",
        client_nom: item.NomClient || item.ClientNom || item.Nom || "",
        client_telephone: item.TelClient || item.Telephone || item.Tel || "",
        gouvernorat: item.Gouvernorat || item.gouvernorat || "",
        ville: item.Ville || item.ville || "",
        adresse: item.Adresse || item.adresse || "",
        prix: parseFloat(item.Prix || item.prix || item.Montant || "0") || 0,
        etat: item.Etat || item.etat || item.Status || "Inconnu",
        date_creation: item.DateCreation || item.date_creation || item.DateCrea || "",
        date_mise_a_jour: item.DateMAJ || item.date_mise_a_jour || "",
      })
    }
    
    return parcels
  } catch (error) {
    console.error("Error parsing Colissimo response:", error)
    return []
  }
}

/**
 * List parcels from Colissimo API (paginated, 100 items per page)
 */
export async function listeColis(
  credentials: ColissimoCredentials,
  page: number = 1
): Promise<ColissimoResponse<ListeColisResult>> {
  try {
    const client = await createSoapClient(credentials)
    
    return new Promise((resolve, reject) => {
      // Call ListeColis SOAP method
      client.ListeColis({ page }, (err: any, result: any, rawResponse: string) => {
        if (err) {
          // Check for authentication errors
          const errorMessage = err.message || err.toString()
          if (
            errorMessage.includes("401") ||
            errorMessage.includes("Unauthorized") ||
            errorMessage.includes("authentification") ||
            errorMessage.includes("Invalid credentials") ||
            errorMessage.includes("Access denied")
          ) {
            resolve({
              result_type: "error",
              result_code: "AUTH_FAILED",
              result_content: { parcels: [], total_count: 0, page, has_more: false },
            })
            return
          }
          
          reject(new Error(`SOAP error: ${errorMessage}`))
          return
        }
        
        const parcels = parseColisResponse(result)
        
        // Determine if there are more pages (100 items per page)
        const hasMore = parcels.length >= 100
        
        resolve({
          result_type: "success",
          result_code: "OK",
          result_content: {
            parcels,
            total_count: parcels.length,
            page,
            has_more: hasMore,
          },
        })
      })
    })
  } catch (error: any) {
    return {
      result_type: "error",
      result_code: "CONNECTION_ERROR",
      result_content: { parcels: [], total_count: 0, page, has_more: false },
    }
  }
}

/**
 * Get a single parcel by barcode (optional feature)
 */
export async function getColis(
  credentials: ColissimoCredentials,
  codeBarre: string
): Promise<ColissimoResponse<ColissimoParcel | null>> {
  try {
    const client = await createSoapClient(credentials)
    
    return new Promise((resolve, reject) => {
      client.GetColis({ code_barre: codeBarre }, (err: any, result: any) => {
        if (err) {
          const errorMessage = err.message || err.toString()
          if (
            errorMessage.includes("401") ||
            errorMessage.includes("Unauthorized") ||
            errorMessage.includes("authentification")
          ) {
            resolve({
              result_type: "error",
              result_code: "AUTH_FAILED",
              result_content: null,
            })
            return
          }
          
          reject(new Error(`SOAP error: ${errorMessage}`))
          return
        }
        
        const parcels = parseColisResponse(result)
        
        resolve({
          result_type: "success",
          result_code: "OK",
          result_content: parcels.length > 0 ? parcels[0] : null,
        })
      })
    })
  } catch (error: any) {
    return {
      result_type: "error",
      result_code: "CONNECTION_ERROR",
      result_content: null,
    }
  }
}

/**
 * Validate credentials by attempting to list parcels
 */
export async function validateCredentials(
  credentials: ColissimoCredentials
): Promise<ColissimoResponse<ListeColisResult>> {
  return listeColis(credentials, 1)
}
