"use client"

import { Button } from "@/components/ui/button"
import { SkipBackIcon as Backspace } from "lucide-react"

interface NumericKeypadProps {
  onKeyPress: (key: string) => void
  onBackspace: () => void
  onClear: () => void
}

export default function NumericKeypad({ onKeyPress, onBackspace, onClear }: NumericKeypadProps) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-xs mx-auto mt-4">
      {keys.map((key) => (
        <Button
          key={key}
          type="button"
          variant="outline"
          className="h-16 text-2xl font-medium"
          onClick={() => onKeyPress(key)}
        >
          {key}
        </Button>
      ))}
      <Button type="button" variant="outline" className="h-16 col-span-2 text-lg" onClick={onClear}>
        Effacer
      </Button>
      <Button type="button" variant="outline" className="h-16 flex items-center justify-center" onClick={onBackspace}>
        <Backspace className="h-8 w-8" />
      </Button>
    </div>
  )
}
