import { LeastOne, ReactHTMLProps } from "@lib/typings";
import React from "react";
import { twMerge } from "tailwind-merge";
import { Breadcrumb } from "antd";
import { HomeOutlined } from "@ant-design/icons";

export type PageRouterProps = ReactHTMLProps<HTMLDivElement> & LeastOne<{
  children: React.ReactNode
  route: RouteItem[]
}>

type RouteItem = {
  href?: string
  title: React.ReactNode
}

export default function PageRouter(props: PageRouterProps) {
  const { children, route, className, ...rest } = props
  return (
     <div {...rest} className={twMerge('py-3 px-2', className)}>
       {route && route.length > 0 && (
          <Breadcrumb items={[
            {
              href: '/',
              title: (
                 <>
                   <HomeOutlined />
                   <span>Home</span>
                 </>
              ),
            },
            ...route
          ]} />
       )}
       {children}
     </div>
  )
}
