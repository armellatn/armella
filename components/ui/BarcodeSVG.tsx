"use client"
import { useEffect, useRef } from "react"
import JsBarcode from "jsbarcode"

interface BarcodeSVGProps {
  value: string
  width?: number
  height?: number
  displayValue?: boolean
}

export default function BarcodeSVG({
  value,
  width = 2,
  height = 60,
  displayValue = true,
}: BarcodeSVGProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (svgRef.current) {
      JsBarcode(svgRef.current, value, {
        format: "CODE128",
        lineColor: "#000",
        width,
        height,
        displayValue,
      })
    }
  }, [value, width, height, displayValue])

  return <svg ref={svgRef} />
}
