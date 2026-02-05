import type { Meta, StoryObj } from '@storybook/react-vite'
import { WorkoutSessionCard } from '@/components/session/WorkoutSessionCard'
import { Snowflake, Sun, Leaf, Sprout } from 'lucide-react'
import { IntensityLevel, WorkoutType, CyclePhase } from '@/types/api'
import type { SessionDetailDto } from '@/types/api'

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
    warmupContent: ({
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
    } as any),
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

// Session List - matches Dashboard layout
export const SessionList: Story = {
  parameters: {
    layout: 'padded',
  },
  render: () => {
    // Mock session data with CTAs
    const sessions: SessionDetailDto[] = [
      {
        id: '1',
        sessionName: '30 Minute Easy Run',
        workoutType: WorkoutType.Easy,
        scheduledDate: new Date().toISOString(),
        distance: 5,
        durationMinutes: 30,
        intensityLevel: IntensityLevel.Low,
        cyclePhase: CyclePhase.Follicular,
        isCompleted: false,
        isSkipped: false,
        sessionNumberInPhase: 5,
        totalSessionsInPhase: 15,
        workoutTips: [
          'Maintain a conversational pace throughout the run',
          'Focus on consistent breathing and good running form',
        ]
      },
      {
        id: '2',
        sessionName: 'Speed Intervals - 400m Repeats',
        workoutType: WorkoutType.Interval,
        scheduledDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        distance: 6,
        durationMinutes: 40,
        intensityLevel: IntensityLevel.High,
        cyclePhase: CyclePhase.Ovulatory,
        isCompleted: false,
        isSkipped: false,
        sessionNumberInPhase: 3,
        totalSessionsInPhase: 10,
        workoutTips: [
          'Run each 400m at 5K race pace or slightly faster',
          'Recovery: 90 seconds easy jog between repeats',
        ]
      },
      {
        id: '3',
        sessionName: 'Long Run with Tempo Finish',
        workoutType: WorkoutType.Long,
        scheduledDate: new Date(Date.now() + 172800000).toISOString(), // 2 days from now
        distance: 15,
        durationMinutes: 90,
        intensityLevel: IntensityLevel.Moderate,
        cyclePhase: CyclePhase.Luteal,
        isCompleted: false,
        isSkipped: false,
        sessionNumberInPhase: 12,
        totalSessionsInPhase: 15,
        workoutTips: [
          'Run majority at comfortable, conversational pace',
          'Stay hydrated - plan water stops or carry fluids',
          'Final 20 minutes at tempo pace (comfortably hard)',
        ]
      },
      {
        id: '4',
        sessionName: 'Recovery Run',
        workoutType: WorkoutType.Easy,
        scheduledDate: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
        distance: 4.8, // ~3 miles
        durationMinutes: 25,
        intensityLevel: IntensityLevel.Low,
        cyclePhase: CyclePhase.Menstrual,
        isCompleted: false,
        isSkipped: false,
        sessionNumberInPhase: 1,
        totalSessionsInPhase: 8,
        menstruationDay: 2,
        workoutTips: [
          'Slower than normal easy runs',
          'Focus on movement quality over speed',
        ]
      },
    ]

    return (
      <div className="w-full lg:w-2/3 mx-auto space-y-12">
        <h2 className="text-2xl font-semibold mb-12">Upcoming Sessions</h2>
        <div className="space-y-12">
          {sessions.map((session) => (
            <WorkoutSessionCard
              key={session.id}
              session={session}
              onSessionUpdated={() => console.log('Session updated')}
              distanceUnit="km"
            />
          ))}
        </div>
      </div>
    )
  },
}

// Intensity Accent Bar Variations
export const IntensityAccentBarOptions: Story = {
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div className="max-w-4xl mx-auto space-y-12">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Option 1: Left Border Accent</h2>
        <p className="text-sm text-muted-foreground mb-6">Colored left border (4px wide) based on intensity</p>
        <div className="space-y-8">
          <div className="border-l-4 border-green-500">
            <WorkoutSessionCard
              sessionName="30 Minute Easy Run"
              distance={5}
              distanceUnit="km"
              durationMinutes={30}
              zone="Zone 2-5 / RPE 2-6"
              intensityLevel={IntensityLevel.Low}
              cyclePhases={[
                {
                  phaseName: 'Follicular Phase Day 1',
                  icon: <Sprout className="h-4 w-4" />,
                },
              ]}
              sessionProgress="Session 5/15 This Phase"
              sessionContent={{
                heading: 'Easy Run Instructions',
                steps: [
                  {
                    number: 1,
                    title: 'Easy Pace Run',
                    duration: 30,
                    instructions: ['Maintain a conversational pace'],
                  },
                ],
              }}
              onMenuClick={() => console.log('Menu clicked')}
            />
          </div>
          <div className="border-l-4 border-yellow-500">
            <WorkoutSessionCard
              sessionName="Long Run with Tempo Finish"
              distance={15}
              distanceUnit="km"
              durationMinutes={90}
              zone="Zone 2-4 / RPE 3-7"
              intensityLevel={IntensityLevel.Moderate}
              cyclePhases={[
                {
                  phaseName: 'Luteal Phase Day 8',
                  icon: <Leaf className="h-4 w-4" />,
                },
              ]}
              sessionProgress="Session 12/15 This Phase"
              sessionContent={{
                heading: 'Main Workout',
                steps: [
                  {
                    number: 1,
                    title: 'Easy Pace Base',
                    duration: 70,
                    instructions: ['Run at comfortable, conversational pace'],
                  },
                ],
              }}
              onMenuClick={() => console.log('Menu clicked')}
            />
          </div>
          <div className="border-l-4 border-red-500">
            <WorkoutSessionCard
              sessionName="Speed Intervals - 400m Repeats"
              distance={6}
              distanceUnit="km"
              durationMinutes={40}
              zone="Zone 4-5 / RPE 7-9"
              intensityLevel={IntensityLevel.High}
              cyclePhases={[
                {
                  phaseName: 'Ovulatory Phase Day 2',
                  icon: <Sun className="h-4 w-4" />,
                },
              ]}
              sessionProgress="Session 3/10 This Phase"
              sessionContent={{
                heading: 'Interval Workout Structure',
                steps: [
                  {
                    number: 1,
                    title: '8x 400m Repeats',
                    duration: 25,
                    instructions: ['Run each 400m at 5K race pace'],
                  },
                ],
              }}
              onMenuClick={() => console.log('Menu clicked')}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Option 2: Top Bar Accent</h2>
        <p className="text-sm text-muted-foreground mb-6">Colored bar at top of card (6px tall)</p>
        <div className="space-y-8">
          <div className="border-t-[6px] border-green-500 rounded-t-2xl overflow-hidden">
            <WorkoutSessionCard
              sessionName="30 Minute Easy Run"
              distance={5}
              distanceUnit="km"
              durationMinutes={30}
              zone="Zone 2-5 / RPE 2-6"
              intensityLevel={IntensityLevel.Low}
              cyclePhases={[
                {
                  phaseName: 'Follicular Phase Day 1',
                  icon: <Sprout className="h-4 w-4" />,
                },
              ]}
              sessionProgress="Session 5/15 This Phase"
              sessionContent={{
                heading: 'Easy Run Instructions',
                steps: [
                  {
                    number: 1,
                    title: 'Easy Pace Run',
                    duration: 30,
                    instructions: ['Maintain a conversational pace'],
                  },
                ],
              }}
              onMenuClick={() => console.log('Menu clicked')}
            />
          </div>
          <div className="border-t-[6px] border-yellow-500 rounded-t-2xl overflow-hidden">
            <WorkoutSessionCard
              sessionName="Long Run with Tempo Finish"
              distance={15}
              distanceUnit="km"
              durationMinutes={90}
              zone="Zone 2-4 / RPE 3-7"
              intensityLevel={IntensityLevel.Moderate}
              cyclePhases={[
                {
                  phaseName: 'Luteal Phase Day 8',
                  icon: <Leaf className="h-4 w-4" />,
                },
              ]}
              sessionProgress="Session 12/15 This Phase"
              sessionContent={{
                heading: 'Main Workout',
                steps: [
                  {
                    number: 1,
                    title: 'Easy Pace Base',
                    duration: 70,
                    instructions: ['Run at comfortable, conversational pace'],
                  },
                ],
              }}
              onMenuClick={() => console.log('Menu clicked')}
            />
          </div>
          <div className="border-t-[6px] border-red-500 rounded-t-2xl overflow-hidden">
            <WorkoutSessionCard
              sessionName="Speed Intervals - 400m Repeats"
              distance={6}
              distanceUnit="km"
              durationMinutes={40}
              zone="Zone 4-5 / RPE 7-9"
              intensityLevel={IntensityLevel.High}
              cyclePhases={[
                {
                  phaseName: 'Ovulatory Phase Day 2',
                  icon: <Sun className="h-4 w-4" />,
                },
              ]}
              sessionProgress="Session 3/10 This Phase"
              sessionContent={{
                heading: 'Interval Workout Structure',
                steps: [
                  {
                    number: 1,
                    title: '8x 400m Repeats',
                    duration: 25,
                    instructions: ['Run each 400m at 5K race pace'],
                  },
                ],
              }}
              onMenuClick={() => console.log('Menu clicked')}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Option 3: Flowing Background Tint</h2>
        <p className="text-sm text-muted-foreground mb-6">Organic gradient mesh using heart color (#A14139) at varying intensities</p>
        <div className="space-y-8">
          {/* Low Intensity - Subtle flowing tint */}
          <div className="relative">
            <WorkoutSessionCard
              sessionName="30 Minute Easy Run"
              distance={5}
              distanceUnit="km"
              durationMinutes={30}
              zone="Zone 2-5 / RPE 2-6"
              intensityLevel={IntensityLevel.Low}
              cyclePhases={[
                {
                  phaseName: 'Follicular Phase Day 1',
                  icon: <Sprout className="h-4 w-4" />,
                },
              ]}
              sessionProgress="Session 5/15 This Phase"
              sessionContent={{
                heading: 'Easy Run Instructions',
                steps: [
                  {
                    number: 1,
                    title: 'Easy Pace Run',
                    duration: 30,
                    instructions: ['Maintain a conversational pace'],
                  },
                ],
              }}
              onMenuClick={() => console.log('Menu clicked')}
            />
            {/* Gradient overlay - only on card, not phase section */}
            <div
              className="absolute top-[30px] left-0 right-0 bottom-0 pointer-events-none rounded-tl-none rounded-tr-2xl rounded-b-2xl"
              style={{
                background: `
                  radial-gradient(ellipse 150% 100% at -50% 50%, rgba(161, 65, 57, 0.10) 0%, transparent 50%),
                  radial-gradient(ellipse 150% 100% at 150% 50%, rgba(161, 65, 57, 0.10) 0%, transparent 50%),
                  radial-gradient(ellipse 100% 150% at 50% -50%, rgba(161, 65, 57, 0.08) 0%, transparent 50%),
                  radial-gradient(ellipse 100% 150% at 50% 150%, rgba(161, 65, 57, 0.08) 0%, transparent 50%)
                `
              }}
            />
          </div>

          {/* Moderate Intensity - More visible flowing tint */}
          <div className="relative">
            <WorkoutSessionCard
              sessionName="Long Run with Tempo Finish"
              distance={15}
              distanceUnit="km"
              durationMinutes={90}
              zone="Zone 2-4 / RPE 3-7"
              intensityLevel={IntensityLevel.Moderate}
              cyclePhases={[
                {
                  phaseName: 'Luteal Phase Day 8',
                  icon: <Leaf className="h-4 w-4" />,
                },
              ]}
              sessionProgress="Session 12/15 This Phase"
              sessionContent={{
                heading: 'Main Workout',
                steps: [
                  {
                    number: 1,
                    title: 'Easy Pace Base',
                    duration: 70,
                    instructions: ['Run at comfortable, conversational pace'],
                  },
                ],
              }}
              onMenuClick={() => console.log('Menu clicked')}
            />
            {/* Gradient overlay - only on card, not phase section */}
            <div
              className="absolute top-[30px] left-0 right-0 bottom-0 pointer-events-none rounded-tl-none rounded-tr-2xl rounded-b-2xl"
              style={{
                background: `
                  radial-gradient(ellipse 150% 100% at -50% 50%, rgba(161, 65, 57, 0.16) 0%, transparent 50%),
                  radial-gradient(ellipse 150% 100% at 150% 50%, rgba(161, 65, 57, 0.16) 0%, transparent 50%),
                  radial-gradient(ellipse 100% 150% at 50% -50%, rgba(161, 65, 57, 0.13) 0%, transparent 50%),
                  radial-gradient(ellipse 100% 150% at 50% 150%, rgba(161, 65, 57, 0.13) 0%, transparent 50%)
                `
              }}
            />
          </div>

          {/* High Intensity - Strong flowing tint */}
          <div className="relative">
            <WorkoutSessionCard
              sessionName="Speed Intervals - 400m Repeats"
              distance={6}
              distanceUnit="km"
              durationMinutes={40}
              zone="Zone 4-5 / RPE 7-9"
              intensityLevel={IntensityLevel.High}
              cyclePhases={[
                {
                  phaseName: 'Ovulatory Phase Day 2',
                  icon: <Sun className="h-4 w-4" />,
                },
              ]}
              sessionProgress="Session 3/10 This Phase"
              sessionContent={{
                heading: 'Interval Workout Structure',
                steps: [
                  {
                    number: 1,
                    title: '8x 400m Repeats',
                    duration: 25,
                    instructions: ['Run each 400m at 5K race pace'],
                  },
                ],
              }}
              onMenuClick={() => console.log('Menu clicked')}
            />
            {/* Gradient overlay - only on card, not phase section */}
            <div
              className="absolute top-[30px] left-0 right-0 bottom-0 pointer-events-none rounded-tl-none rounded-tr-2xl rounded-b-2xl"
              style={{
                background: `
                  radial-gradient(ellipse 150% 100% at -50% 50%, rgba(161, 65, 57, 0.24) 0%, transparent 50%),
                  radial-gradient(ellipse 150% 100% at 150% 50%, rgba(161, 65, 57, 0.24) 0%, transparent 50%),
                  radial-gradient(ellipse 100% 150% at 50% -50%, rgba(161, 65, 57, 0.20) 0%, transparent 50%),
                  radial-gradient(ellipse 100% 150% at 50% 150%, rgba(161, 65, 57, 0.20) 0%, transparent 50%)
                `
              }}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Option 4: Thick Left Edge Strip</h2>
        <p className="text-sm text-muted-foreground mb-6">Wide colored strip on left edge (8px)</p>
        <div className="space-y-8">
          <div className="border-l-8 border-green-500 rounded-l-lg">
            <WorkoutSessionCard
              sessionName="30 Minute Easy Run"
              distance={5}
              distanceUnit="km"
              durationMinutes={30}
              zone="Zone 2-5 / RPE 2-6"
              intensityLevel={IntensityLevel.Low}
              cyclePhases={[
                {
                  phaseName: 'Follicular Phase Day 1',
                  icon: <Sprout className="h-4 w-4" />,
                },
              ]}
              sessionProgress="Session 5/15 This Phase"
              sessionContent={{
                heading: 'Easy Run Instructions',
                steps: [
                  {
                    number: 1,
                    title: 'Easy Pace Run',
                    duration: 30,
                    instructions: ['Maintain a conversational pace'],
                  },
                ],
              }}
              onMenuClick={() => console.log('Menu clicked')}
            />
          </div>
          <div className="border-l-8 border-yellow-500 rounded-l-lg">
            <WorkoutSessionCard
              sessionName="Long Run with Tempo Finish"
              distance={15}
              distanceUnit="km"
              durationMinutes={90}
              zone="Zone 2-4 / RPE 3-7"
              intensityLevel={IntensityLevel.Moderate}
              cyclePhases={[
                {
                  phaseName: 'Luteal Phase Day 8',
                  icon: <Leaf className="h-4 w-4" />,
                },
              ]}
              sessionProgress="Session 12/15 This Phase"
              sessionContent={{
                heading: 'Main Workout',
                steps: [
                  {
                    number: 1,
                    title: 'Easy Pace Base',
                    duration: 70,
                    instructions: ['Run at comfortable, conversational pace'],
                  },
                ],
              }}
              onMenuClick={() => console.log('Menu clicked')}
            />
          </div>
          <div className="border-l-8 border-red-500 rounded-l-lg">
            <WorkoutSessionCard
              sessionName="Speed Intervals - 400m Repeats"
              distance={6}
              distanceUnit="km"
              durationMinutes={40}
              zone="Zone 4-5 / RPE 7-9"
              intensityLevel={IntensityLevel.High}
              cyclePhases={[
                {
                  phaseName: 'Ovulatory Phase Day 2',
                  icon: <Sun className="h-4 w-4" />,
                },
              ]}
              sessionProgress="Session 3/10 This Phase"
              sessionContent={{
                heading: 'Interval Workout Structure',
                steps: [
                  {
                    number: 1,
                    title: '8x 400m Repeats',
                    duration: 25,
                    instructions: ['Run each 400m at 5K race pace'],
                  },
                ],
              }}
              onMenuClick={() => console.log('Menu clicked')}
            />
          </div>
        </div>
      </div>
    </div>
  ),
}

// Session CTAs - Action buttons and status displays
export const SessionCTAs: Story = {
  parameters: {
    layout: 'padded',
  },
  render: () => {
    // Mock session data
    const baseSession: SessionDetailDto = {
      id: '1',
      sessionName: '30 Minute Easy Run',
      workoutType: WorkoutType.Easy,
      scheduledDate: new Date().toISOString(),
      distance: 5,
      durationMinutes: 30,
      intensityLevel: IntensityLevel.Low,
      cyclePhase: CyclePhase.Follicular,
      isCompleted: false,
      isSkipped: false,
      sessionNumberInPhase: 5,
      totalSessionsInPhase: 15,
      workoutTips: [
        'Focus on maintaining an easy, conversational pace',
        'Keep your heart rate in Zone 2 for optimal aerobic development',
        'Stay hydrated throughout your run'
      ]
    }

    const completedSession: SessionDetailDto = {
      ...baseSession,
      id: '2',
      sessionName: 'Long Run with Tempo Finish',
      intensityLevel: IntensityLevel.Moderate,
      distance: 15,
      durationMinutes: 90,
      isCompleted: true,
      actualDistance: 15.2,
      actualDuration: 88,
      rpe: 7
    }

    const skippedSession: SessionDetailDto = {
      ...baseSession,
      id: '3',
      sessionName: 'Speed Intervals - 400m Repeats',
      intensityLevel: IntensityLevel.High,
      distance: 6,
      durationMinutes: 40,
      isSkipped: true
    }

    const restDaySession: SessionDetailDto = {
      ...baseSession,
      id: '4',
      sessionName: 'Rest Day',
      workoutType: WorkoutType.Rest,
      distance: undefined,
      durationMinutes: undefined,
      intensityLevel: IntensityLevel.Low,
      isCompleted: true
    }

    return (
      <div className="max-w-4xl mx-auto space-y-12">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Pending Session - Action Buttons</h2>
          <p className="text-sm text-muted-foreground mb-6">Shows Complete Workout, Voice, and Skip buttons</p>
          <WorkoutSessionCard
            session={baseSession}
            onSessionUpdated={() => console.log('Session updated')}
            distanceUnit="km"
          />
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Completed Session</h2>
          <p className="text-sm text-muted-foreground mb-6">Shows completion status with actual metrics</p>
          <WorkoutSessionCard
            session={completedSession}
            onSessionUpdated={() => console.log('Session updated')}
            distanceUnit="km"
          />
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Skipped Session</h2>
          <p className="text-sm text-muted-foreground mb-6">Shows skipped status</p>
          <WorkoutSessionCard
            session={skippedSession}
            onSessionUpdated={() => console.log('Session updated')}
            distanceUnit="km"
          />
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Rest Day</h2>
          <p className="text-sm text-muted-foreground mb-6">Auto-completed, shows optional "Log a Workout" button</p>
          <WorkoutSessionCard
            session={restDaySession}
            onSessionUpdated={() => console.log('Session updated')}
            distanceUnit="km"
          />
        </div>
      </div>
    )
  },
}
