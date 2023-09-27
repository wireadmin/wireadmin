import { Button, Card, List } from "antd";
import BasePage from "@ui/pages/BasePage";
import PageRouter from "@ui/pages/PageRouter";
import React from "react";
import { PlusOutlined } from "@ant-design/icons";
import useSWR from "swr";
import { APIResponse, WgServer } from "@lib/typings";
import useSWRMutation from "swr/mutation";
import { useRouter } from "next/router";
import { MiddleEllipsis } from "@ui/MiddleEllipsis";
import StatusBadge from "@ui/StatusBadge";
import { SmartModalRef } from "@ui/Modal/SmartModal";
import CreateClientModal from "@ui/Modal/CreateClientModal";
import { twMerge } from "tailwind-merge";
import QRCodeModal from "@ui/Modal/QRCodeModal";
import { getPeerConf } from "@lib/wireguard-utils";


export async function getServerSideProps(context: any) {
  return {
    props: {
      serverId: context.params.serverId
    }
  }
}

type PageProps = {
  serverId: string
}

export default function ServerPage(props: PageProps) {

  const router = useRouter()

  const createClientRef = React.useRef<SmartModalRef | null>(null)

  const { data, error, isLoading, mutate: refresh } = useSWR(
     `/api/wireguard/${props.serverId}`,
     async (url: string) => {
       const resp = await fetch(url, {
         method: 'GET',
         headers: {
           'Content-Type': 'application/json'
         }
       })
       if (resp.status === 404) {
         router.replace('/').catch()
         return false
       }
       const data = await resp.json() as APIResponse<any>
       if (!data.ok) throw new Error('Server responded with error status')
       return data.result
     }
  )

  const { isMutating: isChangingStatus, trigger: changeStatus } = useSWRMutation(
     `/api/wireguard/${props.serverId}`,
     async (url: string, { arg }: {
       arg: string
     }) => {
       const resp = await fetch(url, {
         method: arg === 'remove' ? 'DELETE' : 'PUT',
         headers: {
           'Content-Type': 'application/json'
         },
         body: arg === 'remove' ? undefined : JSON.stringify({
           status: arg
         })
       })
       if (resp.status === 404) {
         router.replace('/').catch()
         return false
       }
       const data = await resp.json() as APIResponse<any>
       if (!data.ok) throw new Error('Server responded with error status')
       return true
     },
     {
       onSuccess: async () => await refresh(),
       onError: async () => await refresh(),
     }
  )

  const lastChangeStatus = React.useRef<string | null>(null)

  return (
     <BasePage>
       <CreateClientModal
          ref={createClientRef}
          serverId={props.serverId}
          refreshTrigger={() => refresh()}
       />
       <PageRouter
          route={[
            { title: data ? data.name.toString() : 'LOADING...' }
          ]}
       />
       {error ? (
          <Card className={'flex items-center justify-center p-4'}>
            ! ERROR !
          </Card>
       ) : isLoading ? (
          <Card className={'flex items-center justify-center p-4'}>
            Loading...
          </Card>
       ) : (
          <div className={'space-y-4'}>
            <Card className={'[&>.ant-card-body]:max-md:p1-2'}>
              <List>
                <Row label={'IP address'}>
                  <pre> {data.address}/24 </pre>
                </Row>
                <Row label={'Status'}>
                  <StatusBadge status={data.status} />
                </Row>
                <Row label={'Public Key'}>
                  <MiddleEllipsis
                     content={data.publicKey}
                     maxLength={16}
                  />
                </Row>
              </List>
              <div className={'flex flex-wrap items-center gap-2 mt-6'}>
                {data.status === 'up' ? (
                   <React.Fragment>
                     <Button
                        className={'max-md:col-span-12'}
                        loading={isChangingStatus && lastChangeStatus.current === 'restart'}
                        disabled={isChangingStatus}
                        onClick={() => changeStatus('restart')}
                     > Restart </Button>
                     <Button
                        danger={true}
                        className={'max-md:col-span-12'}
                        loading={isChangingStatus && lastChangeStatus.current === 'stop'}
                        disabled={isChangingStatus}
                        onClick={() => changeStatus('stop')}
                     > Stop </Button>
                   </React.Fragment>
                ) : (
                   <React.Fragment>
                     <Button
                        type={'primary'}
                        className={'max-md:col-span-12 bg-green-500'}
                        loading={isChangingStatus && lastChangeStatus.current === 'start'}
                        disabled={isChangingStatus}
                        onClick={() => changeStatus('start')}
                     > Start </Button>
                     <Button
                        danger={true}
                        className={'max-md:col-span-12'}
                        loading={isChangingStatus && lastChangeStatus.current === 'remove'}
                        disabled={isChangingStatus}
                        onClick={() => {
                          changeStatus('remove').finally(() => {
                            lastChangeStatus.current = null
                            router.replace('/').catch()
                          })
                        }}
                     > Remove </Button>
                   </React.Fragment>
                )}
              </div>
            </Card>

            <Card
               className={'[&>.ant-card-body]:p-0'}
               title={(
                  <div className={'flex items-center justify-between'}>
                    <span> Clients </span>

                    {data && data.peers.length > 0 && (
                       <div>
                         <Button
                            type={'primary'}
                            icon={<PlusOutlined />}
                            onClick={() => createClientRef.current?.open()}
                         >
                           Add a client
                         </Button>
                       </div>
                    )}
                  </div>
               )}
            >
              {data && data.peers.length > 0 ? (
                 <List>
                   {data.peers.map((s) => (
                      <Client
                         key={s.id}
                         {...s}
                         serverId={props.serverId}
                         serverPublicKey={data?.publicKey}
                         dns={data?.dns}
                         listenPort={data?.listen}
                         refreshTrigger={() => refresh()}
                      />
                   ))}
                 </List>
              ) : (
                 <div className={'flex flex-col items-center justify-center gap-y-4 py-8'}>
                   <p className={'text-gray-400 text-md'}>
                     There are no clients yet!
                   </p>
                   <Button type={'primary'} icon={<PlusOutlined />} onClick={() => createClientRef.current?.open()}>
                     Add a client
                   </Button>
                 </div>
              )}
            </Card>
          </div>
       )}
     </BasePage>
  );
}

type Peer = WgServer['peers'][0]

interface ClientProps extends Peer, Pick<WgServer, 'dns'> {
  serverId: string
  serverPublicKey: string
  listenPort: number
  refreshTrigger: () => void
}

function Client(props: ClientProps) {

  const qrcodeRef = React.useRef<SmartModalRef | null>(null)

  const [ conf, setConf ] = React.useState<string | null>(null)

  React.useEffect(() => {
    getPeerConf({
      ...props,
      serverPublicKey: props.serverPublicKey,
      port: props.listenPort,
      dns: props.dns,
    })
       .then((s) => setConf(s))

    console.log('conf', conf)
  }, [ props ])

  const { isMutating: removingClient, trigger: removeClient } = useSWRMutation(
     `/api/wireguard/${props.serverId}/${props.id}`,
     async (url: string,) => {
       const resp = await fetch(url, {
         method: 'DELETE',
         headers: { 'Content-Type': 'application/json' }
       })
       const data = await resp.json() as APIResponse<any>
       if (!data.ok) throw new Error('Server responded with error status')
       return true
     },
     {
       onSuccess: () => props.refreshTrigger(),
       onError: () => props.refreshTrigger()
     }
  )

  return (
     <List.Item key={props.id} className={'flex items-center justify-between p-4'}>
       <QRCodeModal ref={qrcodeRef} content={conf?.trim() || 'null'} />
       <div className={'w-full flex flex-row items-center gap-x-2'}>
         <div className={'w-12 aspect-square flex items-center justify-center mr-4 rounded-full bg-gray-200'}>
           {/* User Icon */}
           <i className={'fas fa-user text-gray-400 text-lg'} />
         </div>
         <div className={'col-span-12 md:col-span-4'}>
           <div className={'col-span-12 md:col-span-4'}>
             <span className={'inline-block font-medium'}> {props.name} </span>
           </div>
           <div className={'col-span-12 md:col-span-4'}>
             <span className={'font-mono text-gray-400 text-xs'}> {props.allowedIps} </span>
           </div>
         </div>
       </div>
       <div className={'flex items-center justify-center gap-x-3'}>
         {/* QRCode */}
         <ClientBaseButton disabled={removingClient} onClick={() => {
           qrcodeRef.current?.open()
         }}>
           <i className={'fal text-neutral-700 group-hover:text-primary fa-qrcode'} />
         </ClientBaseButton>

         {/* Download */}
         <ClientBaseButton disabled={removingClient} onClick={() => {
           if (!conf) {
             console.error('conf is null')
             return
           }
           console.log('conf', conf)
           // create a blob
           const blob = new Blob([ conf ], { type: 'text/plain' })
           // create a link
           const link = document.createElement('a')
           link.href = window.URL.createObjectURL(blob)
           link.download = `${props.name}.conf`
           // click the link
           link.click()
           // remove the link
           link.remove()
         }}>
           <i className={'fal text-neutral-700 group-hover:text-primary fa-download'} />
         </ClientBaseButton>

         {/* Remove */}
         <ClientBaseButton loading={removingClient} onClick={() => removeClient()}>
           <i className={'fal text-neutral-700 group-hover:text-primary text-lg fa-trash-can'} />
         </ClientBaseButton>
       </div>
     </List.Item>
  )
}

function ClientBaseButton(props: {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
     <div
        className={twMerge(
           'group flex items-center justify-center w-10 aspect-square rounded-md',
           'bg-gray-200/80 hover:bg-gray-100/50',
           'border border-transparent hover:border-primary',
           'transition-colors duration-200 ease-in-out',
           'cursor-pointer',
           props.disabled && 'opacity-50 cursor-not-allowed',
           props.loading && 'animate-pulse'
        )}
        onClick={props.onClick}
     >
       {props.children}
     </div>
  )
}

function Row(props: {
  label: string
  children: React.ReactNode
}) {
  return (
     <List.Item className={'flex flex-wrap items-center gap-2 leading-none relative overflow-ellipsis'}>
       <div className={'flex items-center text-gray-400 text-sm col-span-12 md:col-span-3'}>
         {props.label}
       </div>
       <div className={'flex items-center gap-x-2 col-span-12 md:col-span-9'}>
         {props.children}
       </div>
     </List.Item>
  )
}

