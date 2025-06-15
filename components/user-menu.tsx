"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings, UserPlus } from "lucide-react"
import { logout } from "@/app/auth/actions"

interface UserMenuProps {
  userName: string
  userRole: string
}

export default function UserMenu({ userName, userRole }: UserMenuProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
      setIsLoggingOut(false)
    }
  }

  const roleLower = userRole?.toLowerCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <User className="h-4 w-4" />
          <span className="sr-only">Menu utilisateur</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{userName}</span>
            <span className="text-xs text-muted-foreground">
              {roleLower === "admin" ? "Administrateur" : "Utilisateur"}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {roleLower === "admin" && (
          <DropdownMenuItem asChild>
            <Link href="/utilisateurs">
              <UserPlus className="mr-2 h-4 w-4" />
              Gérer les utilisateurs
            </Link>
          </DropdownMenuItem>
        )}
<DropdownMenuItem asChild>
  <Link href="/profile">
    <Settings className="mr-2 h-4 w-4" />
    Paramètres du compte
  </Link>
</DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
          <LogOut className="mr-2 h-4 w-4" />
          {isLoggingOut ? "Déconnexion..." : "Déconnexion"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
