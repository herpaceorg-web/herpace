import type { Meta, StoryObj } from '@storybook/react-vite'
import { WorkoutSessionCard } from '@/components/session/WorkoutSessionCard'
import { Snowflake, Sun, Leaf, Sprout } from 'lucide-react'

const meta = {
  title: 'Components/Session/WorkoutSessionCard',
  component: WorkoutSessionCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WorkoutSessionCard>

export default meta
type Story = StoryObj<typeof meta>

// Story that matches the Figma design exactly
export const FigmaDesign: Story = {
  args: {
    sessionName: '30 Minute Easy Run',
    distance: 3.0,
    distanceUnit: 'mi',
    durationMinutes: 40,
    zone: 'Zone 2-5 / RPE 2-6',
    cyclePhases: [
      {
        phaseName: 'Follicular Phase Day 1',
        icon: <Sprout className="h-4 w-4" />,
      },
      {
        phaseName: 'Menstruation Day 1',
        icon: <Snowflake className="h-4 w-4" />,
      },
    ],
    sessionProgress: 'Session 5/15 This Phase',
    warmupContent: {
      props: {
        steps: [
          {
            number: 1,
            title: 'Walk',
            duration: 5,
            instructions: [
              'Start slowly and ease into the movement. Focus on deep breathing and body awareness.',
            ],
          },
          {
            number: 2,
            title: 'Dynamic Stretches',
            duration: 3,
            instructions: [
              'Leg swings: 10 each leg',
              'Hip circles: 5 each direction',
              'Ankle rolls: 10 each ankle',
            ],
          },
          {
            number: 3,
            title: 'Light Jog',
            duration: 2,
            instructions: ['Very easy pace, zone 1 - 2.'],
          },
        ],
      },
    },
    sessionContent: {
      heading: 'Session',
      steps: [
        {
          number: 1,
          title: 'Easy Pace Run',
          duration: 30,
          instructions: [
            'Maintain a conversational pace throughout the run',
            'Focus on consistent breathing and good running form',
            'Keep your heart rate in Zone 2-3 (comfortable aerobic pace)',
          ],
        },
      ],
    },
  },
}

export const Default: Story = {
  args: {
    sessionName: '30 Minute Easy Run',
    distance: 5,
    distanceUnit: 'km',
    durationMinutes: 30,
    zone: 'Zone 2-5 / RPE 2-6',
    cyclePhases: [
      {
        phaseName: 'Follicular Phase Day 1',
        icon: <Sprout className="h-4 w-4" />,
      },
    ],
    sessionProgress: 'Session 5/15 This Phase',
    sessionContent: {
      heading: 'Easy Run Instructions',
      steps: [
        {
          number: 1,
          title: 'Easy Pace Run',
          duration: 30,
          instructions: [
            'Maintain a conversational pace throughout the run',
            'Focus on consistent breathing and good running form',
            'Keep your heart rate in Zone 2-3 (comfortable aerobic pace)',
            'You should be able to hold a conversation without gasping for breath',
          ],
        },
      ],
    },
  },
}

export const WithoutPhaseTracking: Story = {
  args: {
    sessionName: '45 Minute Tempo Run',
    distance: 8,
    distanceUnit: 'km',
    durationMinutes: 45,
    zone: 'Zone 3-4 / RPE 5-7',
    sessionContent: {
      heading: 'Tempo Run Instructions',
      steps: [
        {
          number: 1,
          title: 'Warm Up',
          duration: 10,
          instructions: [
            'Start with easy jogging to gradually increase heart rate',
            'Include 3-4 dynamic stretches (leg swings, high knees)',
          ],
        },
        {
          number: 2,
          title: 'Tempo Effort',
          duration: 25,
          instructions: [
            'Run at a comfortably hard pace - you should be able to speak in short phrases',
            'Maintain steady effort, avoid surging or slowing',
            'Focus on breathing rhythm and relaxed shoulders',
          ],
        },
        {
          number: 3,
          title: 'Cool Down',
          duration: 10,
          instructions: [
            'Gradually slow to easy jogging pace',
            'Focus on bringing heart rate down gradually',
          ],
        },
      ],
    },
  },
}

export const IntervalWorkout: Story = {
  args: {
    sessionName: 'Speed Intervals - 400m Repeats',
    distance: 6,
    distanceUnit: 'km',
    durationMinutes: 40,
    zone: 'Zone 4-5 / RPE 7-9',
    cyclePhases: [
      {
        phaseName: 'Ovulatory Phase Day 2',
        icon: <Sun className="h-4 w-4" />,
      },
    ],
    sessionProgress: 'Session 3/10 This Phase',
    sessionContent: {
      heading: 'Interval Workout Structure',
      steps: [
        {
          number: 1,
          title: '8x 400m Repeats',
          duration: 25,
          instructions: [
            'Run each 400m at 5K race pace or slightly faster',
            'Recovery: 90 seconds easy jog between repeats',
            'Focus on maintaining consistent splits across all intervals',
            'Keep form tight - avoid over-striding when fatigued',
            'Listen to your body - it\'s okay to adjust pace if needed',
          ],
        },
        {
          number: 2,
          title: 'Recovery Notes',
          instructions: [
            'Full recovery jog between each interval',
            'Shake out legs and take deep breaths during rest',
            'Stay mentally focused on the next repeat',
          ],
        },
      ],
    },
    onMenuClick: () => console.log('Menu clicked'),
  },
}

export const AllTabsPopulated: Story = {
  args: {
    sessionName: 'Long Run with Tempo Finish',
    distance: 15,
    distanceUnit: 'km',
    durationMinutes: 90,
    zone: 'Zone 2-4 / RPE 3-7',
    cyclePhases: [
      {
        phaseName: 'Luteal Phase Day 8',
        icon: <Leaf className="h-4 w-4" />,
      },
    ],
    sessionProgress: 'Session 12/15 This Phase',
    warmupContent: (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[#3d3826]">Pre-Run Warmup</h3>
        <ul className="space-y-2 text-sm text-[#3d3826]/80">
          <li>• 5 minutes easy walking</li>
          <li>• Dynamic stretches: leg swings, walking lunges, high knees</li>
          <li>• Start run at very easy pace for first 10 minutes</li>
        </ul>
      </div>
    ),
    sessionContent: {
      heading: 'Main Workout',
      steps: [
        {
          number: 1,
          title: 'Easy Pace Base',
          duration: 70,
          instructions: [
            'Run majority at comfortable, conversational pace',
            'Keep effort steady and relaxed',
            'Stay hydrated - plan water stops or carry fluids',
            'Monitor energy levels throughout',
          ],
        },
        {
          number: 2,
          title: 'Tempo Finish',
          duration: 20,
          instructions: [
            'Final 20 minutes at tempo pace (comfortably hard)',
            'This should feel challenging but sustainable',
            'Focus on maintaining good form even when tired',
            'Push through mental fatigue - you\'ve got this!',
          ],
        },
      ],
    },
    recoverContent: (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[#3d3826]">Post-Run Recovery</h3>
        <ul className="space-y-2 text-sm text-[#3d3826]/80">
          <li>• 5-10 minutes easy walking cool down</li>
          <li>• Static stretches focusing on quads, hamstrings, calves</li>
          <li>• Rehydrate within 20 minutes</li>
          <li>• Refuel with carbs + protein within 30-60 minutes</li>
          <li>• Consider foam rolling major muscle groups</li>
        </ul>
      </div>
    ),
    onMenuClick: () => console.log('Menu clicked'),
  },
}

export const MinimalData: Story = {
  args: {
    sessionName: 'Recovery Run',
    sessionContent: {
      steps: [
        {
          number: 1,
          title: 'Easy Recovery Pace',
          instructions: [
            'Very easy effort, slower than normal easy runs',
            'Focus on movement quality over speed or distance',
          ],
        },
      ],
    },
  },
}

export const MultipleCyclePhases: Story = {
  args: {
    sessionName: 'Cross-Training Day',
    durationMinutes: 45,
    zone: 'Zone 2-3 / RPE 3-5',
    cyclePhases: [
      {
        phaseName: 'Menstrual Phase Day 3',
        icon: <Snowflake className="h-4 w-4" />,
      },
      {
        phaseName: 'Low Energy Period',
        icon: <Snowflake className="h-4 w-4" />,
      },
    ],
    sessionProgress: 'Session 2/8 This Phase',
    sessionContent: {
      heading: 'Low-Impact Cross Training',
      steps: [
        {
          number: 1,
          title: 'Cycling or Swimming',
          duration: 45,
          instructions: [
            'Choose low-impact activity that feels comfortable today',
            'Keep intensity moderate - this is active recovery',
            'Listen to your body and adjust effort as needed',
            'Focus on movement and circulation rather than performance',
          ],
        },
      ],
    },
  },
}
