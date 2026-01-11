"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { CheckCircle2, Loader2, Eye, EyeOff, Trash2, Settings } from "lucide-react"

interface CredentialsInfo {
  configured: boolean
  username?: string
  updatedAt?: string
}

export default function ColissimoSettingsPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingInfo, setLoadingInfo] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [credentialsInfo, setCredentialsInfo] = useState<CredentialsInfo | null>(null)

  // Load credentials info on mount
  useEffect(() => {
    fetchCredentialsInfo()
  }, [])

  const fetchCredentialsInfo = async () => {
    setLoadingInfo(true)
    try {
      const response = await fetch("/api/colissimo-api/credentials")
      const data = await response.json()
      setCredentialsInfo(data)
      if (data.configured && data.username) {
        setUsername(data.username)
      }
    } catch (err) {
      console.error("Failed to fetch credentials info:", err)
    } finally {
      setLoadingInfo(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const response = await fetch("/api/colissimo-api/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save credentials")
      }

      setSuccess("Credentials saved and validated successfully!")
      setPassword("") // Clear password after success
      await fetchCredentialsInfo()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const response = await fetch("/api/colissimo-api/credentials", {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete credentials")
      }

      setSuccess("Credentials deleted successfully!")
      setUsername("")
      setPassword("")
      setCredentialsInfo({ configured: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("fr-TN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Paramètres Colissimo API</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Identifiants API</CardTitle>
          <CardDescription>
            Configurez vos identifiants Colissimo Tunisia pour accéder à l&apos;API.
            Les credentials sont chiffrés (AES-256) avant d&apos;être stockés.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingInfo ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              {/* Status indicator */}
              {credentialsInfo?.configured && (
                <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    API configurée pour <strong>{credentialsInfo.username}</strong>
                    <br />
                    <span className="text-sm text-muted-foreground">
                      Dernière mise à jour: {credentialsInfo.updatedAt && formatDate(credentialsInfo.updatedAt)}
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Nom d&apos;utilisateur</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Votre identifiant Colissimo"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={credentialsInfo?.configured ? "Nouveau mot de passe" : "Votre mot de passe"}
                      required={!credentialsInfo?.configured}
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {credentialsInfo?.configured && (
                    <p className="text-xs text-muted-foreground">
                      Laissez vide pour conserver le mot de passe actuel
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validation en cours...
                      </>
                    ) : credentialsInfo?.configured ? (
                      "Mettre à jour"
                    ) : (
                      "Enregistrer"
                    )}
                  </Button>

                  {credentialsInfo?.configured && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive" disabled={loading}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer les identifiants ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action supprimera vos identifiants Colissimo.
                            Vous devrez les reconfigurer pour accéder à l&apos;API.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete}>
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </form>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Information</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Cette intégration est en <strong>lecture seule</strong> - vous pouvez
            consulter vos colis mais pas créer ou modifier des envois.
          </p>
          <p>
            Les identifiants sont validés auprès de l&apos;API Colissimo avant
            d&apos;être enregistrés.
          </p>
          <p>
            En cas de problème de connexion, vérifiez vos identifiants sur
            le portail Colissimo Tunisia.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
