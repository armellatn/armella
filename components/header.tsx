"use client"
import { UserPlus } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Bell, Menu, Search, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useMobile } from "@/hooks/use-mobile"
import { createCategory } from "@/app/categories/actions"
import { useRouter } from "next/navigation"
import UserMenu from "./user-menu"
import { ThemeToggle } from "./theme-toggle"

interface HeaderProps {
  userName?: string
  userRole?: string
}

export default function Header({ userName = "Utilisateur", userRole = "utilisateur" }: HeaderProps) {
  const isMobile = useMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [categoryName, setCategoryName] = useState("")
  const [categoryDescription, setCategoryDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("nom", categoryName)
      formData.append("description", categoryDescription)

      const result = await createCategory(formData)

      if (result.success) {
        setCategoryName("")
        setCategoryDescription("")
        setShowCategoryDialog(false)
        router.refresh()
      } else {
        alert(result.error || "Erreur lors de la création de la catégorie")
      }
    } catch (error) {
      console.error("Error creating category:", error)
      alert("Une erreur est survenue")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Vérifier si l'utilisateur est un caissier
const isCaissier = userRole?.toLowerCase() === "utilisateur"

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      {isMobile && (
        <Button
          variant="outline"
          size="icon"
          className="md:hidden h-10 w-10"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      )}
      <div className="w-full flex-1">
        <form className="hidden md:block">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher..."
              className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
            />
          </div>
        </form>
      </div>

      {/* N'afficher le bouton de nouvelle catégorie que pour les non-caissiers */}
      {!isCaissier && (
        <Button
          variant="outline"
          size="sm"
          className="hidden md:flex items-center gap-1 h-10"
          onClick={() => setShowCategoryDialog(true)}
        >
          <Tag className="h-4 w-4 mr-1" />
          Nouvelle catégorie
        </Button>
      )}

      <ThemeToggle />

      <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
        <Bell className="h-5 w-5" />
        <span className="sr-only">Notifications</span>
      </Button>

      <UserMenu userName={userName} userRole={userRole} />

      {/* Dialogue pour ajouter une catégorie */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une catégorie</DialogTitle>
            <DialogDescription>Créez une nouvelle catégorie pour vos produits</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom de la catégorie</Label>
              <Input
                id="name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Ex: Lentilles journalières"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                placeholder="Description de la catégorie"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)} className="h-10">
              Annuler
            </Button>
            <Button onClick={handleCreateCategory} disabled={isSubmitting || !categoryName.trim()} className="h-10">
              {isSubmitting ? "Création..." : "Créer la catégorie"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}
