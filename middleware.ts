import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Définir les chemins publics (accessibles sans authentification)
  const publicPaths = ["/login"]
  const isPublicPath = publicPaths.some((publicPath) => path.startsWith(publicPath))

  // Récupérer le cookie de session
  const sessionCookie = request.cookies.get("session")?.value

  // Si l'utilisateur n'est pas connecté et essaie d'accéder à une route protégée
  if (!sessionCookie && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Si l'utilisateur est connecté et essaie d'accéder à une route publique (comme login)
  if (sessionCookie && isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Vérifier les restrictions pour le rôle caissier
  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie)

      // Si l'utilisateur est un caissier, restreindre l'accès à certaines routes
      if (session.userRole === "caissier") {
        // Routes autorisées pour les caissiers
        const allowedPaths = [
          "/", // Dashboard
          "/pos", // Point de vente
          "/produits", // Liste des produits (lecture seule)
          "/profil", // Profil utilisateur
          "/login", // Login
        ]

        // Vérifier si le chemin actuel est autorisé
        const isAllowed = allowedPaths.some((allowedPath) => path === allowedPath || path.startsWith("/api/"))

        // Bloquer l'accès aux routes non autorisées pour les caissiers
        if (!isAllowed) {
          // Rediriger vers la page d'accueil
          return NextResponse.redirect(new URL("/", request.url))
        }

        // Bloquer l'accès aux pages d'ajout/modification pour les caissiers
        if (path.includes("/ajouter") || path.includes("/modifier")) {
          return NextResponse.redirect(new URL("/", request.url))
        }
      }
    } catch (error) {
      // En cas d'erreur de parsing du cookie, supprimer le cookie et rediriger vers login
      request.cookies.delete("session")
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return NextResponse.next()
}

// Configurer les chemins sur lesquels le middleware doit s'exécuter
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
