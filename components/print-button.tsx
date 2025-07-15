"use client"

/** Bouton d'impression simple : lance la boîte de dialogue du navigateur. */
export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted print:hidden"
    >
      Imprimer PDF
    </button>
  )
}
