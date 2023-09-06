import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "antd";
import BasePage from "@/components/BasePage";

export default function Home() {
  const { data: session } = useSession();

  async function handleSignIn() {
    const result = await signIn('credentials', { redirect: false }, {
      password: 'super-secret-password'
    })
    console.log(result)
  }

  return (
     <BasePage>
       {session ?
          (
             <BasePage>
               Signed in <br />
               <Button onClick={() => signOut}>Sign out</Button>
             </BasePage>
          ) :
          (
             <Button onClick={handleSignIn}>Sign in</Button>
          )
       }
     </BasePage>
  );
}
