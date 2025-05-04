// This is a simplified authentication system until NextAuth is properly set up

// Admin credentials
const ADMIN_EMAIL = "lwendel003@gmail.com"
const ADMIN_PASSWORD = "@wendelAdmin2003"

// Simple authentication function
export async function authenticateUser(email: string, password: string) {
  // Check if it's the admin user
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    return {
      id: "admin",
      email: ADMIN_EMAIL,
      name: "Admin",
      role: "admin",
    }
  }

  // For a real app, we would check the database here
  // For now, just return null for non-admin users
  return null
}

// Simple session management using localStorage (client-side only)
export const simpleAuthUtils = {
  // Store user in localStorage
  setUser: (user: any) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user))
    }
  },

  // Get user from localStorage
  getUser: () => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user")
      if (userStr) {
        try {
          return JSON.parse(userStr)
        } catch (e) {
          return null
        }
      }
    }
    return null
  },

  // Clear user from localStorage
  clearUser: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user")
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!simpleAuthUtils.getUser()
  },
}
