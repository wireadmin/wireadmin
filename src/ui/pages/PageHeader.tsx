import Image from "next/image";
import Link from "next/link";

export type PageHeaderProps = {}

export default function PageHeader(props: PageHeaderProps) {
  return (
     <header className={'w-full py-3 px-2'}>
       <nav className={'w-full flex items-center justify-between'}>

         <div className={'flex items-center gap-x-2 text-3xl font-medium'}>
           <Image
              src={'/logo.png'}
              alt={'WireAdmin'}
              width={40}
              height={40}
           />
           <h1> WireAdmin </h1>
         </div>

         <div className={'flex items-center gap-x-2'}>
           <Link
              href={'https://github.com/shahradelahi/tsetmc-client'}
              title={'Giv me a star on Github'}
           >
             <img
                src={'https://img.shields.io/github/stars/shahradelahi/tsetmc-client.svg?style=social&label=Star'}
                alt={'Giv me a star on Github'}
             />
           </Link>
         </div>

       </nav>
     </header>
  )
}
