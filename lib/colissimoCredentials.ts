/**
 * Colissimo Credentials Management
 * Handles secure storage and retrieval of API credentials
 */

import db from "./db"
import { encrypt, decrypt } from "./crypto"

export interface StoredCredentials {
  username: string
  password: string
}

/**
 * Initialize the credentials table if it doesn't exist
 */
export async function initCredentialsTable(): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS colissimo_credentials (
      id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      username TEXT NOT NULL,
      password_enc TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

/**
 * Save (upsert) encrypted credentials
 * @param username - Colissimo API username
 * @param passwordPlain - Plain text password (will be encrypted)
 */
export async function saveCredentials(
  username: string,
  passwordPlain: string
): Promise<void> {
  // Encrypt the password
  const passwordEnc = encrypt(passwordPlain)
  
  // Upsert with ON CONFLICT
  await db.query(
    `
    INSERT INTO colissimo_credentials (id, username, password_enc, created_at, updated_at)
    VALUES (1, $1, $2, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      username = EXCLUDED.username,
      password_enc = EXCLUDED.password_enc,
      updated_at = NOW()
    `,
    [username, passwordEnc]
  )
}

/**
 * Get decrypted credentials
 * @returns Credentials object or null if not configured
 */
export async function getCredentials(): Promise<StoredCredentials | null> {
  const result = await db.query(
    `SELECT username, password_enc FROM colissimo_credentials WHERE id = 1`
  )
  
  if (result.rows.length === 0) {
    return null
  }
  
  const row = result.rows[0]
  
  try {
    const password = decrypt(row.password_enc)
    return {
      username: row.username,
      password,
    }
  } catch (error) {
    console.error("Failed to decrypt Colissimo credentials")
    return null
  }
}

/**
 * Check if credentials are configured
 */
export async function hasCredentials(): Promise<boolean> {
  const result = await db.query(
    `SELECT 1 FROM colissimo_credentials WHERE id = 1`
  )
  return result.rows.length > 0
}

/**
 * Delete stored credentials
 */
export async function deleteCredentials(): Promise<void> {
  await db.query(`DELETE FROM colissimo_credentials WHERE id = 1`)
}

/**
 * Get credentials metadata (without password)
 */
export async function getCredentialsInfo(): Promise<{ username: string; updatedAt: Date } | null> {
  const result = await db.query(
    `SELECT username, updated_at FROM colissimo_credentials WHERE id = 1`
  )
  
  if (result.rows.length === 0) {
    return null
  }
  
  return {
    username: result.rows[0].username,
    updatedAt: result.rows[0].updated_at,
  }
}
