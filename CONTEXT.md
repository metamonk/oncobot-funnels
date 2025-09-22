./components/ui/form-component.tsx:26:38
Type error: Cannot find module '@/app/actions' or its corresponding type declarations.
  24 | import { UserWithProStatus } from '@/hooks/use-user-data';
  25 | import { useSession } from '@/lib/auth-client';
> 26 | import { checkImageModeration } from '@/app/actions';
     |                                      ^
  27 | import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
  28 | import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
  29 | import { useUnifiedAnalytics } from '@/hooks/use-unified-analytics';