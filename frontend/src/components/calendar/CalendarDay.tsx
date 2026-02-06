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
  isSelected?: boolean;
  className?: string;
  onClick?: () => void;
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
      isSelected = false,
      className,
      onClick,
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
              className="h-4 w-4 fill-destructive text-destructive"
            />
          );
        } else {
          hearts.push(
            <Heart key={i} className="h-4 w-4 text-destructive" />
          );
        }
      }
      return hearts;
    };

    return (
      <>
        <style>{`
          @keyframes gentle-float {
            0%, 100% {
              transform: translateY(-1.5px) scale(1.0025);
            }
            50% {
              transform: translateY(-4px) scale(1.01);
            }
          }
        `}</style>
        <div
          ref={ref}
          onClick={onClick}
          className={cn(
            'bg-[#fcf9f3] border border-[#ebe8e2] shadow-[4px_4px_0px_0px_#f3f0e7] rounded-lg p-3 flex flex-col',
            'relative overflow-visible',
            hasSession && !isRest ? 'gap-3' : '',
            'h-full w-full',
            'transition-all duration-200 ease-out',
            'will-change-transform',
            onClick && !isSelected && 'cursor-pointer hover:bg-muted hover:-translate-y-[4px] hover:scale-[1.01]',
            isSelected && 'bg-muted cursor-pointer [animation:gentle-float_2s_ease-in-out_infinite]',
            className
          )}
        >
        {/* Day number with cycle phase icon */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-normal text-foreground font-petrona">
            {dayNumber}
          </span>
          {getCyclePhaseIcon()}
        </div>

        {/* Session content */}
        {hasSession && !isRest ? (
          <div className="flex flex-col gap-2 flex-1">
            {/* Session name */}
            <h3 className="text-base font-normal text-foreground font-petrona leading-7">
              {sessionName}
            </h3>

            {/* Info badges */}
            <div className="flex flex-wrap gap-2 items-center">
              {distance && (
                <div className="bg-[#FDFBF7] border border-[#ebe8e2] rounded-md px-1.5 py-0.5 flex items-center gap-1.5">
                  <Route className="h-3.5 w-3.5 text-[#696863]" />
                  <span className="text-xs text-[#696863] font-normal">
                    {distance} Mi
                  </span>
                </div>
              )}

              {durationMinutes && (
                <div className="bg-[#FDFBF7] border border-[#ebe8e2] rounded-md px-1.5 py-0.5 flex items-center gap-1.5">
                  <Timer className="h-3.5 w-3.5 text-[#696863]" />
                  <span className="text-xs text-[#696863] font-normal">
                    {durationMinutes} Min
                  </span>
                </div>
              )}

              {(zone || rpe) && (
                <div className="bg-[#FDFBF7] border border-[#ebe8e2] rounded-md px-1.5 py-0.5 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-[#696863]" />
                  <span className="text-xs text-[#696863] font-normal">
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
          <div className="flex-1 flex items-center justify-center min-h-0">
            <span className="text-xs text-muted-foreground text-center">Rest Day</span>
          </div>
        ) : null}
      </div>
      </>
    );
  }
);

CalendarDay.displayName = 'CalendarDay';
