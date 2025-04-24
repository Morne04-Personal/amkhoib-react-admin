import type { AuthProvider } from "react-admin"
import supabaseClient from "../supabaseClient"

const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    if (data?.user) {
      localStorage.setItem("user", JSON.stringify(data.user))
      return Promise.resolve()
    }

    return Promise.reject("Login failed")
  },
  logout: async () => {
    const { error } = await supabaseClient.auth.signOut()
    if (error) {
      throw error
    }
    localStorage.removeItem("user")
    return Promise.resolve()
  },
  checkError: ({ status }) => {
    if (status === 401 || status === 403) {
      localStorage.removeItem("user")
      return Promise.reject()
    }
    return Promise.resolve()
  },
  checkAuth: () => {
    const user = localStorage.getItem("user")
    return user ? Promise.resolve() : Promise.reject()
  },
  getPermissions: () => Promise.resolve(),
  getIdentity: async () => {
    const user = localStorage.getItem("user")
    if (user) {
      const parsedUser = JSON.parse(user)
      return Promise.resolve({
        id: parsedUser.id,
        fullName: parsedUser.user_metadata?.full_name || parsedUser.email,
        avatar: parsedUser.user_metadata?.avatar_url,
      })
    }
    return Promise.reject("User not found")
  },
}

export default authProvider

