import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import "dotenv/config";

export default NextAuth({
  providers: [
    // Credentials-based authentication providers
    // get user and password from .env.local
    // https://next-auth.js.org/configuration/providers#credentials-based-authentication-providers
    CredentialsProvider({
      name: 'Credentials',
      credentials: {},
      async authorize(_, request) {
        const { HASHED_PASSWORD } = process.env
        if (!HASHED_PASSWORD) {
          return { id: crypto.randomUUID() }
        }
        const { password } = request.query || {}
        if (!password) {
          return null
        }
        return null
      }
    }),

  ]
});

function createSession() {

}

