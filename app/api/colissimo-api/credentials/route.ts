/**
 * Colissimo API - Credentials Management Route
 * POST: Save/update credentials
 * GET: Get credentials info (without password)
 * DELETE: Remove credentials
 */

import { NextRequest, NextResponse } from "next/server"
import {
  saveCredentials,
  getCredentialsInfo,
  deleteCredentials,
  initCredentialsTable,
} from "@/lib/colissimoCredentials"
import { validateCredentials } from "@/lib/colissimoClient"

// POST /api/colissimo-api/credentials
// Save credentials after validating with Colissimo API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      )
    }

    // Validate credentials with Colissimo API first
    const validationResult = await validateCredentials({ username, password })

    if (validationResult.result_type === "error" && validationResult.result_code === "AUTH_FAILED") {
      return NextResponse.json(
        { error: "Invalid credentials - authentication failed with Colissimo" },
        { status: 401 }
      )
    }

    // Initialize table if needed and save credentials
    await initCredentialsTable()
    await saveCredentials(username, password)

    return NextResponse.json({
      success: true,
      message: "Credentials saved successfully",
    })
  } catch (error) {
    console.error("Error saving credentials:", error)
    return NextResponse.json(
      { error: "Failed to save credentials" },
      { status: 500 }
    )
  }
}

// GET /api/colissimo-api/credentials
// Get credentials metadata (without password)
export async function GET() {
  try {
    await initCredentialsTable()
    const info = await getCredentialsInfo()

    if (!info) {
      return NextResponse.json(
        { configured: false },
        { status: 200 }
      )
    }

    return NextResponse.json({
      configured: true,
      username: info.username,
      updatedAt: info.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error("Error getting credentials info:", error)
    return NextResponse.json(
      { error: "Failed to get credentials info" },
      { status: 500 }
    )
  }
}

// DELETE /api/colissimo-api/credentials
// Remove stored credentials
export async function DELETE() {
  try {
    await deleteCredentials()
    return NextResponse.json({
      success: true,
      message: "Credentials deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting credentials:", error)
    return NextResponse.json(
      { error: "Failed to delete credentials" },
      { status: 500 }
    )
  }
}
