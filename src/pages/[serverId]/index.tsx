import { Button, Card } from "antd";
import BasePage from "@ui/pages/BasePage";
import PageRouter from "@ui/pages/PageRouter";
import React from "react";
import { PlusOutlined } from "@ant-design/icons";
import useSWR from "swr";
import { APIResponse } from "@lib/typings";


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
  const { data, error, isLoading } = useSWR(`/api/wireguard/${props.serverId}`, async (url: string) => {
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
  return (
     <BasePage>
       <PageRouter
          route={[
            { title: 'SERVER_ID' }
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
            <Card>
              <div className={'flex items-center gap-x-2'}>
                {data.status === 'up' ? (
                   <React.Fragment>
                     <Button> Restart </Button>
                     <Button> Stop </Button>
                   </React.Fragment>
                ) : (
                   <React.Fragment>
                     <Button type={'primary'} className={'bg-green-500'}> Start </Button>
                     <Button danger={true}> Remove </Button>
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
                <Button type={'primary'} icon={<PlusOutlined />}>
                  Add a client
                </Button>
              </div>
            </Card>
          </div>
       )}
     </BasePage>
  );
}
