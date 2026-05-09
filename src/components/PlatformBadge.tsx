import React from 'react';
import { cn } from '../lib/utils';

export const PLATFORMS = [
  { 
    label: 'Instagram', 
    value: 'instagram',
    colorClass: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]'
  },
  { 
    label: 'TikTok', 
    value: 'tiktok',
    colorClass: 'bg-black border border-white/10 shadow-[1px_1px_0px_#00f2ea,-1px_-1px_0px_#ff0050]'
  },
  { 
    label: 'YouTube', 
    value: 'youtube',
    colorClass: 'bg-[#FF0000]'
  },
  { 
    label: 'Twitter/X', 
    value: 'twitter',
    colorClass: 'bg-black border border-white/10'
  },
  { 
    label: 'LinkedIn', 
    value: 'linkedin',
    colorClass: 'bg-[#0077B5]'
  },
  { 
    label: 'Blog', 
    value: 'blog',
    colorClass: 'bg-brand-cyan'
  },
];

export const PlatformBadge = ({ platform, size = 'md' }: { platform: string, size?: 'sm' | 'md' }) => {
  const p = PLATFORMS.find(item => item.value === platform);
  if (!p) return null;

  const sizeClasses = size === 'sm' ? 'w-4 h-4 rounded-md' : 'w-6 h-6 rounded-lg';
  const padding = size === 'sm' ? 'p-[2px]' : 'p-[4px]';

  return (
    <div className={cn(sizeClasses, "flex items-center justify-center shrink-0 overflow-hidden", p.colorClass)}>
      {platform === 'instagram' && (
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={cn("w-full h-full text-white", padding)}>
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
      )}

      {platform === 'tiktok' && (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cn("w-full h-full text-white", size === 'sm' ? 'p-[2.5px]' : 'p-[4.5px]')}>
          <path d="M12.525.02c1.31 0 2.57.44 3.59 1.25.1.08.15.18.1.3l-.68 2.21c-.04.13-.15.2-.28.16a6.83 6.83 0 0 1-2.73-.59v10.51a5.61 5.61 0 1 1-3.18-5.02c.12-.05.25.02.27.15l.41 2.29c.02.13-.05.25-.17.29a2.76 2.76 0 1 0 .67 2.29V.33c0-.18.14-.32.32-.32h2.2l-.01.01z" />
          <path d="M24 8.7c-2.48 0-4.66-1.39-5.78-3.44a.27.27 0 0 1 .05-.33l1.59-1.59a.29.29 0 0 1 .37-.03c1.03.78 2.33 1.25 3.77 1.25.17 0 .3.13.3.3v3.54c0 .17-.13.3-.3.3z" />
        </svg>
      )}

      {platform === 'youtube' && (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cn("w-full h-full text-white", padding)}>
          <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.507 9.388.507 9.388.507s7.517 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      )}

      {platform === 'twitter' && (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cn("w-full h-full text-white", padding)}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )}

      {platform === 'linkedin' && (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cn("w-full h-full text-white", padding)}>
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      )}

      {platform === 'blog' && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cn("w-full h-full text-white", padding)}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      )}
    </div>
  );
};
