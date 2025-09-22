./components/navbar.tsx:10:35
Type error: Cannot find module '@/components/chat-history-dialog' or its corresponding type declarations.
   8 | import { Button } from '@/components/ui/button';
   9 | import { UserProfile } from '@/components/user-profile';
> 10 | import { ChatHistoryButton } from '@/components/chat-history-dialog';
     |                                   ^
  11 | import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
  12 | import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
  13 | import { cn } from '@/lib/utils';