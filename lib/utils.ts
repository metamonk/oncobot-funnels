// /lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Globe, Book, TelescopeIcon, DollarSign, Heart, MessageCircle, Code, Brain, Youtube, X } from 'lucide-react';
import { isSearchModeEnabled } from './feature-toggles';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type SearchGroupId =
  | 'web'
  | 'x'
  | 'academic'
  | 'youtube'
  | 'reddit'
  | 'analysis'
  | 'chat'
  | 'extreme'
  | 'memory'
  | 'crypto'
  | 'health';

export const searchGroups = [
  {
    id: 'web' as const,
    name: 'Web',
    description: 'Search across the entire internet powered by Exa AI',
    icon: Globe,
    show: isSearchModeEnabled('web'),
  },
  {
    id: 'memory' as const,
    name: 'Memory',
    description: 'Your personal memory companion',
    icon: Brain,
    show: isSearchModeEnabled('memory'),
    requireAuth: true,
  },
  {
    id: 'analysis' as const,
    name: 'Analysis',
    description: 'Code, stock and currency stuff',
    icon: Code,
    show: isSearchModeEnabled('analysis'),
  },
  {
    id: 'crypto' as const,
    name: 'Crypto',
    description: 'Cryptocurrency research powered by CoinGecko',
    icon: DollarSign,
    show: isSearchModeEnabled('crypto'),
  },
  {
    id: 'chat' as const,
    name: 'Chat',
    description: 'Talk to the model directly.',
    icon: MessageCircle,
    show: isSearchModeEnabled('chat'),
  },
  {
    id: 'x' as const,
    name: 'X',
    description: 'Search X posts',
    icon: X,
    show: isSearchModeEnabled('x'),
  },
  {
    id: 'reddit' as const,
    name: 'Reddit',
    description: 'Search Reddit posts',
    icon: Book, // Using Book icon as placeholder for Reddit
    show: isSearchModeEnabled('reddit'),
  },
  {
    id: 'academic' as const,
    name: 'Academic',
    description: 'Search academic papers powered by Exa',
    icon: Book,
    show: isSearchModeEnabled('academic'),
  },
  {
    id: 'youtube' as const,
    name: 'YouTube',
    description: 'Search YouTube videos powered by Exa',
    icon: Youtube,
    show: isSearchModeEnabled('youtube'),
  },
  {
    id: 'extreme' as const,
    name: 'Extreme',
    description: 'Deep research with multiple sources and analysis',
    icon: TelescopeIcon,
    show: isSearchModeEnabled('extreme'),
  },
  {
    id: 'health' as const,
    name: 'Health',
    description: 'Clinical trials and health information search',
    icon: Heart,
    show: isSearchModeEnabled('health'),
  },
] as const;

export type SearchGroup = (typeof searchGroups)[number];

export function invalidateChatsCache() {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('invalidate-chats-cache');
    window.dispatchEvent(event);
  }
}
