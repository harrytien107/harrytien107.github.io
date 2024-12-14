'use client';
import {useState} from 'react';
import {cn} from '@/lib/utils/cn';

export default function PostPictures({post}: { post: any }) {
  const [pictures, setPictures] = useState<string[]>(post.images ?? []);
  const [pictureIndex, setPictureIndex] = useState<number>(0);

  if (pictures.length === 0) return <></>;
  return <div className={'w-full relative'}>
    <div
      className={'w-full aspect-video bg-cover bg-center'}
      style={{
        backgroundImage: `url(${post.images[pictureIndex]})`
      }}
    />
    <div className={'flex flex-row absolute bottom-4 left-4'}>
      {Array.from(Array(pictures.length).keys()).map(index => (
        <div
          key={index}
          onClick={() => setPictureIndex(index)}
          className={'cursor-pointer p-2 -mx-1 -my-1'}
        >
          <div
            className={cn(
              'w-2 h-2 rounded-full bg-white/50',
              index === pictureIndex && 'bg-white'
            )}
          />
        </div>
      ))}
    </div>
  </div>;
}
