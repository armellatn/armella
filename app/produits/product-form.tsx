"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { createProduct, updateProduct } from "./actions"

const productSchema = z.object({
  code_produit: z.string().min(1, "Le code produit est requis"),
  nom: z.string().min(1, "Le nom est requis"),
  marque: z.string().min(1, "La marque est requise"),
  categorie_id: z.string().min(1, "La catégorie est requise"),
  description: z.string().optional(),
  prix_achat: z.string().min(1, "Le prix d'achat est requis"),
  prix_vente: z.string().min(1, "Le prix de vente est requis"),
  stock_quantite: z.string().min(1, "La quantité en stock est requise"),
  stock_minimum: z.string().min(1, "Le stock minimum est requis"),
  puissance: z.string().optional(),
  diametre: z.string().optional(),
  courbure: z.string().optional(),
  duree_port: z.string().optional(),
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

  const defaultValues: Partial<ProductFormValues> = {
    code_produit: product?.code_produit || "",
    nom: product?.nom || "",
    marque: product?.marque || "",
    categorie_id: product?.categorie_id?.toString() || "",
    description: product?.description || "",
    prix_achat: product?.prix_achat?.toString() || "",
    prix_vente: product?.prix_vente?.toString() || "",
    stock_quantite: product?.stock_quantite?.toString() || "",
    stock_minimum: product?.stock_minimum?.toString() || "5",
    puissance: product?.puissance || "",
    diametre: product?.diametre || "",
    courbure: product?.courbure || "",
    duree_port: product?.duree_port || "",
    contenu_boite: product?.contenu_boite || "",
  }

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues,
  })

  async function onSubmit(data: ProductFormValues) {
    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value)
        }
      })

      let result

      if (product?.id) {
        result = await updateProduct(product.id, formData)
      } else {
        result = await createProduct(formData)
      }

      if (result.success) {
        router.push("/produits")
        router.refresh()
      } else {
        setError(result.error || "Une erreur est survenue")
        setIsSubmitting(false)

        // Si l'erreur concerne le code produit, mettre le focus sur ce champ
        if (result.error?.includes("code produit")) {
          form.setFocus("code_produit")
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      setError("Une erreur est survenue lors de l'enregistrement")
      setIsSubmitting(false)
    }
  }

  // Générer un code produit unique aléatoire
  const generateRandomCode = () => {
    const prefix = "LEN"
    const randomNum = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")
    const timestamp = Date.now().toString().slice(-4)
    const code = `${prefix}-${randomNum}-${timestamp}`
    form.setValue("code_produit", code)
  }

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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="code_produit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code produit</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="EX123" {...field} />
                    </FormControl>
                    <Button type="button" variant="outline" onClick={generateRandomCode} className="whitespace-nowrap">
                      Générer
                    </Button>
                  </div>
                  <FormDescription>Code unique pour identifier le produit</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="nom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input placeholder="Acuvue Oasys" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="marque"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marque</FormLabel>
                <FormControl>
                  <Input placeholder="Johnson & Johnson" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categorie_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catégorie</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une catégorie" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Description du produit" className="min-h-[100px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="prix_achat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prix d'achat (TND)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" {...field} />
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
                <FormLabel>Prix de vente (TND)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stock_quantite"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantité en stock</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} />
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
                  <Input type="number" min="0" {...field} />
                </FormControl>
                <FormDescription>Seuil d'alerte pour réapprovisionnement</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FormField
            control={form.control}
            name="puissance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Puissance</FormLabel>
                <FormControl>
                  <Input placeholder="-3.00" {...field} />
                </FormControl>
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
                  <Input placeholder="14.2" {...field} />
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
                  <Input placeholder="8.6" {...field} />
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
                  <Input placeholder="Journalière" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="contenu_boite"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contenu de la boîte</FormLabel>
              <FormControl>
                <Input placeholder="30 lentilles" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.push("/produits")}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : product ? "Mettre à jour" : "Créer"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
