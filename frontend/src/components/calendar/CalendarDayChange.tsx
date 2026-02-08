import * as React from 'react';
import { cn } from '@/lib/utils';
import { WorkoutType, CyclePhase } from '@/types/api';
import type { SessionChangeDto } from '@/types/api';
import { Route, Timer, Sprout, Sun, Leaf, Snowflake, ArrowRight } from 'lucide-react';

export interface CalendarDayChangeProps {
  change: SessionChangeDto;
  cyclePhase?: CyclePhase;
  className?: string;
}

const workoutTypeLabels: Record<WorkoutType, string> = {
  [WorkoutType.Easy]: 'Easy Run',
  [WorkoutType.Long]: 'Long Run',
  [WorkoutType.Tempo]: 'Tempo Run',
  [WorkoutType.Interval]: 'Intervals',
  [WorkoutType.Rest]: 'Rest Day'
};

export const CalendarDayChange = React.forwardRef<HTMLDivElement, CalendarDayChangeProps>(
  ({ change, cyclePhase, className }, ref) => {
    const date = new Date(change.scheduledDate);
    const dayNumber = date.getDate();

    // Check which fields actually changed
    const typeChanged = change.oldWorkoutType !== change.newWorkoutType;

    // Get icon based on cycle phase
    const getCyclePhaseIcon = () => {
      if (cyclePhase === undefined) {
        return <Sprout className="w-5 h-5 text-foreground" />;
      }

      switch (cyclePhase) {
        case CyclePhase.Follicular:
          return <Sprout className="w-5 h-5 text-foreground" />;
        case CyclePhase.Ovulatory:
          return <Sun className="w-5 h-5 text-foreground" />;
        case CyclePhase.Luteal:
          return <Leaf className="w-5 h-5 text-foreground" />;
        case CyclePhase.Menstrual:
          return <Snowflake className="w-5 h-5 text-foreground" />;
        default:
          return <Sprout className="w-5 h-5 text-foreground" />;
      }
    };

    // Render a change badge with old → new values
    const renderChangeBadge = (
      icon: React.ReactNode,
      oldValue: string | number | undefined,
      newValue: string | number | undefined,
      unit: string
    ) => {
      const hasChange = oldValue !== newValue;

      return (
        <div className="bg-background border border-border rounded-md px-2 py-1 flex items-center gap-1.5">
          {icon}
          {hasChange ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-[#b54a32] line-through">
                {oldValue ?? 'N/A'} {unit}
              </span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-primary font-medium">
                {newValue ?? 'N/A'} {unit}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">
              {newValue ?? 'N/A'} {unit}
            </span>
          )}
        </div>
      );
    };

    return (
      <div
        ref={ref}
        className={cn(
          'bg-card border border-[#ebe8e2] shadow-[4px_4px_0px_0px_#f3f0e7] rounded-lg p-3 flex flex-col gap-3',
          'relative overflow-visible',
          className
        )}
      >
        {/* Day number with weekday and cycle phase icon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-normal text-foreground font-petrona">
              {dayNumber}
            </span>
            <span className="text-sm text-muted-foreground">
              {date.toLocaleDateString('en-US', { weekday: 'short' })}
            </span>
          </div>
          {getCyclePhaseIcon()}
        </div>

        {/* Session name with type change indicator */}
        <div className="flex flex-col gap-1">
          {typeChanged ? (
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm text-[#b54a32] line-through">
                {workoutTypeLabels[change.oldWorkoutType!] ?? change.sessionName}
              </h3>
              <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <h3 className="text-base font-normal text-primary font-petrona">
                {workoutTypeLabels[change.newWorkoutType]}
              </h3>
            </div>
          ) : (
            <h3 className="text-base font-normal text-foreground font-petrona">
              {change.sessionName}
            </h3>
          )}
        </div>

        {/* Info badges with changes */}
        <div className="flex flex-wrap gap-2 items-center">
          {(change.oldDistance || change.newDistance) && renderChangeBadge(
            <Route className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />,
            change.oldDistance ? Math.round(change.oldDistance) : undefined,
            change.newDistance ? Math.round(change.newDistance) : undefined,
            'mi'
          )}

          {(change.oldDuration || change.newDuration) && renderChangeBadge(
            <Timer className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />,
            change.oldDuration,
            change.newDuration,
            'min'
          )}
        </div>

      </div>
    );
  }
);

CalendarDayChange.displayName = 'CalendarDayChange';
