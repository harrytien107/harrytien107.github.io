'use client';
import {IconType} from 'react-icons';
import {cn} from '@/lib/utils/cn';

interface IconButtonProps {
  icon: IconType;
  label: string;
  onClick?: () => void;
  url?: string;
}

export function IconButton(props: IconButtonProps) {
  return <div
    className={cn(
      'text-neutral-500 w-[40px] h-[40px] flex items-center cursor-pointer hover:text-primary hover:bg-primary/20',
      'w-full gap-4 text-[18px] font-medium'
    )}
    onClick={() => {
      props.onClick && props.onClick();
      if (props.url) location.href = props.url;
    }}
  >
    <div className={'w-[32px]'}>
      <props.icon className={'text-[22px] mx-auto'}/>
    </div>
    <div className={'hidden lg:block'}>
      {props.label}
    </div>
  </div>;
}
