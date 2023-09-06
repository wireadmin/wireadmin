import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import "dotenv/config";

export default NextAuth({
  providers: [
    // Credentials-based authentication providers
    // get user and password from .env.local
    // https://next-auth.js.org/configuration/providers#credentials-based-authentication-providers
    CredentialsProvider({
      async authorize(credentials, request) {
        const { HASHED_PASSWORD } = process.env
        if (!HASHED_PASSWORD) {
          return {

          }
        }
        const { password } = request.query || {}
        if (!password ) {
          return null
        }
      },
      name: 'Credentials',
      credentials: {},
    }),

  ]
});

function createSession() {

}

