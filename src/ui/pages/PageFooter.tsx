import Link from "next/link";
import { ReactHTMLProps } from "@lib/typings";

export type PageFooterProps = {}

export default function PageFooter(props: PageFooterProps) {
  return (
     <footer className={'flex items-center justify-center'}>
       <Link
          href={'https://github.com/shahradelahi'}
          title={'Find me on Github'}
          className={'px-2 font-medium text-gray-400/80 hover:text-gray-500 text-xs'}
       >
         Made by <span className={'font-medium'}> Shahrad Elahi </span>
       </Link>
       <DotDivider className={'font-bold text-gray-400'} />
       <Link
          href={'https://github.com/shahradelahi/wireadmin'}
          title={'Github'}
          className={'px-2 font-medium text-gray-400/80 hover:text-gray-500 text-xs'}
       >
         Github
       </Link>
     </footer>
  )
}

function DotDivider(props: ReactHTMLProps<HTMLSpanElement>) {
  return <span {...props}> · </span>
}
