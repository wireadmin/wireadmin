import React from "react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";
import PageHeader from "@ui/pages/PageHeader";
import PageFooter from "@ui/pages/PageFooter";

export type BasePageProps = {
  rootClassName?: string
  className?: string
  children: React.ReactNode
}

export default function BasePage(props: BasePageProps): React.ReactElement {
  return (
     <div className={clsx(
        'w-full min-h-screen flex justify-center',
        'px-2 md:px-6 py-2'
     )}>
       <div className={twMerge(
          'w-full mx-auto max-w-3xl',
          'space-y-3.5',
          props.rootClassName
       )}>
         <PageHeader />
         <main className={twMerge('py-2', props.className)}>
           {props.children}
         </main>
         <PageFooter />
       </div>
     </div>
  )
}
