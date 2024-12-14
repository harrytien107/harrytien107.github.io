'use client';
import {cn} from '@/lib/utils/cn';
import {tabs} from '@/app/ProfileContents';
import {useEffect, useState} from 'react';

export default function ProfileContentsTabBar() {
  const [activeTab, setActiveTab] = useState<string>('posts');

  useEffect(() => {
    document.querySelectorAll('.profile-tab').forEach(tab => tab.classList.add('hidden'));
    document.querySelector(`.profile-tab-${activeTab}`)?.classList.remove('hidden');
  }, [activeTab]);

  return <div className={'flex flex-row text-[14px] font-medium'}>
    {tabs.map(tab => (
      <div
        className={cn(
          'flex-1 py-4 text-center border-b text-neutral-400 uppercase font-semibold cursor-pointer hover:text-black',
          tab.key === activeTab && 'border-b-2 border-black text-black'
        )} key={tab.key}
        onClick={() => setActiveTab(tab.key)}
      >
        {tab.label}
      </div>
    ))}
  </div>
}
