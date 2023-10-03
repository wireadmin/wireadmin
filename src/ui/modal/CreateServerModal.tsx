import React from "react";
import SmartModal, { SmartModalRef } from "@ui/modal/SmartModal";
import { Button, Form, Input, notification, Segmented } from "antd";
import { z } from "zod";
import { APIResponse } from "@lib/typings";
import useSWRMutation from "swr/mutation";
import { isPrivateIP } from "@lib/utils";
import { AddressSchema, DnsSchema, MtuSchema, NameSchema, PortSchema, TypeSchema } from "@lib/schemas/WireGuard";
import { zodErrorMessage } from "@lib/zod";
import TorOnion from "@ui/icons/TorOnionIcon";

type CreateServerModalProps = {
  refreshTrigger: () => void
}

const CreateServerModal = React.forwardRef<
   SmartModalRef,
   CreateServerModalProps
>((props, ref) => {


  const [ notificationApi, contextHolder ] = notification.useNotification()

  const innerRef = React.useRef<SmartModalRef | null>(null)
  const [ form ] = Form.useForm()

  const [ type, setType ] = React.useState<ServerType>('direct')

  React.useImperativeHandle(ref, () => innerRef.current as SmartModalRef)

  React.useEffect(() => {
    form?.resetFields()
  }, [])

  const { isMutating, trigger } = useSWRMutation(
     '/api/wireguard/createServer',
     async (url: string, { arg }: { arg: FormValues }) => {
       const resp = await fetch(url, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json'
         },
         body: JSON.stringify(arg)
       })
       const data = await resp.json() as APIResponse<any>
       if (!data.ok) throw new Error('Server responded with error status')
       props.refreshTrigger()
       return data.result
     },
     {
       onSuccess: () => {
         notificationApi.success({
           message: 'Success',
           description: 'Server has been created!'
         })
         innerRef.current?.close()
         form?.resetFields()
       },
       onError: () => {
         notificationApi.error({
           message: 'Error',
           description: 'Failed to create server'
         })
       }
     }
  )

  const onFinish = (values: Record<string, string | undefined>) => {
    if (isMutating) return
    const data = { ...values, type }
    const parsed = FormSchema.safeParse(data)
    if (!parsed.success) {
      console.error(zodErrorMessage(parsed.error))
      return;
    }
    trigger(data as FormValues)
  }

  return (
     <SmartModal
        ref={innerRef}
        title={null}
        footer={null}
        rootClassName={'w-full max-w-[340px]'}
     >
       {contextHolder}
       <h4 className={'mb-6'}> Create Server </h4>
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
           <Input placeholder={'Kitty World'} />
         </Form.Item>

         <Form.Item name={'address'} label={'Address'} rules={[
           {
             required: true,
             message: 'Address is required'
           },
           {
             validator: (_, value) => {
               if (value && !isPrivateIP(value)) {
                 return Promise.reject('Address must be a private IP address')
               }
               return Promise.resolve()
             }
           }
         ]}>
           <Input placeholder={'10.0.0.1'} />
         </Form.Item>

         <Form.Item name={'port'} label={'Port'} rules={[
           {
             required: true,
             message: 'Port is required'
           },
           {
             validator: (_, value) => {
               const port = parseInt(value || '')
               if (port > 0 && port < 65535) {
                 return Promise.resolve()
               }
               return Promise.reject('Port must be a valid port number')
             }
           }
         ]}>
           <Input placeholder={'51820'} />
         </Form.Item>

         <Form.Item label={'Server Mode'}>
           <Segmented
              className={'select-none'}
              defaultValue={type}
              onChange={(v) => setType(v as any)}
              options={[
                { label: 'Direct', value: 'direct', icon: <i className={'fal fa-arrows-left-right-to-line'} /> },
                { label: 'Tor', value: 'tor', icon: <TorOnion width={18} height={18} /> }
              ]}
           />
         </Form.Item>

         <Form.Item name={'dns'} label={'DNS'} rules={[
           {
             validator: (_, value) => {
               if (!value) return Promise.resolve()
               const res = DnsSchema.safeParse(value)
               if (res.success) return Promise.resolve()
               return Promise.reject(zodErrorMessage(res.error)[0])
             }
           }
         ]}>
           <Input placeholder={'dns.google'} />
         </Form.Item>

         <Form.Item name={'mtu'} label={'MTU'} rules={[
           {
             validator: (_, value) => {
               if (!value) return Promise.resolve()
               const res = MtuSchema.safeParse(value)
               if (res.success) return Promise.resolve()
               return Promise.reject(zodErrorMessage(res.error)[0])
             }
           }
         ]}>
           <Input placeholder={'1420'} />
         </Form.Item>

         <Button
            type={'primary'}
            htmlType={'submit'}
            className={'w-full'}
            loading={isMutating}
         >
           Create
         </Button>

       </Form>
     </SmartModal>
  )
})

export default CreateServerModal

const FormSchema = z.object({
  name: NameSchema,
  address: AddressSchema,
  port: PortSchema,
  type: TypeSchema,
  dns: DnsSchema,
  mtu: MtuSchema
})

type ServerType = z.infer<typeof TypeSchema>

type FormValues = z.infer<typeof FormSchema>
