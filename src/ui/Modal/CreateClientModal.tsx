import React from "react";
import SmartModal, { SmartModalRef } from "@ui/Modal/SmartModal";
import { Button, Form, Input, notification } from "antd";
import { z } from "zod";
import { APIResponse } from "@lib/typings";
import useSWRMutation from "swr/mutation";
import { AddressSchema, DnsSchema, MtuSchema, NameSchema, PortSchema, TypeSchema } from "@lib/schemas/WireGuard";
import { zodErrorMessage } from "@lib/zod";

const CreateClientModal = React.forwardRef<
   SmartModalRef,
   {}
>((_, ref) => {


  const [ notificationApi, contextHolder ] = notification.useNotification()

  const innerRef = React.useRef<SmartModalRef | null>(null)
  const [ form ] = Form.useForm()

  React.useImperativeHandle(ref, () => innerRef.current as SmartModalRef)

  React.useEffect(() => {
    form?.resetFields()
  }, [])

  const { isMutating, trigger } = useSWRMutation(
     '/api/wireguard/createClient',
     async (url: string, { arg }: { arg: FormValues }) => {
       const resp = await fetch(url, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json'
         },
         body: JSON.stringify(arg)
       })
       const data = await resp.json() as APIResponse<any>
       if (!data.ok) throw new Error('Client responded with error status')
       return data.result
     },
     {
       onSuccess: () => {
         notificationApi.success({
           message: 'Success',
           description: (
              <div>
                hi
              </div>
           )
         })
         innerRef.current?.close()
         form?.resetFields()
       },
       onError: () => {
         notificationApi.error({
           message: 'Error',
           description: 'Failed to create Client'
         })
       }
     }
  )

  const onFinish = (values: Record<string, string | undefined>) => {
    if (isMutating) return
    const parsed = FormSchema.safeParse(values)
    if (!parsed.success) {
      console.error(zodErrorMessage(parsed.error))
      return;
    }
    trigger(values as FormValues).catch()
  }

  return (
     <SmartModal
        ref={innerRef}
        title={null}
        footer={null}
        rootClassName={'w-full max-w-[340px]'}
     >
       {contextHolder}
       <h4 className={'mb-6'}> Create Client </h4>
       <Form form={form} onFinish={onFinish}>

         <Form.Item name={'name'} label={'Name'} rules={[
           {
             required: true,
             message: 'Name is required'
           },
           {
             validator: (_, value) => {
               if (!value) return Promise.resolve()
               const res = NameSchema.safeParse(value)
               if (res.success) return Promise.resolve()
               return Promise.reject(zodErrorMessage(res.error)[0])
             }
           }
         ]}>
           <Input placeholder={'Unicorn 🦄'} />
         </Form.Item>

         <Button type={'primary'} htmlType={'submit'} className={'w-full'}>
           Create
         </Button>

       </Form>
     </SmartModal>
  )
})

export default CreateClientModal

const FormSchema = z.object({
  name: NameSchema,
  address: AddressSchema,
  port: PortSchema,
  type: TypeSchema,
  dns: DnsSchema,
  mtu: MtuSchema
})

type FormValues = z.infer<typeof FormSchema>
