import type { Meta, StoryObj } from '@storybook/react-vite';
import { BrowserRouter } from 'react-router-dom';
import { CyclePhase, CycleRegularity, IntensityLevel, WorkoutType, PlanStatus } from '@/types/api';
import type { PlanDetailResponse, ProfileResponse, SessionSummary, SessionDetailDto } from '@/types/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDay } from '@/components/calendar/CalendarDay';
import { CyclePhaseLegend } from '@/components/calendar/CyclePhaseLegend';
import { WorkoutSessionCard } from '@/components/session/WorkoutSessionCard';
import { generateCyclePhasesForRange, formatDateKey } from '@/utils/cyclePhases';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';

// Mock training calendar component using CalendarDay components
const TrainingCalendar = ({
  plan,
  profile,
  hasCycleTracking
}: {
  plan: PlanDetailResponse;
  profile: ProfileResponse;
  hasCycleTracking: boolean;
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(plan.startDate));
  const [cyclePhases, setCyclePhases] = useState<Map<string, CyclePhase>>(new Map());
  const [sessionsByDate, setSessionsByDate] = useState<Map<string, SessionSummary>>(new Map());
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date | null>(null);
  const [weekSessions, setWeekSessions] = useState<SessionDetailDto[]>([]);
  const [isLoadingWeek, setIsLoadingWeek] = useState(false);

  const planStartDate = new Date(plan.startDate);
  const planEndDate = new Date(plan.raceDate);

  React.useEffect(() => {
    // Calculate cycle phases if enabled
    if (hasCycleTracking && profile.lastPeriodStart && profile.cycleLength) {
      const lastPeriodStart = new Date(profile.lastPeriodStart);
      const cycleLength = profile.cycleLength;
      const phases = generateCyclePhasesForRange(
        planStartDate,
        planEndDate,
        lastPeriodStart,
        cycleLength
      );
      setCyclePhases(phases);
    }

    // Map sessions by date
    const sessionsMap = new Map<string, SessionSummary>();
    plan.sessions.forEach((session) => {
      const date = new Date(session.scheduledDate);
      const dateKey = formatDateKey(date);
      sessionsMap.set(dateKey, session);
    });
    setSessionsByDate(sessionsMap);
  }, [plan, profile, hasCycleTracking]);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  // Get the Sunday of the week for a given date
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day; // Sunday = 0, so diff to Sunday is just the day value
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Handle clicking a calendar day
  const handleDayClick = (date: Date) => {
    const weekStart = getWeekStart(date);
    setSelectedWeekStart(weekStart);
    setIsLoadingWeek(true);

    // Simulate API loading delay
    setTimeout(() => {
      // Get all sessions for the week
      const sessionsInWeek: SessionDetailDto[] = [];

      // Iterate through the week (7 days) and collect sessions
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(weekStart);
        currentDate.setDate(weekStart.getDate() + i);
        const dateKey = formatDateKey(currentDate);
        const session = sessionsByDate.get(dateKey);
        if (session) {
          // Convert SessionSummary to SessionDetailDto with mock data
          const detailedSession: SessionDetailDto = {
            ...session,
            warmUp: session.workoutType !== WorkoutType.Rest
              ? "5-10 minutes of easy jogging\nDynamic stretches: leg swings, high knees, butt kicks\n3-4 strides (short, controlled accelerations)"
              : undefined,
            recovery: session.workoutType !== WorkoutType.Rest
              ? "5-10 minutes of easy jogging\nStatic stretching: focus on calves, hamstrings, quads, and hip flexors\nHydrate and refuel within 30 minutes"
              : undefined,
            sessionDescription: session.workoutType !== WorkoutType.Rest
              ? "Maintain a steady, comfortable pace throughout the run. Focus on consistent effort and good form."
              : undefined,
            sessionNumberInPhase: Math.floor(Math.random() * 5) + 1,
            totalSessionsInPhase: 6,
            menstruationDay: session.cyclePhase === CyclePhase.Menstrual ? Math.floor(Math.random() * 5) + 1 : undefined,
            workoutTips: session.workoutType !== WorkoutType.Rest ? [
              "Start slow and gradually build into your pace",
              "Focus on maintaining good running form throughout",
              "Listen to your body and adjust intensity if needed"
            ] : undefined,
            phaseGuidance: session.cyclePhase !== undefined
              ? getPhaseGuidance(session.cyclePhase)
              : undefined,
            isCompleted: !!session.completedAt,
          };
          sessionsInWeek.push(detailedSession);
        }
      }

      // Sort by scheduled date
      sessionsInWeek.sort((a, b) =>
        new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
      );

      setWeekSessions(sessionsInWeek);
      setIsLoadingWeek(false);
    }, 500);
  };

  // Helper to get phase guidance text
  const getPhaseGuidance = (phase: CyclePhase): string => {
    switch (phase) {
      case CyclePhase.Menstrual:
        return "Your body is in a recovery phase. Focus on gentle movement and listen to your energy levels.";
      case CyclePhase.Follicular:
        return "Rising estrogen levels support strength and endurance. Great time for challenging workouts!";
      case CyclePhase.Ovulatory:
        return "Peak performance window! Your body is primed for high-intensity efforts.";
      case CyclePhase.Luteal:
        return "Energy may fluctuate. Prioritize recovery and adjust intensity based on how you feel.";
      default:
        return "";
    }
  };

  const isPrevDisabled = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1) <=
    new Date(planStartDate.getFullYear(), planStartDate.getMonth(), 1);

  const isNextDisabled = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1) >=
    new Date(planEndDate.getFullYear(), planEndDate.getMonth(), 1);

  // Generate days for current month view
  const generateMonthDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const days: (Date | null)[] = [];

    // Add empty cells for days before month starts (Sunday = 0)
    const firstDayOfWeek = firstDay.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const monthDays = generateMonthDays();

  const raceDate = new Date(plan.raceDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const currentMonthLabel = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="space-y-4">
            {/* Plan info */}
            <div>
              <h1 className="text-2xl font-petrona text-foreground mb-1">Training Calendar</h1>
              <p className="text-xs font-normal" style={{ color: '#696863' }}>
                {plan.planName} • {plan.raceName} on {raceDate}
              </p>
            </div>

            {/* Month navigation */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-petrona text-foreground">{currentMonthLabel}</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevMonth}
                  disabled={isPrevDisabled}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextMonth}
                  disabled={isNextDisabled}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cycle Phase Legend - centered, below month and above weekday labels */}
          {hasCycleTracking && (
            <div className="flex justify-center py-2">
              <CyclePhaseLegend />
            </div>
          )}

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs font-normal p-2" style={{ color: '#696863' }}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid with CalendarDay components */}
          <div className="grid grid-cols-7 gap-2">
            {monthDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} />;
              }

              const dateKey = formatDateKey(date);
              const session = sessionsByDate.get(dateKey);
              const cyclePhase = cyclePhases.get(dateKey);

              return (
                <CalendarDay
                  key={dateKey}
                  dayNumber={date.getDate()}
                  sessionName={session?.sessionName}
                  distance={session?.distance}
                  durationMinutes={session?.durationMinutes}
                  intensityLevel={session?.intensityLevel}
                  workoutType={session?.workoutType}
                  cyclePhase={cyclePhase}
                  isRest={session?.workoutType === WorkoutType.Rest}
                  zone={session?.cyclePhase !== undefined ? `Zone ${session.cyclePhase}` : undefined}
                  onClick={() => handleDayClick(date)}
                />
              );
            })}
          </div>

          {/* Weekly Sessions Display */}
          {selectedWeekStart && (
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-petrona text-foreground">
                  Week of {selectedWeekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedWeekStart(null);
                    setWeekSessions([]);
                  }}
                >
                  Close
                </Button>
              </div>

              {isLoadingWeek ? (
                <div className="space-y-4">
                  <div className="h-48 bg-muted animate-pulse rounded-lg"></div>
                  <div className="h-48 bg-muted animate-pulse rounded-lg"></div>
                </div>
              ) : weekSessions.length > 0 ? (
                <div className="space-y-6">
                  {weekSessions.map((session) => (
                    <WorkoutSessionCard
                      key={session.id}
                      session={session}
                      onSessionUpdated={() => {
                        // In Storybook, just log the update
                        console.log('Session updated:', session.id);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No training sessions scheduled for this week.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Helper function to generate mock sessions
const generateMockSessions = (startDate: Date, endDate: Date): SessionSummary[] => {
  const sessions: SessionSummary[] = [];
  const currentDate = new Date(startDate);
  let sessionId = 1;

  const workoutTypes = [
    WorkoutType.Easy,
    WorkoutType.Long,
    WorkoutType.Tempo,
    WorkoutType.Interval,
    WorkoutType.Rest,
  ];

  const sessionNames = {
    [WorkoutType.Easy]: 'Easy Run',
    [WorkoutType.Long]: 'Long Run',
    [WorkoutType.Tempo]: 'Tempo Run',
    [WorkoutType.Interval]: 'Interval Training',
    [WorkoutType.Rest]: 'Rest Day',
  };

  const intensityMap = {
    [WorkoutType.Easy]: IntensityLevel.Low,
    [WorkoutType.Long]: IntensityLevel.Moderate,
    [WorkoutType.Tempo]: IntensityLevel.High,
    [WorkoutType.Interval]: IntensityLevel.High,
    [WorkoutType.Rest]: IntensityLevel.Low,
  };

  const durationMap = {
    [WorkoutType.Easy]: 45,
    [WorkoutType.Long]: 90,
    [WorkoutType.Tempo]: 60,
    [WorkoutType.Interval]: 50,
    [WorkoutType.Rest]: undefined,
  };

  const distanceMap = {
    [WorkoutType.Easy]: 5,
    [WorkoutType.Long]: 14,
    [WorkoutType.Tempo]: 8,
    [WorkoutType.Interval]: 6,
    [WorkoutType.Rest]: undefined,
  };

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();

    // Add workouts on most days, rest on Sundays
    if (dayOfWeek !== 0) {
      const workoutType = dayOfWeek === 6
        ? WorkoutType.Long // Saturday long run
        : workoutTypes[Math.floor(Math.random() * 4)]; // Random workout

      const session: SessionSummary = {
        id: `session-${sessionId++}`,
        sessionName: sessionNames[workoutType],
        scheduledDate: new Date(currentDate).toISOString(),
        workoutType,
        intensityLevel: intensityMap[workoutType],
        durationMinutes: durationMap[workoutType],
        distance: distanceMap[workoutType],
        isSkipped: false,
      };

      // Mark some past sessions as completed
      if (currentDate < new Date()) {
        if (Math.random() > 0.2) {
          session.completedAt = new Date(currentDate).toISOString();
        } else {
          session.isSkipped = true;
        }
      }

      sessions.push(session);
    } else {
      // Sunday rest day
      sessions.push({
        id: `session-${sessionId++}`,
        sessionName: 'Rest Day',
        scheduledDate: new Date(currentDate).toISOString(),
        workoutType: WorkoutType.Rest,
        intensityLevel: IntensityLevel.Low,
        isSkipped: false,
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return sessions;
};

const meta = {
  title: 'Pages/TrainingCalendar',
  component: TrainingCalendar,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof TrainingCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data
const today = new Date();
const planStart = new Date(today);
planStart.setDate(planStart.getDate() - 30);
const raceDate = new Date(today);
raceDate.setDate(raceDate.getDate() + 60);

const basePlan: PlanDetailResponse = {
  id: 'plan-1',
  raceId: 'race-1',
  raceName: 'Spring Half Marathon',
  raceDate: raceDate.toISOString(),
  runnerId: 'runner-1',
  planName: '12-Week Half Marathon Training',
  status: PlanStatus.Active,
  generationSource: 0,
  startDate: planStart.toISOString(),
  endDate: raceDate.toISOString(),
  trainingDaysPerWeek: 5,
  longRunDay: 6,
  daysBeforePeriodToReduceIntensity: 2,
  daysAfterPeriodToReduceIntensity: 2,
  createdAt: planStart.toISOString(),
  sessions: generateMockSessions(planStart, raceDate),
};

const profileWithCycleTracking: ProfileResponse = {
  id: 'profile-1',
  userId: 'user-1',
  name: 'Sarah Runner',
  fitnessLevel: 1,
  distanceUnit: 0,
  typicalWeeklyMileage: 30,
  typicalCycleRegularity: CycleRegularity.Regular,
  cycleLength: 28,
  lastPeriodStart: planStart.toISOString(),
  createdAt: planStart.toISOString(),
};

const profileWithoutCycleTracking: ProfileResponse = {
  ...profileWithCycleTracking,
  typicalCycleRegularity: CycleRegularity.DoNotTrack,
  cycleLength: undefined,
  lastPeriodStart: undefined,
};

export const WithCycleTracking: Story = {
  args: {
    plan: basePlan,
    profile: profileWithCycleTracking,
    hasCycleTracking: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Training calendar with CalendarDay components showing detailed session information for each day. Click any day to view all sessions for that week below the calendar.',
      },
    },
  },
};

export const WithoutCycleTracking: Story = {
  args: {
    plan: basePlan,
    profile: profileWithoutCycleTracking,
    hasCycleTracking: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Training calendar without cycle phase tracking, focusing on workout sessions. Click any day to view all sessions for that week below the calendar.',
      },
    },
  },
};
