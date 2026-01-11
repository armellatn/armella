/**
 * Crypto utilities for AES-256-GCM encryption/decryption
 * Used to securely store Colissimo API credentials
 */

import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16 // 128 bits
const AUTH_TAG_LENGTH = 16 // 128 bits

/**
 * Get the encryption key from environment variable
 * Key must be 32 bytes (256 bits) encoded as base64
 */
function getEncryptionKey(): Buffer {
  const keyBase64 = process.env.COLISSIMO_CRED_KEY
  if (!keyBase64) {
    throw new Error("COLISSIMO_CRED_KEY environment variable is not set")
  }
  
  const key = Buffer.from(keyBase64, "base64")
  if (key.length !== 32) {
    throw new Error("COLISSIMO_CRED_KEY must be exactly 32 bytes (256 bits) when decoded from base64")
  }
  
  return key
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 * Returns: base64 encoded string containing IV + AuthTag + Ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(plaintext, "utf8")
  encrypted = Buffer.concat([encrypted, cipher.final()])
  
  const authTag = cipher.getAuthTag()
  
  // Combine: IV (16 bytes) + AuthTag (16 bytes) + Ciphertext
  const combined = Buffer.concat([iv, authTag, encrypted])
  
  return combined.toString("base64")
}

/**
 * Decrypt a base64 encoded string that was encrypted with encrypt()
 * Input format: base64(IV + AuthTag + Ciphertext)
 */
export function decrypt(encryptedBase64: string): string {
  const key = getEncryptionKey()
  const combined = Buffer.from(encryptedBase64, "base64")
  
  if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error("Invalid encrypted data: too short")
  }
  
  // Extract: IV (16 bytes) + AuthTag (16 bytes) + Ciphertext
  const iv = combined.subarray(0, IV_LENGTH)
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH)
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(ciphertext)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  
  return decrypted.toString("utf8")
}
