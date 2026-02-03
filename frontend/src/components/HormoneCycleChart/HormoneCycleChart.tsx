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
import { CyclePhase } from "@/types/api";
import { CYCLE_PHASE_COLORS } from "@/utils/cyclePhases";

/** Convert a phase badge hex (#RRGGBB) to rgba at a given opacity */
function phaseColorAt(phase: CyclePhase, opacity: number): string {
  const hex = CYCLE_PHASE_COLORS[phase].badge;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

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

export interface HormoneCycleChartProps {
  currentDate: Date;
  currentDay: number;
  cycleLength: number;
  daysUntilNextPeriod: number;
  onLogPeriod: () => void;
}

export const HormoneCycleChart: React.FC<HormoneCycleChartProps> = ({
  currentDate,
  currentDay,
  cycleLength,
  daysUntilNextPeriod,
  onLogPeriod,
}) => {
  const hormoneData = generateHormoneData();

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
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
                  <span className="font-petrona text-2xl font-semibold leading-7 text-[#3D3826]">{daysUntilNextPeriod} Days</span>
                </div>
              </div>
            </div>
            <button
              className="flex items-center justify-center gap-2 h-10 px-6 py-2.5 bg-[#45423a] text-background text-base font-medium leading-6 rounded-lg shadow-[inset_0px_2px_3px_0px_#3d3826]"
              onClick={onLogPeriod}
            >
              <CalendarDays className="h-4 w-4" />
              Log Period
            </button>
          </div>

          {/* Phase Charts Container */}
          <div className="flex flex-col gap-2 w-full">
            <div className="relative flex gap-2 px-3 w-full">
              {/* Follicular Phase Container */}
              <div className="relative w-1/2 border border-border rounded-lg bg-background overflow-hidden">
                {/* Follicular Phase Header */}
                <div className="flex h-7 border-b border-border bg-background relative z-10">
                  {/* Menstruation */}
                  <div className="w-[26%] px-2 py-1.5 flex items-center justify-center gap-1.5 rounded-tl-lg" style={{ backgroundColor: phaseColorAt(CyclePhase.Menstrual, 0.6) }}>
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
                  <div className="w-[17%] px-2 py-1.5 flex items-center justify-center gap-1.5 border-l border-dashed rounded-tr-lg" style={{ backgroundColor: phaseColorAt(CyclePhase.Ovulatory, 0.7), borderColor: phaseColorAt(CyclePhase.Ovulatory, 0.2) }}>
                    <Sun className="w-3.5 h-3.5 text-[#29271b] flex-shrink-0" />
                    <span className="text-xs font-medium text-[#29271b] whitespace-nowrap">Ovulation</span>
                  </div>
                </div>

                {/* Follicular Phase Chart */}
                <PhaseChart data={follicularData} phaseType="follicular" />

                {/* Menstruation Overlay */}
                <div className="absolute left-0 top-7 bottom-0 w-[26%] rounded-bl-lg" style={{ backgroundColor: phaseColorAt(CyclePhase.Menstrual, 0.1) }}>
                  <svg className="absolute right-0 top-0 h-full w-[1px]" preserveAspectRatio="none">
                    <line x1="0" y1="0" x2="0" y2="100%" stroke={phaseColorAt(CyclePhase.Menstrual, 0.2)} strokeWidth="1" strokeDasharray="8 8" vectorEffect="non-scaling-stroke" />
                  </svg>
                  <Badge variant="secondary" className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 font-manrope text-xs font-normal h-auto py-1 px-2 text-white backdrop-blur-sm border-0 whitespace-nowrap" style={{ backgroundColor: CYCLE_PHASE_COLORS[CyclePhase.Menstrual].badge }}>
                    3-7 Days
                  </Badge>
                </div>

                {/* Follicular Overlay */}
                <div className="absolute top-7 bottom-0" style={{ left: '26%', right: '17%', backgroundColor: phaseColorAt(CyclePhase.Follicular, 0.1) }} />

                {/* Ovulation Overlay */}
                <div className="absolute right-0 top-7 bottom-0 w-[17%] rounded-br-lg" style={{ backgroundColor: phaseColorAt(CyclePhase.Ovulatory, 0.1) }}>
                  <svg className="absolute left-0 top-0 h-full w-[1px]" preserveAspectRatio="none">
                    <line x1="0" y1="0" x2="0" y2="100%" stroke={phaseColorAt(CyclePhase.Ovulatory, 0.2)} strokeWidth="1" strokeDasharray="8 8" vectorEffect="non-scaling-stroke" />
                  </svg>
                  <Badge variant="secondary" className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 font-manrope text-xs font-normal h-auto py-1 px-2 text-white backdrop-blur-sm border-0 whitespace-nowrap" style={{ backgroundColor: CYCLE_PHASE_COLORS[CyclePhase.Ovulatory].badge }}>
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

                {/* Luteal Overlay */}
                <div className="absolute left-0 top-7 bottom-0 right-0" style={{ backgroundColor: phaseColorAt(CyclePhase.Luteal, 0.1) }} />
              </div>
            </div>

            {/* Cycle Days */}
            <div className="flex items-center justify-between px-3 w-full">
              {Array.from({ length: cycleLength }, (_, i) => i + 1).map((day) => (
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
