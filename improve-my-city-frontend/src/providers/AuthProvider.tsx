'use client'
import React, { useEffect } from "react"
import { useAuthStore } from "@/stores/authStore"
import { useNavigate } from "react-router-dom"
import { Preloader } from "@/components/Preloader"

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { login } = useAuthStore()
  const [isLoading, setIsLoading] = React.useState(true)
  const navigate = useNavigate()

  const handleLogin = async () => {
    try {
      await login()
    } catch (error) {
      console.error("Auto-login failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    handleLogin()
  }, [navigate])


  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Preloader />
    </div>
  )
  return <>
    {children}
  </>
}

export const useAuth = () => {
  const { ...auth } = useAuthStore()
  if (!auth.user) throw new Error("No authenticated user found")
  return {
    ...auth,
    user: auth.user
  }
}

export default AuthProvider