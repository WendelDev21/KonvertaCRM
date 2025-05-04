import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// Export a simplified handler that doesn't rely on dynamic configuration
// This helps prevent build-time errors when environment variables aren't available
export const GET = NextAuth(authOptions)
export const POST = NextAuth(authOptions)
