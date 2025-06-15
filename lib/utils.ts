import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow, format } from "date-fns"
import { fr } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Fonction pour formater une date relative (il y a X heures, etc.)
export function formatRelativeDate(date: string | Date) {
  if (!date) return ""

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date
    return formatDistanceToNow(dateObj, {
      addSuffix: true,
      locale: fr,
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return ""
  }
}

// Fonction pour formater une date au format standard
export function formatDate(date: string | Date, formatStr = "dd/MM/yyyy") {
  if (!date) return ""

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date
    return format(dateObj, formatStr, { locale: fr })
  } catch (error) {
    console.error("Error formatting date:", error)
    return ""
  }
}
