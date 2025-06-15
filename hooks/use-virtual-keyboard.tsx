"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import VirtualKeyboard from "@/components/virtual-keyboard"

interface UseVirtualKeyboardProps {
  type?: "text" | "numeric" | "email"
  onEnter?: () => void
}

export function useVirtualKeyboard({ type = "text", onEnter }: UseVirtualKeyboardProps = {}) {
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [activeElement, setActiveElement] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null)
  const isTouchDevice = useRef(false)

  // Vérifier si l'appareil est tactile au chargement
  useEffect(() => {
    isTouchDevice.current = "ontouchstart" in window || navigator.maxTouchPoints > 0
  }, [])

  // Gérer l'ouverture du clavier
  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // N'afficher le clavier que sur les appareils tactiles
    if (isTouchDevice.current) {
      setShowKeyboard(true)
      setActiveElement(e.currentTarget)
      setInputValue(e.currentTarget.value)
    }
  }

  // Gérer la fermeture du clavier
  const handleClose = () => {
    setShowKeyboard(false)
    setActiveElement(null)
  }

  // Gérer l'appui sur une touche
  const handleKeyPress = (key: string) => {
    if (!activeElement) return

    const start = activeElement.selectionStart || 0
    const end = activeElement.selectionEnd || 0

    const newValue = inputValue.substring(0, start) + key + inputValue.substring(end)
    setInputValue(newValue)

    // Mettre à jour la valeur de l'élément actif
    activeElement.value = newValue

    // Déclencher l'événement input pour que React détecte le changement
    const event = new Event("input", { bubbles: true })
    activeElement.dispatchEvent(event)

    // Mettre à jour la position du curseur
    setTimeout(() => {
      const newPosition = start + key.length
      activeElement.setSelectionRange(newPosition, newPosition)
    }, 0)
  }

  // Gérer la suppression
  const handleBackspace = () => {
    if (!activeElement) return

    const start = activeElement.selectionStart || 0
    const end = activeElement.selectionEnd || 0

    if (start === end && start > 0) {
      // Si aucun texte n'est sélectionné, supprimer le caractère précédent
      const newValue = inputValue.substring(0, start - 1) + inputValue.substring(end)
      setInputValue(newValue)

      // Mettre à jour la valeur de l'élément actif
      activeElement.value = newValue

      // Déclencher l'événement input
      const event = new Event("input", { bubbles: true })
      activeElement.dispatchEvent(event)

      // Mettre à jour la position du curseur
      setTimeout(() => {
        const newPosition = start - 1
        activeElement.setSelectionRange(newPosition, newPosition)
      }, 0)
    } else if (start !== end) {
      // Si du texte est sélectionné, le supprimer
      const newValue = inputValue.substring(0, start) + inputValue.substring(end)
      setInputValue(newValue)

      // Mettre à jour la valeur de l'élément actif
      activeElement.value = newValue

      // Déclencher l'événement input
      const event = new Event("input", { bubbles: true })
      activeElement.dispatchEvent(event)

      // Mettre à jour la position du curseur
      setTimeout(() => {
        activeElement.setSelectionRange(start, start)
      }, 0)
    }
  }

  // Gérer la touche Entrée
  const handleEnter = () => {
    if (onEnter) {
      onEnter()
    }
    handleClose()
  }

  // Mettre à jour inputValue lorsque activeElement change
  useEffect(() => {
    if (activeElement) {
      setInputValue(activeElement.value)
    }
  }, [activeElement])

  // Créer les props pour les éléments d'entrée
  const getInputProps = () => ({
    onFocus: handleFocus,
  })

  // Rendu du clavier virtuel
  const renderKeyboard = showKeyboard ? (
    <VirtualKeyboard
      onKeyPress={handleKeyPress}
      onBackspace={handleBackspace}
      onEnter={handleEnter}
      onClose={handleClose}
      keyboardType={type}
    />
  ) : null

  return {
    showKeyboard,
    getInputProps,
    renderKeyboard,
  }
}
