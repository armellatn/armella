"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"

interface PinInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
}

export default function PinInput({ value, onChange, length = 4, disabled = false }: PinInputProps) {
  const [pins, setPins] = useState<string[]>(value.split("").concat(Array(length - value.length).fill("")))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Mettre à jour les pins si la valeur change de l'extérieur
    if (value.length <= length) {
      setPins(value.split("").concat(Array(length - value.length).fill("")))
    }
  }, [value, length])

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value

    // Ne prendre que le dernier caractère si plusieurs sont collés
    const digit = newValue.slice(-1)

    // Vérifier si c'est un chiffre
    if (digit && !/^\d+$/.test(digit)) {
      return
    }

    // Mettre à jour le tableau des pins
    const newPins = [...pins]
    newPins[index] = digit
    setPins(newPins)

    // Mettre à jour la valeur parent
    onChange(newPins.join(""))

    // Passer au champ suivant si un chiffre a été entré
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Gérer la touche Backspace
    if (e.key === "Backspace") {
      if (pins[index] === "") {
        // Si le champ actuel est vide, passer au champ précédent
        if (index > 0) {
          inputRefs.current[index - 1]?.focus()
        }
      } else {
        // Sinon, effacer le champ actuel
        const newPins = [...pins]
        newPins[index] = ""
        setPins(newPins)
        onChange(newPins.join(""))
      }
    }

    // Gérer les touches fléchées
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }

    if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text/plain").trim()

    // Vérifier si les données collées sont des chiffres
    if (!/^\d+$/.test(pastedData)) {
      return
    }

    // Prendre seulement le nombre de chiffres nécessaires
    const digits = pastedData.slice(0, length).split("")
    const newPins = [...Array(length).fill("")]

    digits.forEach((digit, index) => {
      if (index < length) {
        newPins[index] = digit
      }
    })

    setPins(newPins)
    onChange(newPins.join(""))

    // Mettre le focus sur le dernier champ rempli ou le suivant
    const lastIndex = Math.min(digits.length, length - 1)
    inputRefs.current[lastIndex]?.focus()
  }

  return (
    <div className="flex justify-center gap-2">
      {pins.map((pin, index) => (
        <Input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={pin}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="h-14 w-14 text-center text-2xl"
        />
      ))}
    </div>
  )
}
