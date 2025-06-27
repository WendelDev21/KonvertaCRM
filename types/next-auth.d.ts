import "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    role: string
    plan?: string
    theme?: string
  }

  interface Session {
    user: User
  }
}
