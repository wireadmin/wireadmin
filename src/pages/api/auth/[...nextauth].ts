import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import "dotenv/config";

export default NextAuth({
  providers: [
    // Credentials-based authentication providers
    // https://next-auth.js.org/configuration/providers#credentials-based-authentication-providers
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        password: { label: "Password", type: "password" },
      },
      async authorize(_, request) {
        const { password } = request.query || {}
        const { HASHED_PASSWORD } = process.env
        if (
           // Skip if no password is set
           !HASHED_PASSWORD ||
           // Accept if password was matching
           password && Buffer.from(password).toString('hex').toLowerCase() === HASHED_PASSWORD.toLowerCase()
        ) {
          return { id: crypto.randomUUID() }
        }
        // Reject the rest
        return null
      }
    }),
  ],
  pages: {
    signIn: '/login'
  },
  session: {
    // Seconds - How long until an idle session expires and is no longer valid.
    maxAge: 24 * 60 * 60, // 24 hours
    // Seconds - Throttle how frequently to write to database to extend a session.
    // Use it to limit write operations. Set to 0 to always update the database.
    // Note: This option is ignored if using JSON Web Tokens
    updateAge: 60 * 60, // 1 hour
  }
});

