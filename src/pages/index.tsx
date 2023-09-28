import React from "react";
import { Button, Card, List } from "antd";
import BasePage from "@ui/pages/BasePage";
import { APIResponse, WgServer } from "@lib/typings";
import { PlusOutlined } from "@ant-design/icons";
import Image, { ImageProps } from "next/image";
import Link from "next/link";
import PageRouter from "@ui/pages/PageRouter";
import useSWR from "swr";
import { SmartModalRef } from "@ui/Modal/SmartModal";
import { twMerge } from "tailwind-merge";
import CreateServerModal from "@ui/Modal/CreateServerModal";
import StatusBadge from "@ui/StatusBadge";
import EditableText from "@ui/EditableText";
import useSWRMutation from "swr/mutation";
import { UPDATE_SERVER } from "@lib/swr-fetch";
import { RLS_NAME_INPUT } from "@lib/form-rules";
import CopiableWrapper from "@ui/CopiableWrapper";

export default function Home() {
  const { data, error, isLoading, mutate } = useSWR(
     '/api/wireguard/listServers',
     async (url: string) => {
       const resp = await fetch(url, {
         method: 'GET',
         headers: { 'Content-Type': 'application/json' }
       })
       const data = await resp.json() as APIResponse<WgServer[]>
       if (!data.ok) throw new Error('Server responded with error status')
       return data.result
     }
  )
  const createServerRef = React.useRef<SmartModalRef | null>(null)
  return (
     <BasePage>
       <PageRouter className={'flex items-center justify-between'}>
         <h2 className={'font-bold text-xl'}> Hello there 👋 </h2>
         {data && data.length > 0 && (
            <Button type={'default'} icon={<PlusOutlined />} onClick={() => createServerRef.current?.open()}>
              New server
            </Button>
         )}
       </PageRouter>
       <CreateServerModal ref={createServerRef} refreshTrigger={() => mutate()} />
       <div className={'space-y-4'}>
         {error ? (
            <Card className={'flex items-center justify-center p-4'}>
              ! ERROR !
            </Card>
         ) : isLoading ? (
            <Card className={'flex items-center justify-center p-4'}>
              Loading...
            </Card>
         ) : Array.isArray(data) && data.length > 0 ? (
            <Card
               className={'[&>.ant-card-body]:p-0'}
               title={<span> Servers </span>}
            >
              <List>
                {data.map((s) => (
                   <ServerListItem
                      {...s}
                      key={s.id}
                      refreshTrigger={() => mutate()}
                   />
                ))}
              </List>
            </Card>
         ) : (
            <Card>
              <div className={'flex flex-col items-center justify-center gap-y-4 py-8'}>
                <p className={'text-gray-400 text-md'}>
                  There are no servers yet!
                </p>
                <Button type={'primary'} icon={<PlusOutlined />} onClick={() => createServerRef.current?.open()}>
                  Add a server
                </Button>
              </div>
            </Card>
         )}
       </div>
     </BasePage>
  );
}

interface ServerListItemProps extends WgServer {
  refreshTrigger: () => void
}

function ServerListItem(props: ServerListItemProps) {

  const { isMutating, trigger } = useSWRMutation(
     `/api/wireguard/${props.id}`,
     UPDATE_SERVER,
     {
       onSuccess: () => props.refreshTrigger(),
       onError: () => props.refreshTrigger(),
     }
  )

  return (
     <List.Item className={'flex items-center justify-between p-4'}>
       <div className={'w-full grid grid-cols-8 md:grid-cols-12 items-center gap-x-1'}>
         <ServerIcon type={props.type} className={'max-md:hidden md:col-span-1'} />
         <div className={'flex flex-col justify-between col-span-4'}>
           <EditableText
              disabled={isMutating}
              rules={RLS_NAME_INPUT}
              rootClassName={'font-medium'}
              inputClassName={'w-full max-w-[120px]'}
              content={props.name}
              onChange={(v) => trigger({ name: v })}
           />
           <CopiableWrapper
              content={`${props.address}:${props.listen}`}
              className={'text-sm'}
              rootClassName={'mt-0.5'}
              showInHover={true}
           >
             <span className={'font-mono text-gray-400 text-xs'}> {props.address}:{props.listen} </span>
           </CopiableWrapper>
         </div>
         <div className={'col-span-4 justify-end'}>
           <StatusBadge status={props.status} />
         </div>
       </div>
       <Link href={`/${props.id}`}>
         <Button type={'primary'}>
           Manage
         </Button>
       </Link>
     </List.Item>
  )
}

type ServerIconProps = {
  type: WgServer['type']
  className?: string
}

function ServerIcon(props: ServerIconProps) {
  return (
     <div className={twMerge('flex items-start', props.className)}>
       <div className={'w-fit h-full relative'}>
         <Image
            src={'/vps.29373866.svg'}
            alt={'VPS'}
            width={40}
            height={40}
         />
         {props.type !== 'direct' && (
            <div className={'absolute -bottom-1 -right-2 rounded-full bg-white'}>
              {props.type === 'tor' && (
                 <Image
                    src={'/tor-onion.svg'}
                    alt={'Tor'}
                    width={20}
                    height={20}
                 />
              )}
            </div>
         )}
       </div>
     </div>
  )
}

export function TorOnion(props: Omit<ImageProps, 'src' | 'alt'>) {
  return (
     <Image
        width={20}
        height={20}
        {...props}
        alt={'Tor'}
        className={twMerge('inline-block', props.className)}
        src={'/tor-onion.svg'}
     />
  )
}
