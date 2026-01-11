"use client"
import { createContext, useContext, useState } from "react"

interface UserContextType {
  userId: number | null
  userRole: string
  userName: string
}

const UserContext = createContext<UserContextType>({
  userId: null,
  userRole: "utilisateur",
  userName: "",
})

export function UserProvider({
  children,
  initialRole = "utilisateur",
  userName = "",
  userId = null,
}: {
  children: React.ReactNode
  initialRole: string
  userName: string
  userId?: number | null
}) {
  const [role] = useState(initialRole.toLowerCase())
  const [name] = useState(userName)
  const [id] = useState(userId)

  return (
    <UserContext.Provider value={{ userId: id, userRole: role, userName: name }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
