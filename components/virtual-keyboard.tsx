"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, ChevronsUp, ChevronDown } from "lucide-react"

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void
  onBackspace: () => void
  onEnter: () => void
  onClose: () => void
  keyboardType?: "text" | "numeric" | "email"
}

export default function VirtualKeyboard({
  onKeyPress,
  onBackspace,
  onEnter,
  onClose,
  keyboardType = "text",
}: VirtualKeyboardProps) {
  const [shift, setShift] = useState(false)
  const [currentLayout, setCurrentLayout] = useState<"main" | "symbols">("main")

  // Définir les différentes dispositions de clavier
  const layouts = {
    main: {
      text: [
        ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
        ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
        ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
        ["z", "x", "c", "v", "b", "n", "m", ",", "."],
      ],
      numeric: [
        ["1", "2", "3"],
        ["4", "5", "6"],
        ["7", "8", "9"],
        [".", "0", "TND"],
      ],
      email: [
        ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
        ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
        ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
        ["z", "x", "c", "v", "b", "n", "m", "@", "."],
      ],
    },
    symbols: {
      text: [
        ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")"],
        ["-", "_", "=", "+", "[", "]", "{", "}", ";", "'"],
        ['"', "\\", "|", "/", "?", "<", ">", "~", "`"],
      ],
      numeric: [
        ["+", "-", "*"],
        ["/", "%", "="],
        ["(", ")", ","],
        ["TND", "$", "£"],
      ],
      email: [
        ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")"],
        ["-", "_", "=", "+", "[", "]", "{", "}", ";", "'"],
        ['"', "\\", "|", "/", "?", "<", ">", "~", "`"],
      ],
    },
  }

  // Obtenir la disposition actuelle
  const currentKeys = layouts[currentLayout][keyboardType as keyof (typeof layouts)[typeof currentLayout]]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg p-2 z-50">
      <div className="flex justify-between items-center mb-2">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ChevronDown className="h-5 w-5" />
          <span className="ml-1">Fermer</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentLayout(currentLayout === "main" ? "symbols" : "main")}
        >
          {currentLayout === "main" ? "123" : "ABC"}
        </Button>
      </div>

      <div className="space-y-2">
        {currentKeys.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center space-x-1">
            {row.map((key) => (
              <Button
                key={key}
                variant="outline"
                className="h-12 min-w-[40px] md:min-w-[50px] text-lg"
                onClick={() => onKeyPress(shift ? key.toUpperCase() : key)}
              >
                {shift ? key.toUpperCase() : key}
              </Button>
            ))}
          </div>
        ))}

        <div className="flex justify-center space-x-1">
          <Button variant="outline" className="h-12 min-w-[60px] md:min-w-[80px]" onClick={() => setShift(!shift)}>
            <ChevronsUp className={`h-5 w-5 ${shift ? "text-primary" : ""}`} />
          </Button>

          <Button variant="outline" className="h-12 flex-1" onClick={() => onKeyPress(" ")}>
            Espace
          </Button>

          <Button variant="outline" className="h-12 min-w-[60px] md:min-w-[80px]" onClick={onBackspace}>
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Button variant="primary" className="h-12 min-w-[60px] md:min-w-[80px]" onClick={onEnter}>
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
