import * as React from 'react';
import { cn } from '@/lib/utils';
import { WorkoutType, IntensityLevel, CyclePhase } from '@/types/api';
import { Route, Timer, Heart, Activity, Sprout, Sun, Leaf, Snowflake } from 'lucide-react';

export interface CalendarDayProps {
  dayNumber: number;
  sessionName?: string;
  distance?: number;
  durationMinutes?: number;
  intensityLevel?: IntensityLevel;
  workoutType?: WorkoutType;
  cyclePhase?: CyclePhase;
  zone?: string;
  rpe?: string;
  isRest?: boolean;
  className?: string;
}

export const CalendarDay = React.forwardRef<HTMLDivElement, CalendarDayProps>(
  (
    {
      dayNumber,
      sessionName,
      distance,
      durationMinutes,
      intensityLevel,
      cyclePhase,
      zone,
      rpe,
      isRest = false,
      className,
    },
    ref
  ) => {
    // Calculate filled hearts based on intensity level
    const getFilledHearts = (intensity?: IntensityLevel): number => {
      if (intensity === undefined) return 0;
      switch (intensity) {
        case IntensityLevel.Low:
          return 1;
        case IntensityLevel.Moderate:
          return 2;
        case IntensityLevel.High:
          return 3;
        default:
          return 0;
      }
    };

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

    const filledHearts = getFilledHearts(intensityLevel);
    const hasSession = !!sessionName;

    // Render heart icons for intensity rating (max 3 hearts)
    const renderHearts = () => {
      const hearts = [];
      const fullHearts = Math.floor(filledHearts);

      for (let i = 0; i < 3; i++) {
        if (i < fullHearts) {
          hearts.push(
            <Heart
              key={i}
              className="w-5 h-5 fill-destructive text-destructive"
            />
          );
        } else {
          hearts.push(
            <Heart key={i} className="w-5 h-5 text-destructive/20" />
          );
        }
      }
      return hearts;
    };

    return (
      <div
        ref={ref}
        className={cn(
          'bg-muted border border-border rounded-lg p-4 flex flex-col gap-4',
          'min-h-[160px] w-full',
          className
        )}
      >
        {/* Day number with cycle phase icon */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-foreground font-petrona">
            {dayNumber}
          </span>
          {getCyclePhaseIcon()}
        </div>

        {/* Session content */}
        {hasSession && !isRest ? (
          <div className="flex flex-col gap-2 flex-1">
            {/* Session name */}
            <h3 className="text-sm font-semibold text-foreground font-petrona leading-7">
              {sessionName}
            </h3>

            {/* Info badges */}
            <div className="flex flex-wrap gap-2 items-center">
              {distance && (
                <div className="bg-card border border-border rounded-md px-1.5 py-0.5 flex items-center gap-2">
                  <Route className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {distance} Mi
                  </span>
                </div>
              )}

              {durationMinutes && (
                <div className="bg-card border border-border rounded-md px-1.5 py-0.5 flex items-center gap-2">
                  <Timer className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {durationMinutes} Min
                  </span>
                </div>
              )}

              {(zone || rpe) && (
                <div className="bg-card border border-border rounded-md px-1.5 py-0.5 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {zone && rpe ? `${zone} / ${rpe}` : zone || rpe}
                  </span>
                </div>
              )}
            </div>

            {/* Intensity rating */}
            {intensityLevel !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Intensity</span>
                <div className="flex items-center gap-0.5">{renderHearts()}</div>
              </div>
            )}
          </div>
        ) : isRest ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-sm text-muted-foreground">Rest Day</span>
          </div>
        ) : null}
      </div>
    );
  }
);

CalendarDay.displayName = 'CalendarDay';
