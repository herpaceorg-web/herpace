import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

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
      day <= 5 ? 20 + day * 2 :
      day <= 13 ? 30 + (day - 5) * 8 :
      day === 14 ? 120 :
      day <= 16 ? 100 - (day - 14) * 15 :
      day <= 22 ? 70 + (day - 16) * 3 :
      85 - (day - 22) * 10;

    // Progesterone: Very low until ovulation, then rises significantly in luteal phase
    const progesterone =
      day <= 14 ? 10 + Math.random() * 5 :
      day <= 21 ? 15 + (day - 14) * 12 :
      95 - (day - 21) * 10;

    // FSH: Peak early follicular phase, smaller peak around ovulation
    const fsh =
      day <= 3 ? 40 + day * 15 :
      day <= 7 ? 85 - (day - 3) * 10 :
      day <= 12 ? 35 + (day - 7) * 3 :
      day === 13 ? 55 :
      day === 14 ? 52 :
      day <= 28 ? 50 - (day - 14) * 2 :
      20;

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
  estrogen: "#efa910",
  progesterone: "#b55a2d",
  fsh: "#677344",
  lh: "#597d93",
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
              <stop offset="5%" stopColor={HORMONE_COLORS.estrogen} stopOpacity={0.2} />
              <stop offset="95%" stopColor={HORMONE_COLORS.estrogen} stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id={`${phaseType}Progesterone`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={HORMONE_COLORS.progesterone} stopOpacity={0.2} />
              <stop offset="95%" stopColor={HORMONE_COLORS.progesterone} stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id={`${phaseType}FSH`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={HORMONE_COLORS.fsh} stopOpacity={0.2} />
              <stop offset="95%" stopColor={HORMONE_COLORS.fsh} stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id={`${phaseType}LH`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={HORMONE_COLORS.lh} stopOpacity={0.2} />
              <stop offset="95%" stopColor={HORMONE_COLORS.lh} stopOpacity={0.01} />
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
            type="natural"
            dataKey="estrogen"
            name="Estrogen"
            stroke={HORMONE_COLORS.estrogen}
            fill={`url(#${phaseType}Estrogen)`}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Area
            type="natural"
            dataKey="progesterone"
            name="Progesterone"
            stroke={HORMONE_COLORS.progesterone}
            fill={`url(#${phaseType}Progesterone)`}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Area
            type="natural"
            dataKey="fsh"
            name="FSH"
            stroke={HORMONE_COLORS.fsh}
            fill={`url(#${phaseType}FSH)`}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Area
            type="natural"
            dataKey="lh"
            name="LH"
            stroke={HORMONE_COLORS.lh}
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

  // Split data for the two phases
  const follicularData = hormoneData.slice(0, 14);
  const lutealData = hormoneData.slice(14, 28);

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
                  <span className="text-xs font-medium leading-4 text-[#696863]">Cycle Day</span>
                  <span className="text-2xl font-semibold leading-7 font-['Petrona']">{currentDay}</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg">
                  <span className="text-xs font-medium leading-4 text-[#696863]">Next Period in</span>
                  <span className="text-2xl font-semibold leading-7 font-['Petrona']">{daysUntilPeriod} Days</span>
                </div>
              </div>
            </div>
            <button
              className="flex items-center justify-center gap-2 h-10 px-6 py-2.5 bg-[#45423a] text-background text-base font-medium leading-6 rounded-lg shadow-[inset_0px_2px_3px_0px_#3d3826]"
            >
              <CalendarDays className="h-4 w-4" />
              Log Period
            </button>
          </div>

          {/* Phase Charts Container */}
          <div className="flex flex-col gap-2 w-full">
            <div className="flex gap-2 px-3 w-full">
              {/* Follicular Phase */}
              <div className="relative flex-1 border border-border rounded-lg bg-background overflow-hidden">
                {/* Phase Header */}
                <div className="flex items-center justify-center gap-2 h-7 px-2.5 py-1.5 border-b border-border bg-background">
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2v12M4 6l4-4 4 4M4 10l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-sm font-medium leading-5">Follicular Phase</span>
                  <div className="ml-auto bg-muted px-2 py-0.5 rounded-md">
                    <span className="text-xs font-normal leading-4 whitespace-nowrap">Avg. Length 12 - 14 Days</span>
                  </div>
                </div>

                {/* Chart */}
                <PhaseChart data={follicularData} phaseType="follicular" />

                {/* Menstruation Overlay */}
                <div className="absolute left-0 top-0 bottom-0 w-[23.7%] bg-[rgba(78,109,128,0.1)] border-r border-dashed border-[rgba(78,109,128,0.2)] rounded-l-lg overflow-hidden">
                  <div className="flex items-center justify-center gap-1 h-7 px-1 py-1.5 border-b border-dashed border-[rgba(78,109,128,0.2)] bg-[rgba(78,109,128,0.6)]">
                    <svg className="w-4 h-4 text-[#29271b]" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 2l1 4h4l-3 3 1 4-3-2-3 2 1-4-3-3h4l1-4z"/>
                    </svg>
                    <span className="text-xs font-medium leading-4 text-[#29271b]">Menstruation</span>
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 top-[50%] bg-[rgba(78,109,128,0.2)] px-2 py-0.5 rounded-md backdrop-blur-sm">
                    <span className="text-xs font-normal leading-4">3 - 7 Days</span>
                  </div>
                </div>

                {/* Ovulation Overlay */}
                <div className="absolute right-0 top-0 bottom-0 w-[14%] bg-[rgba(227,146,25,0.1)] border-l border-dashed border-[rgba(217,119,6,0.2)] rounded-r-lg overflow-hidden">
                  <div className="flex items-center justify-center gap-1 h-7 px-1 py-1.5 border-b border-dashed border-[rgba(217,119,6,0.2)] bg-[rgba(217,119,6,0.7)]">
                    <svg className="w-4 h-4 text-[#29271b]" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 2l2 6 6-2-6 2-2 6-2-6-6 2 6-2 2-6z"/>
                    </svg>
                    <span className="text-xs font-medium leading-4 text-[#29271b] whitespace-nowrap">Ovulation</span>
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 top-[50%] bg-[rgba(217,119,6,0.2)] px-2 py-0.5 rounded-md backdrop-blur-sm">
                    <span className="text-xs font-normal leading-4 whitespace-nowrap">1 - 2 Days</span>
                  </div>
                </div>
              </div>

              {/* Luteal Phase */}
              <div className="relative flex-1 border border-border rounded-lg bg-background overflow-hidden">
                {/* Phase Header */}
                <div className="flex items-center justify-center gap-2 h-7 px-2.5 py-1.5 border-b border-border bg-background">
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span className="text-sm font-medium leading-5">Luteal Phase</span>
                  <div className="ml-auto bg-muted px-2 py-0.5 rounded-md">
                    <span className="text-xs font-normal leading-4 whitespace-nowrap">Avg. Length 12 - 14 Days</span>
                  </div>
                </div>

                {/* Chart */}
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
    </div>
  );
};

export default HormoneCycleChart;
