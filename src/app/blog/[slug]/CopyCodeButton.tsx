"use client";
import {FiCopy} from 'react-icons/fi';
import {useEffect, useState} from 'react';

export default function CopyCodeButton({code}: {code: string}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) setTimeout(() => setCopied(false), 1000);
  }, [copied]);

  return <button
    className="absolute z-40 mr-2 mt-5 text-white bg-white/10 right-2 top-0 flex flex-row px-2 py-1 rounded-lg items-center gap-1"
    onClick={() => navigator.clipboard.writeText(code).then(() => setCopied(true))}
  >
    <FiCopy/> {copied ? 'Copied' : 'Copy'}
  </button>
}
