import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TimelineItemProps {
  date: Date;
  isActive?: boolean;
  isCompleted?: boolean;
  showConnector?: boolean;
  className?: string;
}

export const TimelineItem = React.forwardRef<
  HTMLDivElement,
  TimelineItemProps
>(({ date, isActive = false, isCompleted = false, showConnector = true, className }, ref) => {
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div
      ref={ref}
      className={cn('flex flex-col items-center gap-4', className)}
      data-timeline-item
      style={{ width: '72px' }}
    >
      {/* Calendar Day Card */}
      <div
        className={cn(
          'bg-card border border-border flex flex-col items-center rounded-2xl overflow-visible transition-all w-full',
          isActive && 'ring-2 ring-primary shadow-md'
        )}
        style={{ height: '342px' }}
      >
        {/* Header with scallops */}
        <div className="bg-primary border border-border w-full relative flex flex-col justify-end items-center gap-2.5" style={{ borderRadius: '100px 100px 0 0', padding: '4px 8px' }}>
          {/* Three small scallop pills at the top */}
          <div className="flex justify-between items-center w-full px-2">
            <div className="w-1.5 h-[13px] rounded-[16px]" style={{ backgroundColor: '#535046' }} />
            <div className="w-1.5 h-[13px] rounded-[16px]" style={{ backgroundColor: '#535046' }} />
            <div className="w-1.5 h-[13px] rounded-[16px]" style={{ backgroundColor: '#535046' }} />
          </div>

          {/* Status indicator dot */}
          <div
            className={cn(
              'absolute w-1.5 h-[13px] rounded-[16px] -top-0.5 left-1/2 -translate-x-1/2',
              isCompleted && 'bg-success',
              isActive && 'bg-warning',
              !isCompleted && !isActive && 'bg-muted-foreground'
            )}
            style={{ backgroundColor: '#535046' }}
          />
        </div>

        {/* Date content */}
        <div className="flex-1 flex flex-col gap-1 items-center justify-center text-center px-2">
          <p className="text-xs text-muted-foreground font-normal leading-4">
            {dayOfWeek}
          </p>
          <p className="text-sm text-foreground font-medium leading-5">
            {dateStr}
          </p>
        </div>
      </div>

      {/* Connector line */}
      {showConnector && (
        <div className="w-px h-64 bg-border relative">
          <div
            className={cn(
              'absolute inset-0 w-full transition-all',
              isCompleted && 'bg-success/50'
            )}
          />
        </div>
      )}
    </div>
  );
});

TimelineItem.displayName = 'TimelineItem';

export interface TimelineProps {
  children?: React.ReactNode;
  className?: string;
}

export const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col items-center', className)}
        data-timeline
      >
        {children}
      </div>
    );
  }
);

Timeline.displayName = 'Timeline';
