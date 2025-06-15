"use client"
import { createContext, useContext, useState } from "react"

interface UserContextType {
  userRole: string
  userName: string
}

const UserContext = createContext<UserContextType>({
  userRole: "utilisateur",
  userName: "",
})

export function UserProvider({
  children,
  initialRole = "utilisateur",
  userName = "",
}: {
  children: React.ReactNode
  initialRole: string
  userName: string
}) {
  const [userRole] = useState(initialRole.toLowerCase())
  const [name] = useState(userName)

  return (
    <UserContext.Provider value={{ userRole, userName: name }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
