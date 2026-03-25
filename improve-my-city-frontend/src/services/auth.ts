import { callApi } from "@/services/api"
import type { User } from "@/types/user"

export const getMyUser = async (): Promise<User> => {
    const userResponse = await callApi(`/users/me`)
    return userResponse as User
}