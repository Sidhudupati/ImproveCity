import { useAuthStore } from "@/stores/authStore"

export const useAuth = () => {
  const { ...auth } = useAuthStore()
  if (!auth.user) throw new Error("No authenticated user found")
  return {
    ...auth,
    user: auth.user,
  }
}
