"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import PinInput from "@/components/pin-input"
import { loginWithPin } from "../auth/actions"
import NumericKeypad from "@/components/numeric-keypad"
import { useVirtualKeyboard } from "@/hooks/use-virtual-keyboard"

export default function PinLoginForm() {
  const [pin, setPin] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Utiliser le hook de clavier virtuel
  const { getInputProps, renderKeyboard } = useVirtualKeyboard({
    type: "numeric",
    onEnter: () => {
      if (pin.length === 4) {
        handleSubmit(new Event("submit") as any)
      }
    },
  })

  const handlePinChange = (value: string) => {
    setPin(value)
    setError(null)
  }

  const handleKeyPress = (key: string) => {
    if (pin.length < 4) {
      setPin(pin + key)
      setError(null)
    }
  }

  const handleBackspace = () => {
    setPin(pin.slice(0, -1))
    setError(null)
  }

  const handleClear = () => {
    setPin("")
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (pin.length < 4) {
      setError("Veuillez entrer un code PIN valide")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await loginWithPin(pin)

      if (result.success) {
        router.push("/")
        router.refresh()
      } else {
        setError(result.error || "Erreur de connexion")
      }
    } catch (err) {
      setError("Une erreur est survenue lors de la connexion")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <PinInput value={pin} onChange={handlePinChange} length={4} {...getInputProps()} />
        </div>

        <NumericKeypad onKeyPress={handleKeyPress} onBackspace={handleBackspace} onClear={handleClear} />
      </div>

      <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
        {loading ? "Connexion en cours..." : "Se connecter"}
      </Button>

      {/* Rendu du clavier virtuel */}
      {renderKeyboard}
    </form>
  )
}
