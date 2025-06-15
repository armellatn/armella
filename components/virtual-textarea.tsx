"use client"

import type React from "react"

import { useState, useEffect, forwardRef } from "react"
import { Textarea } from "@/components/ui/textarea"
import { useVirtualKeyboard } from "@/hooks/use-virtual-keyboard"
import { cn } from "@/lib/utils"

interface VirtualTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  keyboardType?: "text" | "numeric" | "email"
}

const VirtualTextarea = forwardRef<HTMLTextAreaElement, VirtualTextareaProps>(
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
      return <Textarea ref={ref} className={className} {...props} />
    }

    return (
      <>
        <Textarea ref={ref} className={cn(className)} {...props} {...getInputProps()} />
        {renderKeyboard}
      </>
    )
  },
)

VirtualTextarea.displayName = "VirtualTextarea"

export { VirtualTextarea }
