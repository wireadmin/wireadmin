import React from "react";
import { ReactHTMLProps } from "@lib/typings";
import { message } from "antd";
import { twMerge } from "tailwind-merge";

export interface CopiableWrapperProps extends Omit<ReactHTMLProps<HTMLSpanElement>, 'content'> {
  rootClassName?: string
  content: string | number
  showInHover?: boolean
}

export default function CopiableWrapper(props: CopiableWrapperProps) {
  const {
    content,
    children,
    rootClassName,
    className,
    showInHover = false,
    ...rest
  } = props
  const [ messageApi, contextHolder ] = message.useMessage()
  return (
     <div className={twMerge('group flex items-center', rootClassName)}>
       {contextHolder}
       {children}
       <i {...rest}
          className={twMerge(
             'ml-2 mb-0.5 far fa-copy cursor-pointer text-gray-400/80 hover:text-primary',
             showInHover && 'group-hover:opacity-100 opacity-0',
             className
          )}
          onClick={() => {
            navigator.clipboard.writeText(content.toString())
               .then(() => messageApi.success('Copied!'))
               .catch()
          }}
       />
     </div>
  )
}
