import { withAuth } from "next-auth/middleware";

// More on how NextAuth.js middleware works: https://next-auth.js.org/configuration/nextjs#middleware
export default withAuth({
  callbacks: {
    authorized({ token }) {
      return !!token
    },
  },
})

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/((?!api/auth|api/wireguard/healthcheck|api/ping|login|logo.png|fonts|_next/static|_next/image|favicon.ico).*)',
  ],
}