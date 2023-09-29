import { signIn } from "next-auth/react";
import PageFooter from "@ui/pages/PageFooter";
import React from "react";
import Image from "next/image";
import { Button, Form, Input } from "antd";
import { useRouter } from "next/router";

export default function LoginPage() {

  const router = useRouter()
  const [ form ] = Form.useForm()

  async function handleFinish({ password }: { password: string | undefined }) {
    if (!password) {
      return form.resetFields()
    }

    await signIn(
       'credentials',
       { redirect: false },
       { password }
    )

    await router.push('/')
  }

  return (
     <div className={'w-full min-h-screen flex justify-center px-2 md:px-6 py-2'}>
       <div className={'w-full mx-auto max-w-3xl flex flex-col items-center gap-y-3.5'}>
         <header className={'flex items-center gap-x-2 text-3xl font-medium py-4'}>
           <Image
              src={'/logo.png'}
              alt={'WireAdmin'}
              width={40}
              height={40}
           />
           <h1> WireAdmin </h1>
         </header>
         <main className={'py-4'}>
           <Form
              form={form}
              onFinish={handleFinish}
              rootClassName={'bg-white rounded-lg shadow-sm'}
              className={'p-4 space-y-8'}
           >
             <div className={'flex items-center justify-center'}>
               <div className={'w-16 aspect-square flex items-center justify-center rounded-full bg-gray-200'}>
                 <i className={'fas fa-user text-primary text-2xl'} />
               </div>
             </div>
             <Form.Item name={'password'}>
               <Input placeholder={'Password...'} />
             </Form.Item>
             <Button block={true} onClick={form.submit}> Sign In </Button>
           </Form>
         </main>
         <PageFooter />
       </div>
     </div>
  );
}
