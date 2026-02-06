import type { Meta, StoryObj } from '@storybook/react-vite'
import { MonthViewInline } from './MonthViewInline'
import { SessionSummary, WorkoutType, IntensityLevel, CyclePhase, TrainingStage } from '@/types/api'
import { useState } from 'react'

const meta = {
  title: 'Dashboard/MonthViewInline',
  component: MonthViewInline,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MonthViewInline>

export default meta
type Story = StoryObj<typeof meta>

// Mock data - sessions for January 2026
const mockSessions: SessionSummary[] = [
  {
    id: '1',
    sessionName: 'Easy Run',
    scheduledDate: new Date(2026, 0, 6).toISOString(),
    workoutType: WorkoutType.Easy,
    durationMinutes: 30,
    distance: 3,
    intensityLevel: IntensityLevel.Low,
    trainingStage: TrainingStage.Base,
    isSkipped: false
  },
  {
    id: '2',
    sessionName: 'Tempo Run',
    scheduledDate: new Date(2026, 0, 8).toISOString(),
    workoutType: WorkoutType.Tempo,
    durationMinutes: 45,
    distance: 5,
    intensityLevel: IntensityLevel.Moderate,
    trainingStage: TrainingStage.Base,
    isSkipped: false
  },
  {
    id: '3',
    sessionName: 'Long Run',
    scheduledDate: new Date(2026, 0, 11).toISOString(),
    workoutType: WorkoutType.Long,
    durationMinutes: 90,
    distance: 10,
    intensityLevel: IntensityLevel.High,
    trainingStage: TrainingStage.Build,
    isSkipped: false
  },
  {
    id: '4',
    sessionName: 'Interval Training',
    scheduledDate: new Date(2026, 0, 15).toISOString(),
    workoutType: WorkoutType.Interval,
    durationMinutes: 60,
    distance: 6,
    intensityLevel: IntensityLevel.High,
    trainingStage: TrainingStage.Build,
    isSkipped: false
  },
  {
    id: '5',
    sessionName: 'Recovery Run',
    scheduledDate: new Date(2026, 0, 20).toISOString(),
    workoutType: WorkoutType.Easy,
    durationMinutes: 30,
    distance: 3,
    intensityLevel: IntensityLevel.Low,
    trainingStage: TrainingStage.Build,
    isSkipped: false
  },
]

const currentMonth = new Date(2026, 0, 1) // January 2026
const planStartDate = new Date(2026, 0, 1)
const planEndDate = new Date(2026, 6, 1)

const mockCyclePhases = new Map<string, CyclePhase>([
  ['2026-01-02', CyclePhase.Menstrual],
  ['2026-01-03', CyclePhase.Menstrual],
  ['2026-01-04', CyclePhase.Menstrual],
  ['2026-01-05', CyclePhase.Follicular],
  ['2026-01-06', CyclePhase.Follicular],
  ['2026-01-07', CyclePhase.Follicular],
  ['2026-01-08', CyclePhase.Follicular],
  ['2026-01-09', CyclePhase.Follicular],
  ['2026-01-10', CyclePhase.Ovulatory],
  ['2026-01-11', CyclePhase.Ovulatory],
  ['2026-01-12', CyclePhase.Luteal],
  ['2026-01-13', CyclePhase.Luteal],
  ['2026-01-14', CyclePhase.Luteal],
  ['2026-01-15', CyclePhase.Luteal],
  ['2026-01-16', CyclePhase.Luteal],
  ['2026-01-17', CyclePhase.Luteal],
  ['2026-01-18', CyclePhase.Luteal],
  ['2026-01-19', CyclePhase.Luteal],
  ['2026-01-20', CyclePhase.Luteal],
])

export const Default: Story = {
  render: () => {
    const [month, setMonth] = useState(currentMonth)

    return (
      <div className="max-w-7xl mx-auto p-6">
        <MonthViewInline
          currentMonth={month}
          sessions={mockSessions}
          cyclePhases={mockCyclePhases}
          onDayClick={(date, session) => {
            console.log('Clicked:', date, session)
          }}
          onNavigateMonth={(direction) => {
            setMonth(prev => {
              const newMonth = new Date(prev)
              newMonth.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
              return newMonth
            })
          }}
          planStartDate={planStartDate}
          planEndDate={planEndDate}
        />
      </div>
    )
  },
}

export const WithoutCycleTracking: Story = {
  render: () => {
    const [month, setMonth] = useState(currentMonth)

    return (
      <div className="max-w-7xl mx-auto p-6">
        <MonthViewInline
          currentMonth={month}
          sessions={mockSessions}
          cyclePhases={new Map()}
          onDayClick={(date, session) => {
            console.log('Clicked:', date, session)
          }}
          onNavigateMonth={(direction) => {
            setMonth(prev => {
              const newMonth = new Date(prev)
              newMonth.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
              return newMonth
            })
          }}
          planStartDate={planStartDate}
          planEndDate={planEndDate}
        />
      </div>
    )
  },
}

export const EmptyMonth: Story = {
  render: () => {
    const [month, setMonth] = useState(currentMonth)

    return (
      <div className="max-w-7xl mx-auto p-6">
        <MonthViewInline
          currentMonth={month}
          sessions={[]}
          cyclePhases={mockCyclePhases}
          onDayClick={(date, session) => {
            console.log('Clicked:', date, session)
          }}
          onNavigateMonth={(direction) => {
            setMonth(prev => {
              const newMonth = new Date(prev)
              newMonth.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
              return newMonth
            })
          }}
          planStartDate={planStartDate}
          planEndDate={planEndDate}
        />
      </div>
    )
  },
}
