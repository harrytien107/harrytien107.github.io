import Sider from '@/components/Sider';
import {ReactNode} from 'react';
import Contact from '@/components/Contact';

export default function AppLayout({children, hideContact}: {children: ReactNode, hideContact?: boolean}) {
  return <div className={'flex flex-row xl:container mx-auto h-full gap-0 lg:gap-4 xl:gap-8'}>
    <Sider/>
    <div className={'flex-1 w-full md:w-auto md:border-l lg:border-r bg-neutral-100 h-full md:overflow-y-auto'}>
      {children}
    </div>
    {!hideContact && <Contact/>}
  </div>
}
