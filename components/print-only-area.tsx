"use client"

/**
 * Au moment d’imprimer, on masque tout le document
 * sauf l’élément #print-area (et son contenu).
 */
export default function PrintOnlyAreaStyles() {
  return (
    <style>{`
      @media print {
        body * { visibility: hidden !important; }
        #print-area, #print-area * { visibility: visible !important; }
        #print-area { position: absolute; left: 0; top: 0; width: 100%; }
      }
    `}</style>
  )
}
