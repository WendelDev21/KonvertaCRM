import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname

  // Public paths that don't require authentication
  const publicPaths = ["/", "/login", "/register"]
  const isPublicPath = publicPaths.some((pp) => path === pp || path.startsWith(`${pp}/`))

  // Check if the user is authenticated
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Redirect unauthenticated users to login
  if (!token && !isPublicPath) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", encodeURI(request.url))
    return NextResponse.redirect(url)
  }

  // Check if user is inactive
  if (token && !isPublicPath && token.isActive === false) {
    // Log the user out and redirect to login with error message
    const response = NextResponse.redirect(new URL("/login?error=AccountDisabled", request.url))

    // Clear the auth cookie to log the user out
    response.cookies.delete("next-auth.session-token")
    response.cookies.delete("__Secure-next-auth.session-token")

    return response
  }

  // Redirect authenticated users away from login/register pages
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

// Specify which routes should be processed by this middleware
export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/dashboard/:path*",
    "/contacts/:path*",
    "/kanban/:path*",
    "/settings/:path*",
    "/integrations/:path*",
  ],
}
