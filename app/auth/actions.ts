"use server"

import { cookies } from "next/headers"
import db from "@/lib/db"
import { redirect } from "next/navigation"

// Fonction pour se connecter avec un code PIN
export async function loginWithPin(pin: string) {
  try {
    const result = await db.query(
      `SELECT id, nom, prenom, role
       FROM utilisateurs
       WHERE code_pin = $1 AND actif = true`,
      [pin]
    )

    if (result.rows.length === 0) {
      return { success: false, error: "Code PIN invalide" }
    }

    const dbRole = (result.rows[0].role || "").trim().toLowerCase()
    const normalizedRole = dbRole === "admin" ? "admin" : "utilisateur"

    const user = {
      ...result.rows[0],
      role: normalizedRole,
    }

    await db.query(
      `UPDATE utilisateurs SET derniere_connexion = CURRENT_TIMESTAMP WHERE id = $1`,
      [user.id]
    )

    const session = {
      userId: user.id,
      userName: `${user.prenom} ${user.nom}`,
      userRole: user.role,
      expires: Date.now() + 24 * 60 * 60 * 1000,
    }

    const cookieStore = await cookies()
    cookieStore.set("session", JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
      path: "/",
    })

    return { success: true }
  } catch (error) {
    console.error("Erreur de connexion:", error)
    return { success: false, error: "Erreur lors de la connexion" }
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
  return { success: true }
}

export async function getSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("session")
  if (!sessionCookie) return null

  try {
    const session = JSON.parse(sessionCookie.value)
    if (session.expires < Date.now()) {
      cookieStore.delete("session")
      return null
    }
    return session
  } catch {
    return null
  }
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) redirect("/login")
  return session
}

export async function createUser(formData: FormData) {
  const nom = formData.get("nom") as string
  const prenom = formData.get("prenom") as string
  const email = formData.get("email") as string
  const role = formData.get("role") as string
  const codePin = formData.get("code_pin") as string

  try {
    const existingEmail = await db.query(
      `SELECT id FROM utilisateurs WHERE email = $1`,
      [email]
    )

    if (existingEmail.rows.length > 0) {
      return { success: false, error: "Cet email est déjà utilisé" }
    }

    const existingPins = await db.query(
      `SELECT id FROM utilisateurs WHERE code_pin = $1`,
      [codePin]
    )

    if (existingPins.rows.length > 0) {
      return { success: false, error: "Ce code PIN est déjà utilisé" }
    }

    await db.query(
      `INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, code_pin, actif)
       VALUES ($1, $2, $3, 'default_password', $4, $5, true)`,
      [nom, prenom, email, role, codePin]
    )

    return { success: true }
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error)
    return { success: false, error: "Erreur lors de la création de l'utilisateur" }
  }
}
