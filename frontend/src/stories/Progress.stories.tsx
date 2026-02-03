import type { Meta, StoryObj } from '@storybook/react-vite'
import { Progress } from '@/components/ui/progress'
import { useState, useEffect } from 'react'

const meta = {
  title: 'Components/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="w-[400px]">
      <Progress value={60} />
    </div>
  ),
}

export const WithLabel: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <div className="flex justify-between text-sm">
        <span>Training Progress</span>
        <span className="text-gray-500">75%</span>
      </div>
      <Progress value={75} />
    </div>
  ),
}

export const LowProgress: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <div className="flex justify-between text-sm">
        <span>Week 1 of 12</span>
        <span className="text-gray-500">8%</span>
      </div>
      <Progress value={8} />
    </div>
  ),
}

export const HighProgress: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <div className="flex justify-between text-sm">
        <span>Almost there!</span>
        <span className="text-gray-500">92%</span>
      </div>
      <Progress value={92} />
    </div>
  ),
}

export const Complete: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <div className="flex justify-between text-sm">
        <span>Training Plan Complete</span>
        <span className="text-green-600 font-semibold">100%</span>
      </div>
      <Progress value={100} />
    </div>
  ),
}

export const MultipleProgress: Story = {
  render: () => (
    <div className="w-[400px] space-y-6">
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span>This Week</span>
          <span className="text-gray-500">5/7 sessions</span>
        </div>
        <Progress value={71} />
      </div>

      <div>
        <div className="flex justify-between text-sm mb-2">
          <span>This Month</span>
          <span className="text-gray-500">18/24 sessions</span>
        </div>
        <Progress value={75} />
      </div>

      <div>
        <div className="flex justify-between text-sm mb-2">
          <span>Race Preparation</span>
          <span className="text-gray-500">Week 8 of 12</span>
        </div>
        <Progress value={67} />
      </div>
    </div>
  ),
}

export const Animated: Story = {
  render: () => {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) return 0
          return prev + 10
        })
      }, 500)

      return () => clearInterval(timer)
    }, [])

    return (
      <div className="w-[400px] space-y-2">
        <div className="flex justify-between text-sm">
          <span>Generating Training Plan...</span>
          <span className="text-gray-500">{progress}%</span>
        </div>
        <Progress value={progress} />
      </div>
    )
  },
}

export const LoadingStates: Story = {
  render: () => (
    <div className="w-[400px] space-y-6">
      <div>
        <div className="text-sm mb-2">Analyzing your profile...</div>
        <Progress value={25} />
      </div>

      <div>
        <div className="text-sm mb-2">Calculating cycle adjustments...</div>
        <Progress value={50} />
      </div>

      <div>
        <div className="text-sm mb-2">Generating workouts...</div>
        <Progress value={75} />
      </div>

      <div>
        <div className="text-sm mb-2 text-green-600">Plan ready!</div>
        <Progress value={100} />
      </div>
    </div>
  ),
}
