"use client"

import type React from "react"

import { useState, useEffect, forwardRef } from "react"
import { Input } from "@/components/ui/input"
import { useVirtualKeyboard } from "@/hooks/use-virtual-keyboard"
import { cn } from "@/lib/utils"

interface VirtualInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  keyboardType?: "text" | "numeric" | "email"
}

const VirtualInput = forwardRef<HTMLInputElement, VirtualInputProps>(
  ({ className, keyboardType = "text", ...props }, ref) => {
    const [isTouchDevice, setIsTouchDevice] = useState(false)
    const { getInputProps, renderKeyboard } = useVirtualKeyboard({
      type: keyboardType,
      onEnter: props.onKeyDown
        ? (e) => {
            const event = new KeyboardEvent("keydown", { key: "Enter" })
            props.onKeyDown?.(event as any)
          }
        : undefined,
    })

    // Détecter si c'est un appareil tactile
    useEffect(() => {
      setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0)
    }, [])

    // Si ce n'est pas un appareil tactile, ne pas utiliser le clavier virtuel
    if (!isTouchDevice) {
      return <Input ref={ref} className={className} {...props} />
    }

    return (
      <>
        <Input ref={ref} className={cn(className)} {...props} {...getInputProps()} />
        {renderKeyboard}
      </>
    )
  },
)

VirtualInput.displayName = "VirtualInput"

export { VirtualInput }
