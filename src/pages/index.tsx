import React from "react";
import { Badge, Button, Card, List, Segmented } from "antd";
import BasePage from "@ui/pages/BasePage";
import { APIResponse, WgServer } from "@lib/typings";
import { PlusOutlined } from "@ant-design/icons";
import Image, { ImageProps } from "next/image";
import Link from "next/link";
import PageRouter from "@ui/pages/PageRouter";
import useSWR from "swr";
import SmartModal, { SmartModalRef } from "@ui/SmartModal";
import { twMerge } from "tailwind-merge";

export default function Home() {
  const { data, error, isLoading } = useSWR('/api/wireguard/listServers', async (url: string) => {
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const data = await resp.json() as APIResponse<any>
    if (!data.ok) throw new Error('Server responded with error status')
    return data.result
  })
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
       <SmartModal
          ref={createServerRef}
          title={null}
          footer={null}
          rootClassName={'w-full max-w-[340px]'}
       >
         <div className={'flex items-center justify-center'}>
           <Segmented
              className={'select-none'}
              options={[
                { label: 'Direct', value: 'default', icon: <i className={'far fa-arrows-left-right-to-line'} /> },
                { label: 'Tor', value: 'tor', icon: <TorOnion /> }
              ]}
           />
         </div>
       </SmartModal>
       <div className={'space-y-4'}>
         {error ? (
            <Card className={'flex items-center justify-center p-4'}>
              ! ERROR !
            </Card>
         ) : isLoading ? (
            <Card className={'flex items-center justify-center p-4'}>
              Loading...
            </Card>
         ) : data.length > 0 ? (
            <Card
               className={'[&>.ant-card-body]:p-0'}
               title={<span> Servers </span>}
            >
              <List>
                {data.map((s) => <Server {...s} />)}
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

function Server(s: WgServer) {
  return (
     <List.Item className={'flex items-center justify-between p-4'}>
       <div className={'w-full grid grid-cols-12 items-center gap-x-2'}>
         <ServerIcon type={s.type} className={'col-span-1'} />
         <h3 className={'font-medium col-span-4'}> {s.name} </h3>
         <div className={'col-span-4 justify-end'}>
           <Badge
              size={'small'}
              color={s.status === 'up' ? 'rgb(82, 196, 26)' : 'rgb(255, 77, 79)'}
              text={s.status === 'up' ? 'Running' : 'Stopped'}
           />
         </div>
       </div>
       <Link href={`/${s.id}`}>
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
     <div className={props.className}>
       <div className={'w-fit relative'}>
         <Image
            src={'/vps.29373866.svg'}
            alt={'VPS'}
            width={34}
            height={34}
         />
         {props.type !== 'default' && (
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
