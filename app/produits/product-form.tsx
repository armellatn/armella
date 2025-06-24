"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form, FormControl, FormDescription, FormField,
  FormItem, FormLabel, FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { createProduct, updateProduct } from "./actions"

/* -------------------------------------------------------------------------- */
/*                               Validation Zod                               */
/* -------------------------------------------------------------------------- */


const productSchema = z.object({
  code_produit:  z.string().min(1, "Le code produit est requis"),
  nom:           z.string().min(1, "Le nom est requis"),
  marque:        z.string().min(1, "La marque est requise"),
  categorie_id:  z.string().min(1, "La catégorie est requise"),
  description:   z.string().optional(),
  prix_achat:    z.string().min(1, "Le prix d'achat est requis"),
  prix_vente:    z.string().min(1, "Le prix de vente est requis"),
  stock_quantite:z.string().min(1, "La quantité en stock est requise"),
  stock_minimum: z.string().min(1, "Le stock minimum est requis"),
  puissance:     z.string().optional(),
  diametre:      z.string().optional(),
  courbure:      z.string().optional(),
  duree_port:    z.string().optional(),
  contenu_boite: z.string().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
  product?: any
  categories: { id: number; nom: string }[]
}

export default function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
const [stayOnForm, setStayOnForm] = useState(false)

  /* ----------------------------- Valeurs initiales ----------------------------- */
  const defaultValues: Partial<ProductFormValues> = {
    code_produit:  product?.code_produit || "",
    nom:           product?.nom          || "",
    marque:        product?.marque       || "",
    categorie_id:  product?.categorie_id?.toString() || "",
    description:   product?.description  || "",
    prix_achat:    product?.prix_achat?.toString() || "",
    prix_vente:    product?.prix_vente?.toString() || "",
stock_quantite: product?.stock_quantite?.toString() || "1",
    stock_minimum: product?.stock_minimum?.toString() || "5",
    puissance:     product?.puissance    || "",
    diametre:      product?.diametre     || "",
    courbure:      product?.courbure     || "",
    duree_port:    product?.duree_port   || "",
    contenu_boite: product?.contenu_boite|| "",
  }

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues,
  })

  /* -------------------------------------------------------------------------- */
  /*                 Auto-remplissage déclenché quand le nom change             */
  /* -------------------------------------------------------------------------- */
  const nomValue = form.watch("nom") ?? ""

  useEffect(() => {
    const raw   = nomValue.trim()
    const lower = raw.toLowerCase()
    const upper = raw.toUpperCase()

    /* -------- 1) Marque automatique -------- */
    const setMarque = (m: string) => form.setValue("marque", m)

    if (upper.startsWith("KADET"))                                     setMarque("LORANS")
    else if (["WHITE","MAGIC","AZURE","TROPICAL","PURE","KENZO","LAZORDE"]
            .some(p => upper.startsWith(p)))                           setMarque("LAZORD")
    else if (upper.startsWith("LIO"))                                  setMarque("NK")
    else if (["CATY","LAVA"].some(p => upper.startsWith(p)))           setMarque("ARMELLA")
    else if (["MAROUN","DESI","DIVA"].some(p => upper.startsWith(p)))  setMarque("VICTORIA")
    else if (upper.startsWith("MAY"))                                  setMarque("NOOR")
    else if (["MOOD","WILD"].some(p => upper.startsWith(p)))           setMarque("LEZZA")

    /* -------- 2) Règles lentilles (catégorie, prix, durée, puissance) -------- */
    const regex = /(.*?)(\d+(?:mois|ans))(?:\s*(-?\d+(?:\.\d+)?))?/
    const match = lower.match(regex)

    if (match) {
      const [, , duree, pStr] = match
      const puissance = pStr ? parseFloat(pStr).toString() : "0"

      const isCorrection= !!pStr

      form.setValue("puissance", isCorrection ? puissance : "0")

      form.setValue("duree_port", duree)
      form.setValue("prix_achat", "0")

      if (isCorrection && duree.includes("6mois")) {
        form.setValue("prix_vente", "110")
        form.setValue("categorie_id", getCategorieId("Correction"))
      } else if (isCorrection && duree.includes("1ans")) {
        form.setValue("prix_vente", "140")
        form.setValue("categorie_id", getCategorieId("Correction"))
      } else if (!isCorrection && duree.includes("6mois")) {
        form.setValue("prix_vente", "90")
        form.setValue("categorie_id", getCategorieId("Sans Correction"))
      } else if (!isCorrection && duree.includes("1ans")) {
        form.setValue("prix_vente", "120")
        form.setValue("categorie_id", getCategorieId("Sans Correction"))
      }
    } else if (lower.includes("accessoire")) {
      form.setValue("puissance",  "0")
      form.setValue("duree_port", "")
      form.setValue("prix_vente", "25")
      form.setValue("prix_achat", "0")
      form.setValue("categorie_id", getCategorieId("Accessoire"))
    }
  }, [nomValue])

  /* --------------------------- Utilitaire catégorie --------------------------- */
  function getCategorieId(n: string): string {
    const cat = categories.find(c => c.nom.toLowerCase() === n.toLowerCase())
    return cat ? cat.id.toString() : ""
  }

  /* ---------------------- Génération aléatoire du code produit ---------------------- */
  const generateRandomCode = () => {
    const prefix = "LEN"
    const rnd    = Math.floor(Math.random() * 10000).toString().padStart(4, "0")
    const time   = Date.now().toString().slice(-4)
    form.setValue("code_produit", `${prefix}-${rnd}-${time}`)
  }

  /* ---------------------------------- Submit ---------------------------------- */
  async function onSubmit(data: ProductFormValues) {
    setIsSubmitting(true)
    setError(null)
    try {
      const fd = new FormData()
      Object.entries(data).forEach(([k,v]) => v !== undefined && fd.append(k, v))
      const res = product?.id
        ? await updateProduct(product.id, fd)
        : await createProduct(fd)
if (res.success) {
  if (stayOnForm) {
    form.reset()
    setIsSubmitting(false)
    setStayOnForm(false)
  } else {
    router.push("/produits")
    router.refresh()
  }
}
 else {
        setError(res.error || "Une erreur est survenue")
        setIsSubmitting(false)
        if (res.error?.includes("code produit")) form.setFocus("code_produit")
      }
    } catch(e) {
      console.error(e)
      setError("Une erreur est survenue lors de l'enregistrement")
      setIsSubmitting(false)
    }
  }

  /* ------------------------------------ UI ------------------------------------ */
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* LIGNE 1 : code + nom */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Code produit */}
          <FormField
            control={form.control}
            name="code_produit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code produit</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input {...field} placeholder="EX123" />
                  </FormControl>
                  <Button type="button" variant="outline" onClick={generateRandomCode}>
                    Générer
                  </Button>
                </div>
                <FormDescription>Code unique pour identifier le produit</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Nom */}
          <FormField
            control={form.control}
            name="nom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex : KADET 6mois -1" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* LIGNE 2 : marque + catégorie */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Marque (auto) */}
          <FormField
            control={form.control}
            name="marque"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marque</FormLabel>
                <FormControl>
                  <Input
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Auto si KADET, LIO, etc."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Catégorie */}
          <FormField
            control={form.control}
            name="categorie_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catégorie</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une catégorie" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* DESCRIPTION */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Description du produit" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* LIGNE 3 : puissance / durée / prix vente / prix achat */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="puissance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Puissance</FormLabel>
                <FormControl>
                  <Input
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="-1.00"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duree_port"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Durée de port</FormLabel>
                <FormControl>
                  <Input
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="6mois / 1ans"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prix_vente"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prix vente (TND)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    value={field.value || ""}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prix_achat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prix achat (TND)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    value={field.value || ""}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* LIGNE 4 : stock, diamètre, courbure */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="stock_quantite"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantité en stock</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stock_minimum"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock minimum</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormDescription>Seuil d’alerte de réapprovisionnement</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="diametre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Diamètre</FormLabel>
                <FormControl>
                  <Input
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Ex : 14.2"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="courbure"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Courbure</FormLabel>
                <FormControl>
                  <Input
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Ex : 8.6"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Contenu boîte */}
        <FormField
          control={form.control}
          name="contenu_boite"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contenu de la boîte</FormLabel>
              <FormControl>
                <Input
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Ex : 30 lentilles"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* BOUTONS */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.push("/produits")}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : product ? "Mettre à jour" : "Créer"}
          </Button>
          {!product && (
  <Button
    type="submit"
    variant="secondary"
    disabled={isSubmitting}
    onClick={() => setStayOnForm(true)}
  >
    {isSubmitting ? "Ajout..." : "Créer et ajouter un autre"}
  </Button>
)}
        </div>
      </form>
    </Form>
  )
}
