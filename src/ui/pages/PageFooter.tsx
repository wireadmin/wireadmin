import Link from "next/link";
import { ReactHTMLProps } from "@lib/typings";

export type PageFooterProps = {}

export default function PageFooter(props: PageFooterProps) {
  return (
     <footer className={'flex items-center justify-center'}>
       <span className={'text-center m-10 text-gray-300 text-xs'}>
         Made by
       <Link
          href={'https://github.com/shahradelahi'}
          title={'Find me on Github'}
          className={'px-1 font-medium'}
       >
         Shahrad Elahi
       </Link>
       </span>
     </footer>
  )
}

function DotDivider(props: ReactHTMLProps<HTMLSpanElement>) {
  return <span {...props}> · </span>
}
