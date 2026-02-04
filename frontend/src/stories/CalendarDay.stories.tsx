import type { Meta, StoryObj } from '@storybook/react-vite';
import { CalendarDay } from '@/components/calendar/CalendarDay';
import { IntensityLevel, WorkoutType, CyclePhase } from '@/types/api';

const meta = {
  title: 'Components/CalendarDay',
  component: CalendarDay,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CalendarDay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EasyRun: Story = {
  args: {
    dayNumber: 1,
    sessionName: '30 Minute Easy Run',
    distance: 3.0,
    durationMinutes: 40,
    intensityLevel: IntensityLevel.Low,
    workoutType: WorkoutType.Easy,
    zone: 'Zone 2-5',
    rpe: 'RPE 2-6',
  },
  parameters: {
    docs: {
      description: {
        story: 'Calendar day showing an easy run session with low intensity (1 heart).',
      },
    },
  },
};

export const TempoRun: Story = {
  args: {
    dayNumber: 5,
    sessionName: 'Tempo Run',
    distance: 8.0,
    durationMinutes: 60,
    intensityLevel: IntensityLevel.Moderate,
    workoutType: WorkoutType.Tempo,
    zone: 'Zone 3-4',
    rpe: 'RPE 5-7',
  },
  parameters: {
    docs: {
      description: {
        story: 'Calendar day showing a tempo run with moderate intensity (2 hearts).',
      },
    },
  },
};

export const IntervalTraining: Story = {
  args: {
    dayNumber: 10,
    sessionName: 'Interval Training',
    distance: 6.0,
    durationMinutes: 50,
    intensityLevel: IntensityLevel.High,
    workoutType: WorkoutType.Interval,
    zone: 'Zone 4-5',
    rpe: 'RPE 7-9',
  },
  parameters: {
    docs: {
      description: {
        story: 'Calendar day showing interval training with high intensity (3 hearts).',
      },
    },
  },
};

export const LongRun: Story = {
  args: {
    dayNumber: 15,
    sessionName: 'Long Run',
    distance: 16.0,
    durationMinutes: 120,
    intensityLevel: IntensityLevel.Moderate,
    workoutType: WorkoutType.Long,
    zone: 'Zone 2-3',
    rpe: 'RPE 3-5',
  },
  parameters: {
    docs: {
      description: {
        story: 'Calendar day showing a long run session.',
      },
    },
  },
};

export const RestDay: Story = {
  args: {
    dayNumber: 7,
    isRest: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Calendar day showing a rest day with no session.',
      },
    },
  },
};

export const NoSession: Story = {
  args: {
    dayNumber: 20,
  },
  parameters: {
    docs: {
      description: {
        story: 'Calendar day with no scheduled session.',
      },
    },
  },
};

export const FollicularPhase: Story = {
  args: {
    dayNumber: 8,
    sessionName: 'Easy Run',
    distance: 5.0,
    durationMinutes: 45,
    intensityLevel: IntensityLevel.Low,
    cyclePhase: CyclePhase.Follicular,
    zone: 'Zone 2',
    rpe: 'RPE 3-4',
  },
  parameters: {
    docs: {
      description: {
        story: 'Calendar day during follicular phase (Sprout icon).',
      },
    },
  },
};

export const OvulatoryPhase: Story = {
  args: {
    dayNumber: 14,
    sessionName: 'Interval Training',
    distance: 6.0,
    durationMinutes: 50,
    intensityLevel: IntensityLevel.High,
    cyclePhase: CyclePhase.Ovulatory,
    zone: 'Zone 4-5',
    rpe: 'RPE 7-9',
  },
  parameters: {
    docs: {
      description: {
        story: 'Calendar day during ovulatory phase (Sun icon).',
      },
    },
  },
};

export const LutealPhase: Story = {
  args: {
    dayNumber: 21,
    sessionName: 'Tempo Run',
    distance: 8.0,
    durationMinutes: 60,
    intensityLevel: IntensityLevel.Moderate,
    cyclePhase: CyclePhase.Luteal,
    zone: 'Zone 3-4',
    rpe: 'RPE 5-7',
  },
  parameters: {
    docs: {
      description: {
        story: 'Calendar day during luteal phase (Leaf icon).',
      },
    },
  },
};

export const MenstrualPhase: Story = {
  args: {
    dayNumber: 2,
    sessionName: 'Easy Recovery Run',
    distance: 3.0,
    durationMinutes: 30,
    intensityLevel: IntensityLevel.Low,
    cyclePhase: CyclePhase.Menstrual,
    zone: 'Zone 1-2',
    rpe: 'RPE 2-3',
  },
  parameters: {
    docs: {
      description: {
        story: 'Calendar day during menstrual phase (Snowflake icon).',
      },
    },
  },
};

export const CalendarWeekView: Story = {
  args: {},
  render: () => {
    const weekSessions = [
      {
        dayNumber: 1,
        sessionName: 'Easy Run',
        distance: 5.0,
        durationMinutes: 45,
        intensityLevel: IntensityLevel.Low,
        zone: 'Zone 2',
        rpe: 'RPE 3-4',
      },
      {
        dayNumber: 2,
        sessionName: 'Tempo Run',
        distance: 8.0,
        durationMinutes: 60,
        intensityLevel: IntensityLevel.Moderate,
        zone: 'Zone 3-4',
        rpe: 'RPE 5-7',
      },
      {
        dayNumber: 3,
        isRest: true,
      },
      {
        dayNumber: 4,
        sessionName: 'Interval Training',
        distance: 6.0,
        durationMinutes: 50,
        intensityLevel: IntensityLevel.High,
        zone: 'Zone 4-5',
        rpe: 'RPE 7-9',
      },
      {
        dayNumber: 5,
        sessionName: 'Easy Run',
        distance: 4.0,
        durationMinutes: 35,
        intensityLevel: IntensityLevel.Low,
        zone: 'Zone 2',
        rpe: 'RPE 2-4',
      },
      {
        dayNumber: 6,
        sessionName: 'Long Run',
        distance: 14.0,
        durationMinutes: 105,
        intensityLevel: IntensityLevel.Moderate,
        zone: 'Zone 2-3',
        rpe: 'RPE 4-6',
      },
      {
        dayNumber: 7,
        isRest: true,
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {weekSessions.map((session, index) => (
          <CalendarDay key={index} {...session} />
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Example of a week view showing multiple calendar days in a grid layout, demonstrating how they would appear on a training calendar.',
      },
    },
    layout: 'fullscreen',
  },
};

export const UseCases: Story = {
  args: {},
  render: () => (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 font-petrona">Calendar Day Component</h1>
        <p className="text-muted-foreground">
          Individual day component for the training calendar showing session details
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold font-petrona">Features</h3>

          <div className="border rounded-lg p-4 bg-card">
            <h4 className="font-medium mb-2">Day Number with Icon</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Shows the day number with a sprout icon
            </p>
            <ul className="text-xs space-y-1">
              <li>• Large, readable day number</li>
              <li>• Decorative sprout icon</li>
              <li>• Uses Petrona font for elegance</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4 bg-card">
            <h4 className="font-medium mb-2">Session Information</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Displays key workout details at a glance
            </p>
            <ul className="text-xs space-y-1">
              <li>• Session name/title</li>
              <li>• Distance badge with icon</li>
              <li>• Duration badge with icon</li>
              <li>• Zone/RPE information</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4 bg-card">
            <h4 className="font-medium mb-2">Intensity Rating</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Heart-based visual intensity indicator (max 3 hearts)
            </p>
            <ul className="text-xs space-y-1">
              <li>• Low: 1 heart</li>
              <li>• Moderate: 2 hearts</li>
              <li>• High: 3 hearts</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold font-petrona">Usage</h3>

          <div className="border rounded-lg p-4 bg-card">
            <h4 className="font-medium mb-2">Component Props</h4>
            <div className="mt-3 space-y-2 text-xs">
              <div>
                <code className="bg-muted px-1.5 py-0.5 rounded">dayNumber</code>
                <span className="text-muted-foreground ml-2">: number</span>
              </div>
              <div>
                <code className="bg-muted px-1.5 py-0.5 rounded">sessionName</code>
                <span className="text-muted-foreground ml-2">?: string</span>
              </div>
              <div>
                <code className="bg-muted px-1.5 py-0.5 rounded">distance</code>
                <span className="text-muted-foreground ml-2">?: number</span>
              </div>
              <div>
                <code className="bg-muted px-1.5 py-0.5 rounded">durationMinutes</code>
                <span className="text-muted-foreground ml-2">?: number</span>
              </div>
              <div>
                <code className="bg-muted px-1.5 py-0.5 rounded">intensityLevel</code>
                <span className="text-muted-foreground ml-2">?: IntensityLevel</span>
              </div>
              <div>
                <code className="bg-muted px-1.5 py-0.5 rounded">zone</code>
                <span className="text-muted-foreground ml-2">?: string</span>
              </div>
              <div>
                <code className="bg-muted px-1.5 py-0.5 rounded">rpe</code>
                <span className="text-muted-foreground ml-2">?: string</span>
              </div>
              <div>
                <code className="bg-muted px-1.5 py-0.5 rounded">isRest</code>
                <span className="text-muted-foreground ml-2">?: boolean</span>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-card">
            <h4 className="font-medium mb-2">Integration</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Use in calendar views or session lists
            </p>
            <ul className="text-xs space-y-1">
              <li>• Grid layout for month view</li>
              <li>• List layout for week view</li>
              <li>• Responsive design</li>
              <li>• Matches design system tokens</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4 bg-card">
            <h4 className="font-medium mb-2">States</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Different display modes
            </p>
            <ul className="text-xs space-y-1">
              <li>• With session: Shows full details</li>
              <li>• Rest day: Shows "Rest Day" message</li>
              <li>• No session: Shows only day number</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 border border-primary/20 rounded-lg bg-primary/5">
        <h3 className="font-semibold text-lg mb-3">Design Notes</h3>
        <ul className="space-y-2 text-sm">
          <li>✓ Based on Her Pace Figma design system</li>
          <li>✓ Uses design tokens for colors, spacing, and typography</li>
          <li>✓ Lucide React icons for consistency</li>
          <li>✓ Responsive and accessible</li>
          <li>✓ Muted background to distinguish from page background</li>
          <li>✓ Badge style matches design system</li>
        </ul>
      </div>
    </div>
  ),
};
