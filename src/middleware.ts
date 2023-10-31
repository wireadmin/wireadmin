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
// https://nextjs.org/docs/app/building-your-application/routing/middleware#matching-paths
export const config = {
  matcher: [
    '/((?!api/auth|api/healthcheck|_next/static|_next/image|login|logo.png|fonts|favicon.ico).*)',
  ],
}