import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarDays, Snowflake, Sprout, Sun, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { DateRange } from "react-day-picker";

interface HormoneData {
  day: number;
  estrogen: number;
  progesterone: number;
  fsh: number;
  lh: number;
}

const generateHormoneData = (): HormoneData[] => {
  const data: HormoneData[] = [];

  for (let day = 1; day <= 28; day++) {
    // Estrogen: Low at start, rises during follicular, peaks at ovulation, moderate in luteal
    const estrogen =
      day <= 10 ? 25 :
      day <= 12 ? 25 + Math.pow((day - 10) / 2, 2) * 45 :
      day === 13 ? 95 :
      day === 14 ? 100 :
      day <= 16 ? 100 - Math.pow((day - 14) / 2, 2) * 35 :
      day <= 21 ? 65 + Math.pow((day - 16) / 5, 1.5) * 20 :
      85 - Math.pow((day - 21) / 7, 1.2) * 60;

    // Progesterone: Very low until ovulation, then rises significantly in luteal phase
    const progesterone =
      day <= 13 ? 10 :
      day <= 21 ? 10 + Math.pow((day - 13) / 8, 1.8) * 100 :
      day <= 23 ? 110 :
      110 - Math.pow((day - 23) / 5, 1.5) * 90;

    // FSH: Single smooth peak at ovulation
    const fsh =
      day <= 10 ? 25 :
      day <= 13 ? 25 + Math.pow((day - 10) / 3, 1.5) * 60 :
      day <= 15 ? 85 :
      day <= 18 ? 85 - Math.pow((day - 15) / 3, 1.3) * 50 :
      35 - Math.pow((day - 18) / 10, 0.8) * 10;

    // LH: Sharp peak at ovulation (day 13-14)
    const lh =
      day <= 11 ? 15 + day * 2 :
      day === 12 ? 45 :
      day === 13 ? 95 :
      day === 14 ? 85 :
      day === 15 ? 40 :
      20 - (day - 15) * 0.5;

    data.push({
      day,
      estrogen: Math.max(0, estrogen),
      progesterone: Math.max(0, progesterone),
      fsh: Math.max(0, fsh),
      lh: Math.max(0, lh),
    });
  }

  return data;
};

const HORMONE_COLORS = {
  estrogen: "#efa910",  // Yellow
  progesterone: "#a14139",  // Red
  fsh: "#677344",  // Green
  lh: "#597d93",  // Blue
};

const chartConfig = {
  estrogen: {
    label: "Estrogen",
    theme: {
      light: HORMONE_COLORS.estrogen,
      dark: HORMONE_COLORS.estrogen,
    },
  },
  progesterone: {
    label: "Progesterone",
    theme: {
      light: HORMONE_COLORS.progesterone,
      dark: HORMONE_COLORS.progesterone,
    },
  },
  fsh: {
    label: "FSH",
    theme: {
      light: HORMONE_COLORS.fsh,
      dark: HORMONE_COLORS.fsh,
    },
  },
  lh: {
    label: "LH",
    theme: {
      light: HORMONE_COLORS.lh,
      dark: HORMONE_COLORS.lh,
    },
  },
};

interface PhaseChartProps {
  data: HormoneData[];
  phaseType: "follicular" | "luteal";
}

const PhaseChart: React.FC<PhaseChartProps> = ({ data, phaseType }) => {
  return (
    <div className="h-[199px] w-full">
      <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={`${phaseType}Estrogen`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={HORMONE_COLORS.estrogen} stopOpacity={0.5} />
              <stop offset="100%" stopColor={HORMONE_COLORS.estrogen} stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`${phaseType}Progesterone`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={HORMONE_COLORS.progesterone} stopOpacity={0.5} />
              <stop offset="100%" stopColor={HORMONE_COLORS.progesterone} stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`${phaseType}FSH`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={HORMONE_COLORS.fsh} stopOpacity={0.5} />
              <stop offset="100%" stopColor={HORMONE_COLORS.fsh} stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`${phaseType}LH`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={HORMONE_COLORS.lh} stopOpacity={0.5} />
              <stop offset="100%" stopColor={HORMONE_COLORS.lh} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="hsl(var(--border))"
            strokeOpacity={0.3}
          />

          <YAxis hide domain={[0, 120]} />
          <XAxis hide dataKey="day" />

          <ChartTooltip
            content={
              <ChartTooltipContent
                className="w-40"
                labelFormatter={(value) => `Day ${value}`}
              />
            }
          />

          <Area
            type="basis"
            dataKey="estrogen"
            name="Estrogen"
            stroke={HORMONE_COLORS.estrogen}
            strokeOpacity={0.4}
            fill={`url(#${phaseType}Estrogen)`}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Area
            type="basis"
            dataKey="progesterone"
            name="Progesterone"
            stroke={HORMONE_COLORS.progesterone}
            strokeOpacity={0.4}
            fill={`url(#${phaseType}Progesterone)`}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Area
            type="basis"
            dataKey="fsh"
            name="FSH"
            stroke={HORMONE_COLORS.fsh}
            strokeOpacity={0.4}
            fill={`url(#${phaseType}FSH)`}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Area
            type="basis"
            dataKey="lh"
            name="LH"
            stroke={HORMONE_COLORS.lh}
            strokeOpacity={0.4}
            fill={`url(#${phaseType}LH)`}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
};

export const HormoneCycleChart: React.FC = () => {
  const [isLogPeriodOpen, setIsLogPeriodOpen] = React.useState(false);
  const [periodRange, setPeriodRange] = React.useState<DateRange | undefined>();

  const hormoneData = generateHormoneData();
  const currentDay = 20;
  const daysUntilPeriod = 8;
  const currentDate = new Date(2026, 0, 20); // Friday Jan 20

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  const handleLogPeriod = async () => {
    if (!periodRange?.from) return;

    // If only one date selected, use the same date for start and end
    const startDate = periodRange.from;
    const endDate = periodRange.to || periodRange.from;

    console.log('Logging period:', {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });

    // TODO: Make API call to log period
    // await api.post('/api/periods', { startDate, endDate });

    // Close modal and reset
    setIsLogPeriodOpen(false);
    setPeriodRange(undefined);
  };

  // Split data for two separate containers
  const follicularData = hormoneData.slice(0, 14); // Days 1-14
  const lutealData = hormoneData.slice(13); // Days 14-28 (overlap day 14 for continuity)

  return (
    <div className="w-full max-w-[1336px] bg-gradient-to-b from-muted to-background border border-border p-3 rounded-2xl shadow-[1px_1px_24px_0px_rgba(69,66,58,0.04)]">
      <div className="bg-background border border-border rounded-xl py-6 w-full">
        <div className="flex flex-col gap-6 w-full">
          {/* Header */}
          <div className="flex items-start justify-between px-6 w-full">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold leading-7 font-['Petrona'] text-foreground">
                Today is {formatDate(currentDate)}
              </h2>
              <div className="flex gap-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg">
                  <span className="font-manrope text-xs font-normal leading-4 text-[#696863]">Cycle Day</span>
                  <span className="font-petrona text-2xl font-semibold leading-7 text-[#3D3826]">{currentDay}</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg">
                  <span className="font-manrope text-xs font-normal leading-4 text-[#696863]">Next Period in</span>
                  <span className="font-petrona text-2xl font-semibold leading-7 text-[#3D3826]">{daysUntilPeriod} Days</span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setIsLogPeriodOpen(true)}
              className="flex items-center justify-center gap-2 h-10 px-6 py-2.5 bg-[#45423a] text-background text-base font-medium leading-6 rounded-lg shadow-[inset_0px_2px_3px_0px_#3d3826] hover:bg-[#45423a]/90"
            >
              <CalendarDays className="h-4 w-4" />
              Log Period
            </Button>
          </div>

          {/* Phase Charts Container */}
          <div className="flex flex-col gap-2 w-full">
            <div className="relative flex gap-2 px-3 w-full">
              {/* Follicular Phase Container */}
              <div className="relative w-1/2 border border-border rounded-lg bg-background overflow-hidden">
                {/* Follicular Phase Header */}
                <div className="flex h-7 border-b border-border bg-background relative z-10">
                  {/* Menstruation */}
                  <div className="w-[26%] bg-[rgba(78,109,128,0.6)] px-2 py-1.5 flex items-center justify-center gap-1.5 rounded-tl-lg">
                    <Snowflake className="w-3.5 h-3.5 text-[#29271b] flex-shrink-0" />
                    <span className="text-xs font-medium text-[#29271b] whitespace-nowrap">Menstruation</span>
                  </div>

                  {/* Follicular Phase */}
                  <div className="flex-1 flex items-center justify-center px-2.5 py-1.5">
                    <div className="flex items-center gap-2">
                      <Sprout className="w-4 h-4 flex-shrink-0" />
                      <span className="font-manrope text-sm font-medium leading-5 text-[#45423A]">Follicular Phase</span>
                      <Badge variant="secondary" className="font-manrope text-xs font-normal h-5 px-2 bg-[#F3F0E7] hover:bg-[#F3F0E7] text-[#45423A] border-0">
                        12-14 Days
                      </Badge>
                    </div>
                  </div>

                  {/* Ovulation */}
                  <div className="w-[17%] bg-[rgba(217,119,6,0.7)] px-2 py-1.5 flex items-center justify-center gap-1.5 border-l border-dashed border-[rgba(217,119,6,0.2)] rounded-tr-lg">
                    <Sun className="w-3.5 h-3.5 text-[#29271b] flex-shrink-0" />
                    <span className="text-xs font-medium text-[#29271b] whitespace-nowrap">Ovulation</span>
                  </div>
                </div>

                {/* Follicular Phase Chart */}
                <PhaseChart data={follicularData} phaseType="follicular" />

                {/* Menstruation Overlay */}
                <div className="absolute left-0 top-7 bottom-0 w-[26%] bg-[rgba(78,109,128,0.1)] rounded-bl-lg">
                  <svg className="absolute right-0 top-0 h-full w-[1px]" preserveAspectRatio="none">
                    <line x1="0" y1="0" x2="0" y2="100%" stroke="rgba(78,109,128,0.2)" strokeWidth="1" strokeDasharray="8 8" vectorEffect="non-scaling-stroke" />
                  </svg>
                  <Badge variant="secondary" className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 font-manrope text-xs font-normal h-auto py-1 px-2 bg-[#4E6D80] hover:bg-[#4E6D80] text-white backdrop-blur-sm border-0 whitespace-nowrap">
                    3-7 Days
                  </Badge>
                </div>

                {/* Ovulation Overlay */}
                <div className="absolute right-0 top-7 bottom-0 w-[17%] bg-[rgba(227,146,25,0.1)] rounded-br-lg">
                  <svg className="absolute left-0 top-0 h-full w-[1px]" preserveAspectRatio="none">
                    <line x1="0" y1="0" x2="0" y2="100%" stroke="rgba(217,119,6,0.2)" strokeWidth="1" strokeDasharray="8 8" vectorEffect="non-scaling-stroke" />
                  </svg>
                  <Badge variant="secondary" className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 font-manrope text-xs font-normal h-auto py-1 px-2 bg-[#D97706] hover:bg-[#D97706] text-white backdrop-blur-sm border-0 whitespace-nowrap">
                    1-2 Days
                  </Badge>
                </div>
              </div>

              {/* Luteal Phase Container */}
              <div className="relative w-1/2 border border-border rounded-lg bg-background overflow-hidden">
                {/* Luteal Phase Header */}
                <div className="flex h-7 border-b border-border bg-background relative z-10">
                  <div className="w-full flex items-center justify-center px-2.5 py-1.5">
                    <div className="flex items-center gap-2">
                      <Leaf className="w-4 h-4 flex-shrink-0" />
                      <span className="font-manrope text-sm font-medium leading-5 text-[#45423A]">Luteal Phase</span>
                      <Badge variant="secondary" className="font-manrope text-xs font-normal h-5 px-2 bg-[#F3F0E7] hover:bg-[#F3F0E7] text-[#45423A] border-0">
                        12-14 Days
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Luteal Phase Chart */}
                <PhaseChart data={lutealData} phaseType="luteal" />
              </div>
            </div>

            {/* Cycle Days */}
            <div className="flex items-center justify-between px-3 w-full">
              {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                <div
                  key={day}
                  className={cn(
                    "flex-1 flex items-center justify-center text-xs font-normal leading-4 text-[#696863] text-center",
                    day === currentDay && "bg-card rounded-xl"
                  )}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: HORMONE_COLORS.estrogen }} />
                <span className="text-xs leading-4">Estrogen</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: HORMONE_COLORS.progesterone }} />
                <span className="text-xs leading-4">Progesterone</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: HORMONE_COLORS.fsh }} />
                <span className="text-xs leading-4">FSH (Follicle Stimulating Hormone)</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: HORMONE_COLORS.lh }} />
                <span className="text-xs leading-4">LH (Luteinizing Hormone)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Log Period Dialog */}
      <Dialog open={isLogPeriodOpen} onOpenChange={setIsLogPeriodOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Log Period</DialogTitle>
            <DialogDescription>
              Select the date your period started. You can also select a range if it has already ended.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 flex flex-col items-center">
            <Calendar
              mode="range"
              selected={periodRange}
              onSelect={setPeriodRange}
              disabled={{ after: new Date() }}
              className="rounded-md border"
            />
            {periodRange?.from && (
              <div className="mt-4 p-3 bg-muted rounded-lg text-sm w-full">
                <strong>Selected Period:</strong>{' '}
                {periodRange.from.toLocaleDateString()}
                {periodRange.to && periodRange.to.getTime() !== periodRange.from.getTime() && (
                  <> - {periodRange.to.toLocaleDateString()}</>
                )}
                {!periodRange.to && (
                  <span className="text-muted-foreground"> (single day)</span>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogPeriodOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleLogPeriod}
              disabled={!periodRange?.from}
            >
              Log Period
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HormoneCycleChart;
