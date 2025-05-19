import "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    role: string
    bio?: string
    theme?: string
    image?: string
  }

  interface Session {
    user: User
  }
}
