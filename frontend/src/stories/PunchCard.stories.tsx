import type { Meta, StoryObj } from '@storybook/react'
import { PunchCard, type PunchCardDay } from '@/components/ui/punch-card'

const meta: Meta<typeof PunchCard> = {
  title: 'Components/PunchCard',
  component: PunchCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof PunchCard>

// Helper to create days
const createDay = (
  dayNumber: number,
  options: Partial<Omit<PunchCardDay, 'dayNumber'>> = {}
): PunchCardDay => ({
  dayNumber,
  hasSession: true,
  isCompleted: false,
  isSkipped: false,
  isRest: false,
  ...options,
})

// Generate a week of sessions (5 active, 2 rest)
const generateWeek = (weekNum: number, completedCount: number, skippedCount: number = 0): PunchCardDay[] => {
  const days: PunchCardDay[] = []
  let completed = 0
  let skipped = 0

  for (let i = 1; i <= 7; i++) {
    const dayNum = (weekNum - 1) * 7 + i
    // Make days 3 and 7 rest days
    if (i === 3 || i === 7) {
      days.push(createDay(dayNum, { isRest: true, hasSession: false }))
    } else {
      if (completed < completedCount) {
        days.push(createDay(dayNum, { isCompleted: true }))
        completed++
      } else if (skipped < skippedCount) {
        days.push(createDay(dayNum, { isSkipped: true }))
        skipped++
      } else {
        days.push(createDay(dayNum))
      }
    }
  }
  return days
}

// ==================== WEEK VIEW (Default) ====================

const weekData: PunchCardDay[] = [
  createDay(1, { isCompleted: true }),
  createDay(2, { isCompleted: true }),
  createDay(3, { isRest: true, hasSession: false }),
  createDay(4, { isCompleted: true }),
  createDay(5), // pending
  createDay(6),
  createDay(7, { isRest: true, hasSession: false }),
]

export const WeekView: Story = {
  args: {
    days: weekData,
    variant: 'default',
  },
}

export const WeekViewAllCompleted: Story = {
  args: {
    days: generateWeek(1, 5),
    variant: 'default',
  },
}

export const WeekViewWithSkipped: Story = {
  args: {
    days: [
      createDay(1, { isCompleted: true }),
      createDay(2, { isSkipped: true }),
      createDay(3, { isRest: true, hasSession: false }),
      createDay(4, { isCompleted: true }),
      createDay(5, { isSkipped: true }),
      createDay(6),
      createDay(7, { isRest: true, hasSession: false }),
    ],
    variant: 'default',
  },
}

// ==================== MONTH VIEW (Compact) ====================

const monthData: PunchCardDay[] = [
  ...generateWeek(1, 5), // Week 1 - all done
  ...generateWeek(2, 5), // Week 2 - all done
  ...generateWeek(3, 3, 1), // Week 3 - 3 done, 1 skipped
  ...generateWeek(4, 2), // Week 4 - 2 done, rest pending
]

export const MonthView: Story = {
  args: {
    days: monthData,
    variant: 'compact',
  },
}

// ==================== PLAN VIEW (Compact) ====================

// Generate 12 weeks of training (typical plan)
const planData: PunchCardDay[] = [
  ...generateWeek(1, 5),
  ...generateWeek(2, 5),
  ...generateWeek(3, 5),
  ...generateWeek(4, 4, 1),
  ...generateWeek(5, 5),
  ...generateWeek(6, 3, 2),
  ...generateWeek(7, 5),
  ...generateWeek(8, 5),
  ...generateWeek(9, 4),
  ...generateWeek(10, 2),
  ...generateWeek(11, 0),
  ...generateWeek(12, 0),
]

export const PlanView: Story = {
  args: {
    days: planData,
    variant: 'compact',
  },
}
