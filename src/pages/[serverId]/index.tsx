import { Button, Card, List } from "antd";
import BasePage from "@ui/pages/BasePage";
import PageRouter from "@ui/pages/PageRouter";
import React from "react";
import { PlusOutlined } from "@ant-design/icons";
import useSWR from "swr";
import { APIResponse } from "@lib/typings";
import useSWRMutation from "swr/mutation";
import { useRouter } from "next/router";
import { MiddleEllipsis } from "@ui/MiddleEllipsis";
import StatusBadge from "@ui/StatusBadge";
import { SmartModalRef } from "@ui/Modal/SmartModal";
import CreateClientModal from "@ui/Modal/CreateClientModal";


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

  const { data, error, isLoading } = useSWR(
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
     async (url: string, { arg }: { arg: string }) => {
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
       onSuccess: () => {
       },
       onError: () => {
       }
     }
  )

  const lastChangeStatus = React.useRef<string | null>(null)

  return (
     <BasePage>
       <CreateClientModal ref={createClientRef} />
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
               title={<span> Clients </span>}
            >
              <div className={'flex flex-col items-center justify-center gap-y-4 py-8'}>
                <p className={'text-gray-400 text-md'}>
                  There are no clients yet!
                </p>
                <Button type={'primary'} icon={<PlusOutlined />} onClick={() => createClientRef.current?.open()}>
                  Add a client
                </Button>
              </div>
            </Card>
          </div>
       )}
     </BasePage>
  );
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
