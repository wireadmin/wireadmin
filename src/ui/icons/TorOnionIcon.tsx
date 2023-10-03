import Image, { ImageProps } from "next/image";
import { twMerge } from "tailwind-merge";
import React from "react";

export default function TorOnion(props: Omit<ImageProps, 'src' | 'alt'>) {
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
