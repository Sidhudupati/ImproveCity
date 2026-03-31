'use client'
import React, { useCallback, useEffect } from "react"
import { useAuthStore } from "@/stores/authStore"
import { Preloader } from "@/components/Preloader"

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { login } = useAuthStore()
  const [isLoading, setIsLoading] = React.useState(true)

  const handleLogin = useCallback(async () => {
    try {
      await login()
    } catch (error) {
      console.error("Auto-login failed:", error)
    } finally {
      setIsLoading(false)
    }
  }, [login])

  useEffect(() => {
    handleLogin()
  }, [handleLogin])


  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Preloader />
    </div>
  )
  return <>
    {children}
  </>
}

export default AuthProvider
