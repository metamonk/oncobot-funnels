'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  getUserMessageCount,
  getExtremeSearchUsageCount,
  getHistoricalUsage,
  getCustomInstructions,
  saveCustomInstructions,
  deleteCustomInstructionsAction,
} from '@/app/actions';
import { authClient } from '@/lib/auth-client';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { getAllMemories, searchMemories, deleteMemory, MemoryItem } from '@/lib/memory-actions';
import { Loader2, Search, Trash2, Settings, Search as SearchIcon, Zap, TrendingUp, User, TrendingUp as ChartLineUpIcon, Brain, Calendar, NotebookPen, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import { HealthProfileSection } from '@/components/health-profile/HealthProfileSection';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  isCustomInstructionsEnabled?: boolean;
  setIsCustomInstructionsEnabled?: (value: boolean | ((val: boolean) => boolean)) => void;
}

// Component for Profile Information
function ProfileSection({ user }: any) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className="space-y-4">
      <div className={cn('flex flex-col items-center text-center space-y-3', isMobile ? 'pb-2' : 'pb-4')}>
        <Avatar className={isMobile ? 'h-16 w-16' : 'h-20 w-20'}>
          <AvatarImage src={user?.image || ''} />
          <AvatarFallback className={isMobile ? 'text-base' : 'text-lg'}>
            {user?.name
              ? user.name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
              : 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h3 className={cn('font-semibold', isMobile ? 'text-base' : 'text-lg')}>{user?.name}</h3>
          <p className={cn('text-muted-foreground', isMobile ? 'text-xs' : 'text-sm')}>{user?.email}</p>
        </div>
      </div>

      <div className={isMobile ? 'space-y-2' : 'space-y-3'}>
        <div className={cn('bg-muted/50 rounded-lg space-y-3', isMobile ? 'p-3' : 'p-4')}>
          <div>
            <Label className="text-xs text-muted-foreground">Full Name</Label>
            <p className="text-sm font-medium mt-1">{user?.name || 'Not provided'}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Email Address</Label>
            <p className="text-sm font-medium mt-1 break-all">{user?.email || 'Not provided'}</p>
          </div>
        </div>

        <div className={cn('bg-muted/30 rounded-lg border border-border', isMobile ? 'p-2.5' : 'p-3')}>
          <p className={cn('text-muted-foreground', isMobile ? 'text-[11px]' : 'text-xs')}>
            Profile information is managed through your authentication provider. Contact support to update your details.
          </p>
        </div>
      </div>
    </div>
  );
}

// Usage Bar Chart Component
function UsageBarChart({ data, className }: { data: any[]; className?: string }) {
  const { resolvedTheme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const chartConfig = {
    count: {
      label: 'Messages',
      color: resolvedTheme === 'dark' ? 'hsl(200 100% 50%)' : 'hsl(220 70% 50%)', // Bright cyan in dark, blue in light
    },
  };

  // Process data for the last 30 days to keep chart readable on mobile
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Take last 30 days for desktop, 14 for mobile - use media query hook instead of window
    const daysToShow = 14; // Always use 14 days for mobile to avoid resize triggers

    const recentData = data
      .slice(-daysToShow)
      .filter((item) => item.count > 0)
      .map((item) => {
        const date = new Date(item.date);
        return {
          ...item,
          day: date.getDate(),
          fullDate: date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
        };
      });

    return recentData;
  }, [data]);

  if (!processedData.length) {
    return null;
  }

  // Calculate max value and round up to nearest multiple of 5
  const maxCount = Math.max(...processedData.map((d) => d.count));
  const yAxisMax = Math.ceil(maxCount / 5) * 5;

  // Dynamic bar color based on theme
  const barColor = resolvedTheme === 'dark' ? 'hsl(200 100% 50%)' : 'hsl(220 70% 50%)';

  return (
    <div className={cn('w-full', className)}>
      <ChartContainer config={chartConfig} className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={processedData}
            margin={isMobile ? { top: 10, right: 0, left: 10, bottom: 5 } : { top: 10, right: 5, left: 25, bottom: 10 }}
          >
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              interval={isMobile ? 2 : 'preserveStartEnd'}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              domain={[0, yAxisMax]}
              ticks={Array.from({ length: Math.min(4, Math.floor(yAxisMax / 5) + 1) }, (_, i) => i * 5)}
              width={isMobile ? 15 : 20}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              labelFormatter={(value: any, payload: any) => {
                if (payload && payload[0]) {
                  return payload[0].payload.fullDate;
                }
                return value;
              }}
            />
            <Bar dataKey="count" fill={barColor} radius={[3, 3, 0, 0]} name="Messages" barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}

// Component for Usage Information
function UsageSection({ user }: any) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const {
    data: usageData,
    isLoading: usageLoading,
    error: usageError,
    refetch: refetchUsageData,
  } = useQuery({
    queryKey: ['usageData'],
    queryFn: async () => {
      const [searchCount, extremeSearchCount] = await Promise.all([
        getUserMessageCount(),
        getExtremeSearchUsageCount(),
      ]);

      return {
        searchCount,
        extremeSearchCount,
      };
    },
    staleTime: 1000 * 60 * 3,
    enabled: !!user,
  });

  const {
    data: historicalUsageData,
    isLoading: historicalLoading,
    refetch: refetchHistoricalData,
  } = useQuery({
    queryKey: ['historicalUsage', user?.id],
    queryFn: () => getHistoricalUsage(user),
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  });

  const searchCount = usageData?.searchCount;
  const extremeSearchCount = usageData?.extremeSearchCount;

  const handleRefreshUsage = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([refetchUsageData(), refetchHistoricalData()]);
      toast.success('Usage data refreshed');
    } catch (error) {
      toast.error('Failed to refresh usage data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const searchLimit = 100; // Default display limit for UI purposes
  const usagePercentage = Math.min(((searchCount?.count || 0) / searchLimit) * 100, 100);

  return (
    <div className={cn(isMobile ? 'space-y-3' : 'space-y-4', isMobile ? 'pb-4' : '')}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Daily Search Usage</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefreshUsage}
          disabled={isRefreshing}
          className={isMobile ? 'h-7 px-1.5' : 'h-8 px-2'}
        >
          {isRefreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5" />}
        </Button>
      </div>

      <div className={cn('grid grid-cols-2', isMobile ? 'gap-2' : 'gap-3')}>
        <div className={cn('bg-muted/50 rounded-lg space-y-1', isMobile ? 'p-2.5' : 'p-3')}>
          <div className="flex items-center justify-between">
            <span className={cn('text-muted-foreground', isMobile ? 'text-[11px]' : 'text-xs')}>Today</span>
            <SearchIcon className={isMobile ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
          </div>
          {usageLoading ? (
            <Skeleton className={cn('font-semibold', isMobile ? 'text-base h-4' : 'text-lg h-5')} />
          ) : (
            <div className={cn('font-semibold', isMobile ? 'text-base' : 'text-lg')}>{searchCount?.count || 0}</div>
          )}
          <p className="text-[10px] text-muted-foreground">Regular searches</p>
        </div>

        <div className={cn('bg-muted/50 rounded-lg space-y-1', isMobile ? 'p-2.5' : 'p-3')}>
          <div className="flex items-center justify-between">
            <span className={cn('text-muted-foreground', isMobile ? 'text-[11px]' : 'text-xs')}>Extreme</span>
            <Zap className={isMobile ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
          </div>
          {usageLoading ? (
            <Skeleton className={cn('font-semibold', isMobile ? 'text-base h-4' : 'text-lg h-5')} />
          ) : (
            <div className={cn('font-semibold', isMobile ? 'text-base' : 'text-lg')}>
              {extremeSearchCount?.count || 0}
            </div>
          )}
          <p className="text-[10px] text-muted-foreground">This month</p>
        </div>
      </div>

      <div className={isMobile ? 'space-y-2' : 'space-y-3'}>
        <div className={cn('bg-muted/30 rounded-lg space-y-2', isMobile ? 'p-2.5' : 'p-3')}>
          {usageLoading ? (
            <>
              <div className="flex justify-between text-xs">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-1.5 w-full" />
            </>
          ) : (
            <>
              <div className="flex justify-between text-xs">
                <span className="font-medium">Daily Limit</span>
                <span className="text-muted-foreground">{usagePercentage.toFixed(0)}%</span>
              </div>
              <Progress value={usagePercentage} className="h-1.5 [&>div]:transition-none" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>
                  {searchCount?.count || 0} searches today
                </span>
                <span>Unlimited access</span>
              </div>
            </>
          )}
        </div>
      </div>

      {!usageLoading && (
        <div className={cn('space-y-2', isMobile ? 'pb-4' : '')}>
          <h4 className={cn('font-semibold text-muted-foreground', isMobile ? 'text-[11px]' : 'text-xs')}>
            Activity (Past 14 days)
          </h4>
          <div className={cn('bg-muted/50 dark:bg-card rounded-lg overflow-hidden', isMobile ? 'p-2' : 'p-3')}>
            {historicalLoading ? (
              <div className="h-24 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : historicalUsageData && historicalUsageData.length > 0 ? (
              <div className="h-24 overflow-hidden">
                <UsageBarChart data={historicalUsageData} className="h-full w-full" />
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center">
                <p className={cn('text-muted-foreground', isMobile ? 'text-[11px]' : 'text-xs')}>No activity data</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// Component for Custom Instructions
function CustomInstructionsSection({
  user,
  isCustomInstructionsEnabled,
  setIsCustomInstructionsEnabled,
}: {
  user: any;
  isCustomInstructionsEnabled?: boolean;
  setIsCustomInstructionsEnabled?: (value: boolean | ((val: boolean) => boolean)) => void;
}) {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Use default value if not provided
  const enabled = isCustomInstructionsEnabled ?? true;
  const setEnabled = setIsCustomInstructionsEnabled ?? (() => {});

  const {
    data: customInstructions,
    isLoading: customInstructionsLoading,
    refetch,
  } = useQuery({
    queryKey: ['customInstructions', user?.id],
    queryFn: () => getCustomInstructions(user),
    enabled: !!user,
  });

  useEffect(() => {
    if (customInstructions?.content) {
      setContent(customInstructions.content);
    }
  }, [customInstructions]);

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('Please enter some instructions');
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveCustomInstructions(content);
      if (result.success) {
        toast.success('Custom instructions saved successfully');
        refetch();
      } else {
        toast.error(result.error || 'Failed to save instructions');
      }
    } catch (error) {
      toast.error('Failed to save instructions');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    try {
      const result = await deleteCustomInstructionsAction();
      if (result.success) {
        toast.success('Custom instructions deleted successfully');
        setContent('');
        refetch();
      } else {
        toast.error(result.error || 'Failed to delete instructions');
      }
    } catch (error) {
      toast.error('Failed to delete instructions');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="enable-instructions" className="text-sm font-medium">
            Enable Custom Instructions
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Toggle to enable or disable custom instructions for your conversations
          </p>
        </div>
        <Switch id="enable-instructions" checked={enabled} onCheckedChange={setEnabled} />
      </div>

      <div className={cn('space-y-3', !enabled && 'opacity-50')}>
        <div>
          <Label htmlFor="instructions" className="text-sm font-medium">
            Custom Instructions
          </Label>
          <p className="text-xs text-muted-foreground mt-1 mb-3">Guide how the AI responds to your questions</p>
          {customInstructionsLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <Textarea
              id="instructions"
              placeholder="Enter your custom instructions here... For example: 'Always provide code examples when explaining programming concepts' or 'Keep responses concise and focused on practical applications'"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] max-h-[30vh] resize-y text-sm"
              disabled={isSaving || !enabled}
            />
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={isSaving || !content.trim() || customInstructionsLoading || !enabled}
            size="sm"
            className="flex-1 h-9"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Instructions'
            )}
          </Button>
          {customInstructions && (
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={isSaving || customInstructionsLoading || !enabled}
              size="sm"
              className="h-9 px-3"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {customInstructionsLoading ? (
          <div className="p-2.5 bg-muted/30 rounded-lg">
            <Skeleton className="h-3 w-28" />
          </div>
        ) : customInstructions ? (
          <div className="p-2.5 bg-muted/30 rounded-lg">
            <p className="text-[10px] text-muted-foreground">
              Last updated: {new Date(customInstructions.updatedAt).toLocaleDateString()}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// Component for Memories
function MemoriesSection() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingMemoryIds, setDeletingMemoryIds] = useState<Set<string>>(new Set());

  const {
    data: memoriesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: memoriesLoading,
  } = useInfiniteQuery({
    queryKey: ['memories'],
    queryFn: async ({ pageParam }) => {
      const pageNumber = pageParam as number;
      return await getAllMemories(pageNumber);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const hasMore = lastPage.memories.length >= 20;
      return hasMore ? Number(lastPage.memories[lastPage.memories.length - 1]?.id) : undefined;
    },
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: searchResults,
    isLoading: isSearching,
    refetch: performSearch,
  } = useQuery({
    queryKey: ['memories', 'search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return { memories: [], total: 0 };
      return await searchMemories(searchQuery);
    },
    enabled: true,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMemory,
    onSuccess: (_, memoryId) => {
      setDeletingMemoryIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(memoryId);
        return newSet;
      });
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      toast.success('Memory deleted successfully');
    },
    onError: (_, memoryId) => {
      setDeletingMemoryIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(memoryId);
        return newSet;
      });
      toast.error('Failed to delete memory');
    },
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      await performSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    queryClient.invalidateQueries({ queryKey: ['memories', 'search'] });
  };

  const handleDeleteMemory = (id: string) => {
    setDeletingMemoryIds((prev) => new Set(prev).add(id));
    deleteMutation.mutate(id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  const getMemoryContent = (memory: MemoryItem): string => {
    if (memory.memory) return memory.memory;
    if (memory.name) return memory.name;
    return 'No content available';
  };

  const displayedMemories =
    searchQuery.trim() && searchResults
      ? searchResults.memories
      : memoriesData?.pages.flatMap((page) => page.memories) || [];

  const totalMemories =
    searchQuery.trim() && searchResults
      ? searchResults.total
      : memoriesData?.pages.reduce((acc, page) => acc + page.memories.length, 0) || 0;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories..."
            className="pr-20 h-9 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch(e);
              }
            }}
          />
          <div className="absolute right-1 top-1 flex gap-1">
            <Button
              onClick={handleSearch}
              size="sm"
              variant="ghost"
              disabled={isSearching || !searchQuery.trim()}
              className="h-7 w-7 p-0"
            >
              {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            </Button>
            {searchQuery.trim() && (
              <Button variant="ghost" size="sm" onClick={handleClearSearch} className="h-7 px-2 text-xs">
                Clear
              </Button>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {totalMemories} {totalMemories === 1 ? 'memory' : 'memories'} stored
        </p>
      </div>

      <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
        {memoriesLoading && !displayedMemories.length ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : displayedMemories.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-32 border border-dashed rounded-lg bg-muted/20">
            <Brain className="h-6 w-6 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No memories found</p>
          </div>
        ) : (
          <>
            {displayedMemories.map((memory: MemoryItem) => (
              <div
                key={memory.id}
                className="group relative p-3 rounded-lg border bg-card/50 hover:bg-card transition-all"
              >
                <div className="pr-8">
                  <p className="text-sm leading-relaxed">{getMemoryContent(memory)}</p>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-2">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(memory.created_at)}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteMemory(memory.id)}
                  disabled={deletingMemoryIds.has(memory.id)}
                  className={cn(
                    'absolute right-2 top-2 h-6 w-6 text-muted-foreground hover:text-destructive',
                    'opacity-0 group-hover:opacity-100 transition-opacity',
                    'touch-manipulation', // Better touch targets on mobile
                  )}
                  style={{ opacity: 1 }} // Always visible on mobile
                >
                  {deletingMemoryIds.has(memory.id) ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
              </div>
            ))}

            {hasNextPage && !searchQuery.trim() && (
              <div className="pt-2 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={!hasNextPage || isFetchingNextPage}
                  size="sm"
                  className="h-8"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function SettingsDialog({
  open,
  onOpenChange,
  user,
  isCustomInstructionsEnabled,
  setIsCustomInstructionsEnabled,
}: SettingsDialogProps) {
  const [currentTab, setCurrentTab] = useState('profile');
  const isMobile = useMediaQuery('(max-width: 768px)');

  const tabItems = [
    { value: 'profile', label: 'Account', icon: User },
    { value: 'health', label: 'Health Profile', icon: Heart },
    { value: 'usage', label: 'Usage', icon: ChartLineUpIcon },
    { value: 'instructions', label: 'Customize', icon: NotebookPen },
    { value: 'memories', label: 'Memories', icon: Brain },
  ];

  const contentSections = (
    <>
      <TabsContent value="profile" className="mt-0">
        <ProfileSection user={user} />
      </TabsContent>

      <TabsContent value="health" className="mt-0">
        <HealthProfileSection user={user} />
      </TabsContent>

      <TabsContent value="usage" className="mt-0">
        <UsageSection user={user} />
      </TabsContent>

      <TabsContent value="instructions" className="mt-0">
        <CustomInstructionsSection
          user={user}
          isCustomInstructionsEnabled={isCustomInstructionsEnabled}
          setIsCustomInstructionsEnabled={setIsCustomInstructionsEnabled}
        />
      </TabsContent>

      <TabsContent value="memories" className="mt-0">
        <MemoriesSection />
      </TabsContent>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[85vh] max-h-[600px] p-0 [&[data-vaul-drawer]]:transition-none overflow-hidden">
          <div className="flex flex-col h-full max-h-full">
            {/* Header - more compact */}
            <DrawerHeader className="pb-2 px-4 pt-3 shrink-0">
              <DrawerTitle className="text-base font-medium">Settings</DrawerTitle>
            </DrawerHeader>

            {/* Content area with tabs */}
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-1 flex flex-col overflow-hidden">
              {/* Tab content - takes up most space */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4">{contentSections}</div>

              {/* Bottom tab navigation - compact and accessible */}
              <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 shrink-0">
                <TabsList className="w-full h-14 p-1 bg-transparent rounded-none grid grid-cols-5 gap-1">
                  {tabItems.map((item) => (
                    <TabsTrigger
                      key={item.value}
                      value={item.value}
                      className="flex-col gap-0.5 h-full rounded-md data-[state=active]:bg-muted data-[state=active]:shadow-none relative px-1 transition-colors"
                    >
                      <item.icon
                        className={cn(
                          'h-4 w-4 transition-colors',
                          currentTab === item.value ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      />
                      <span
                        className={cn(
                          'text-[9px] mt-0.5 transition-colors line-clamp-1',
                          currentTab === item.value ? 'text-foreground font-medium' : 'text-muted-foreground',
                        )}
                      >
                        {item.label === 'Health Profile' ? 'Health' : item.label}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-4xl !w-full max-h-[85vh] !p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 !m-0">
          <DialogTitle className="text-xl font-medium tracking-normal">Settings</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-48 !m-0">
            <div className="p-2 !gap-1 flex flex-col">
              {tabItems.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setCurrentTab(item.value)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    'hover:bg-muted',
                    currentTab === item.value
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(85vh-120px)]">
              <div className="p-6 pb-8">
                <Tabs value={currentTab} onValueChange={setCurrentTab} orientation="vertical">
                  {contentSections}
                </Tabs>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
