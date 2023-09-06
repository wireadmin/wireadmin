import React from "react";
import { Layout } from "antd";
import { twMerge } from "tailwind-merge";

const { Header, Footer, Content } = Layout;

export type BasePageProps = {
  rootClassName: string
  className: string
  children: React.ReactNode
}

export default function BasePage(props: BasePageProps): React.ReactElement {
  return (
     <Layout className={'w-full min-h-screen'}>
       <Header>Header</Header>
       <Content
          className={twMerge(
             'w-full max-w-full md:max-w-[700px] lg:max-w-[1140px] xl:max-w-[1300px] 2xl:max-w-[1400px]',
             'space-y-3.5',
             props.className
          )}>
         {props.children}
       </Content>
       <Footer>Footer</Footer>
     </Layout>
  )
}
