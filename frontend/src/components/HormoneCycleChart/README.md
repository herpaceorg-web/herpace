# HormoneCycleChart Component

A comprehensive React component for visualizing hormone levels throughout the menstrual cycle, designed for the HerPace app.

## Installation

First, install the required dependency:

```bash
npm install recharts
# or
yarn add recharts
# or
pnpm add recharts
```

## Usage

```tsx
import { HormoneCycleChart } from "@/components/HormoneCycleChart";

function MyPage() {
  const handleLogPeriod = () => {
    // Handle period logging
    console.log("Log period clicked");
  };

  // Generate or fetch hormone data for 28 days
  const hormoneData = Array.from({ length: 28 }, (_, i) => ({
    day: i + 1,
    estrogen: /* calculate estrogen level */,
    progesterone: /* calculate progesterone level */,
    fsh: /* calculate FSH level */,
    lh: /* calculate LH level */,
  }));

  return (
    <HormoneCycleChart
      currentDate={new Date()}
      cycleDay={14}
      daysUntilNextPeriod={14}
      hormoneData={hormoneData}
      onLogPeriod={handleLogPeriod}
    />
  );
}
```

## Props

### HormoneCycleChartProps

| Prop | Type | Description |
|------|------|-------------|
| `currentDate` | `Date` | The current date to display at the top of the chart |
| `cycleDay` | `number` | Current day in the menstrual cycle (1-28) |
| `daysUntilNextPeriod` | `number` | Number of days until the next period |
| `hormoneData` | `HormoneDataPoint[]` | Array of hormone data points for the entire cycle |
| `onLogPeriod` | `() => void` | Callback function when the "Log Period" button is clicked |

### HormoneDataPoint

```typescript
{
  day: number;          // Day of the cycle (1-28)
  estrogen: number;     // Estrogen level (0-100)
  progesterone: number; // Progesterone level (0-100)
  fsh: number;          // FSH level (0-100)
  lh: number;           // LH level (0-100)
}
```

## Features

### 1. Cycle Information Display
- Shows the current date
- Displays the current cycle day in a prominent box
- Shows days until next period
- Includes a "Log Period" button with book icon

### 2. Four Cycle Phases
- **Menstruation** (Days 1-5): Light red background
- **Follicular Phase** (Days 6-13): Light yellow background
- **Ovulation** (Days 14-16): Light green background
- **Luteal Phase** (Days 17-28): Light blue background

Each phase displays its average duration.

### 3. Hormone Visualization
Four hormone curves are displayed:
- **Estrogen** (Yellow/Gold): Peaks before ovulation
- **Progesterone** (Red/Brown): Peaks in luteal phase
- **FSH** (Olive/Green): Follicle Stimulating Hormone
- **LH** (Blue): Luteinizing Hormone, spikes at ovulation

### 4. Interactive Features
- Hover tooltips showing exact hormone levels for each day
- Responsive design that adapts to different screen sizes
- Legend at the bottom identifying each hormone

## Styling

The component uses:
- **Tailwind CSS** for utility styling
- **ShadCN UI** components (Card, Button) for consistent design
- **Her Pace Design System** tokens defined in `index.css`
- **Lucide React** icons

## Storybook

View the component in Storybook with various cycle phases:

```bash
npm run storybook
```

Stories available:
- Default (Ovulation phase)
- Menstruation Phase
- Follicular Phase
- Ovulation Phase
- Luteal Phase
- End of Cycle
- Custom Date

## Customization

### Adjusting Phase Colors

Edit the `CYCLE_PHASES` array in `HormoneCycleChart.tsx`:

```tsx
const CYCLE_PHASES: CyclePhase[] = [
  {
    name: "Menstruation",
    startDay: 1,
    endDay: 5,
    color: "rgba(252, 165, 165, 0.15)", // Customize this
    avgLength: "3-7 Days",
  },
  // ... other phases
];
```

### Adjusting Hormone Colors

Edit the `HORMONE_COLORS` object:

```tsx
const HORMONE_COLORS = {
  estrogen: "#EAB308",
  progesterone: "#DC2626",
  fsh: "#65A30D",
  lh: "#3B82F6",
};
```

## Accessibility

- Uses semantic HTML elements
- Includes ARIA labels where appropriate
- Keyboard navigable button
- Sufficient color contrast ratios

## Dependencies

- `react` ^18.3.1
- `recharts` (needs to be installed)
- `lucide-react` ^0.344.0
- `@/components/ui/button` (ShadCN)
- `@/components/ui/card` (ShadCN)

## License

Part of the HerPace application.
