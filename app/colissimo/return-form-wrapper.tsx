"use client"

/**
 * Fin wrapper client : reçoit la liste des produits depuis
 * le serveur et rend le véritable formulaire client.
 */
import MultiReturnForm from "./return-form-client"

interface Product {
  id: number
  nom: string
  prix_vente: number
}

export default function ReturnFormWrapper({ products }: { products: Product[] }) {
  return <MultiReturnForm products={products} />
}
