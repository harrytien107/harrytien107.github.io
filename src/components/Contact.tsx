import {AppConfig} from '@/config/app.config';

export default function Contact() {
  return <div className={'w-[360px] py-4 hidden lg:flex flex-col'}>
    <div className={'p-4 border rounded-md flex flex-col gap-4'}>
      <div className={'uppercase font-semibold text-neutral-500'}>
        Subscription
      </div>
      <div className={'flex flex-col gap-2'}>
        {AppConfig.subscriptions.map(sub => (
          <a
            href={'/contact'}
            className={'flex flex-row justify-between bg-primary cursor-pointer text-white px-5 py-2 rounded-full font-semibold text-[14px]'}
            key={sub.name}
          >
            <span className={'uppercase'}>{sub.name}</span>
            <span className={'uppercase'}>{sub.price}</span>
          </a>
        ))}
      </div>
    </div>
    <div className={'border-t my-4'}/>
    <div className={'flex flex-row items-center justify-center text-neutral-400 text-[12px] gap-6'}>
      <div>
        Privacy
      </div>
      <div>
        Cookie Notice
      </div>
      <div>
        Terms of Service
      </div>
    </div>
  </div>;
}
