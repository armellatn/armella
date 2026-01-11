/**
 * Colissimo API - Parcels Route
 * GET: List parcels with pagination and optional search
 */

import { NextRequest, NextResponse } from "next/server"
import { getCredentials, initCredentialsTable } from "@/lib/colissimoCredentials"
import { listeColis, getColis, ColissimoParcel } from "@/lib/colissimoClient"

// Mapped parcel for frontend
interface MappedParcel {
  trackingNumber: string
  status: string
  statusCode?: string
  recipient?: string
  destination?: string
  weight?: number
  createdAt?: string
  lastUpdate?: string
}

// Map ColissimoParcel to frontend format
function mapParcel(parcel: ColissimoParcel): MappedParcel {
  return {
    trackingNumber: parcel.code_barre,
    status: parcel.etat,
    recipient: parcel.client_nom,
    destination: `${parcel.ville}${parcel.gouvernorat ? `, ${parcel.gouvernorat}` : ""}`,
    createdAt: parcel.date_creation,
    lastUpdate: parcel.date_mise_a_jour || parcel.date_creation,
  }
}

// GET /api/colissimo-api/parcels
// Query params: 
//   - page (default: 1)
//   - limit (default: 20)
//   - search (optional: search by tracking number)
export async function GET(request: NextRequest) {
  try {
    // Initialize table if needed
    await initCredentialsTable()
    
    // Get credentials
    const credentials = await getCredentials()
    
    if (!credentials) {
      return NextResponse.json(
        { error: "Colissimo API not configured. Please set up credentials first." },
        { status: 401 }
      )
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)))
    const search = searchParams.get("search") || ""

    // If searching by specific tracking number
    if (search && search.length >= 10) {
      try {
        const result = await getColis(
          { username: credentials.username, password: credentials.password },
          search
        )
        
        if (result.result_type === "success" && result.result_content) {
          return NextResponse.json({
            parcels: [mapParcel(result.result_content)],
            total: 1,
            page: 1,
            limit,
            totalPages: 1,
          })
        } else {
          return NextResponse.json({
            parcels: [],
            total: 0,
            page: 1,
            limit,
            totalPages: 0,
          })
        }
      } catch (error) {
        // Fall through to listing if getColis fails
        console.warn("getColis failed, falling back to list:", error)
      }
    }

    // Get all parcels from Colissimo API
    const response = await listeColis(
      { username: credentials.username, password: credentials.password },
      1 // API page
    )

    if (response.result_type === "error") {
      if (response.result_code === "AUTH_FAILED") {
        return NextResponse.json(
          { error: "Authentication failed. Please check your credentials." },
          { status: 401 }
        )
      }
      return NextResponse.json(
        { error: "Failed to fetch parcels from Colissimo" },
        { status: 500 }
      )
    }

    const allParcels = response.result_content.parcels

    // Filter by search if provided (partial match on tracking number)
    let filteredParcels = allParcels
    if (search) {
      const searchLower = search.toLowerCase()
      filteredParcels = allParcels.filter(
        (p) => p.code_barre?.toLowerCase().includes(searchLower)
      )
    }

    // Map to frontend format
    const mappedParcels = filteredParcels.map(mapParcel)

    // Calculate pagination
    const total = mappedParcels.length
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit
    const paginatedParcels = mappedParcels.slice(offset, offset + limit)

    return NextResponse.json({
      parcels: paginatedParcels,
      total,
      page,
      limit,
      totalPages,
    })
  } catch (error) {
    console.error("Error fetching parcels:", error)
    
    // Check for auth errors
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    if (errorMessage.toLowerCase().includes("auth")) {
      return NextResponse.json(
        { error: "Authentication failed. Please check your credentials." },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to fetch parcels from Colissimo" },
      { status: 500 }
    )
  }
}
