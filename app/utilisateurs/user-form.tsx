"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { createUser, updateUser } from "./actions"

const userSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  email: z.string().email("Email invalide"),
  role: z.string().min(1, "Le rôle est requis"),
  actif: z.boolean().default(true),
  code_pin: z
    .string()
    .min(4, "Le code PIN doit contenir au moins 4 chiffres")
    .max(6, "Le code PIN ne peut pas dépasser 6 chiffres")
    .regex(/^\d+$/, "Le code PIN doit contenir uniquement des chiffres"),
})

type UserFormValues = z.infer<typeof userSchema>

interface UserFormProps {
  user?: any
}

export default function UserForm({ user }: UserFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const defaultValues: Partial<UserFormValues> = {
    nom: user?.nom || "",
    prenom: user?.prenom || "",
    email: user?.email || "",
    role: user?.role || "utilisateur",
    actif: user?.actif !== undefined ? user.actif : true,
    code_pin: "",
  }

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues,
  })

  async function onSubmit(data: UserFormValues) {
    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString())
        }
      })

      let result

      if (user?.id) {
        result = await updateUser(user.id, formData)
      } else {
        result = await createUser(formData)
      }

      if (result.success) {
        router.push("/utilisateurs")
        router.refresh()
      } else {
        setError(result.error || "Une erreur est survenue")
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      setError("Une erreur est survenue lors de l'enregistrement")
      setIsSubmitting(false)
    }
  }

  // Générer un code PIN aléatoire
  const generateRandomPin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString()
    form.setValue("code_pin", pin)
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
          <FormField
            control={form.control}
            name="nom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input placeholder="Dupont" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prenom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom</FormLabel>
                <FormControl>
                  <Input placeholder="Jean" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="jean.dupont@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rôle</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="utilisateur">Utilisateur</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="code_pin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code PIN</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input type="text" inputMode="numeric" maxLength={6} placeholder="1234" {...field} />
                  </FormControl>
                  <Button type="button" variant="outline" onClick={generateRandomPin}>
                    Générer
                  </Button>
                </div>
                <FormDescription>
                  {user ? "Laissez vide pour conserver le code PIN actuel" : "Code PIN pour la connexion"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="actif"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Compte actif</FormLabel>
                  <FormDescription>
                    {field.value ? "L'utilisateur peut se connecter" : "L'utilisateur ne peut pas se connecter"}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.push("/utilisateurs")}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : user ? "Mettre à jour" : "Créer"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
