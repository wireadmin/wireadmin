import React from "react";
import { twMerge } from "tailwind-merge";
import { ReactHTMLProps } from "@lib/typings";

export interface MiddleEllipsisProps extends ReactHTMLProps<HTMLSpanElement> {
  content: string
  maxLength: number
  rootClassName?: string
}

export function MiddleEllipsis(props: MiddleEllipsisProps) {

  const { content, maxLength, className, rootClassName, ...rest } = props

  const [ leftL, rightL ] = React.useMemo(() => {
    const left = Math.floor(maxLength / 2)
    const right = Math.ceil(maxLength / 2)
    return [ left, right ]
  }, [ maxLength ])

  const [ left, right ] = React.useMemo(() => {
    if (content?.length <= maxLength) return [ content, '' ]
    return [ content.slice(0, leftL), content.slice(content?.length - rightL) ]
  }, [ content, leftL, rightL ])

  return (
     <span {...rest} className={rootClassName}>
       {left}
       <span className={twMerge('text-gray-400', className)}> ... </span>
       {right}
     </span>
  )
}