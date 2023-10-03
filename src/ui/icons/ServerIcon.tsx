import { WgServer } from "@lib/typings";
import { twMerge } from "tailwind-merge";
import Image from "next/image";
import React from "react";

export interface ServerIconProps {
  type: WgServer['type']
  className?: string
}

export default function ServerIcon(props: ServerIconProps) {
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
