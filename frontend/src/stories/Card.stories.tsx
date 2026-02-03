import type { Meta, StoryObj } from '@storybook/react-vite'
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Training Session</CardTitle>
        <CardDescription>Your next workout is scheduled for today</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          Easy Run - 5km at conversational pace. Focus on maintaining good form throughout the run.
        </p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Complete Session</Button>
      </CardFooter>
    </Card>
  ),
}

export const WithoutFooter: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Cycle Phase: Follicular</CardTitle>
        <CardDescription>Days 6-14 of your cycle</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          This is a great time for high-intensity workouts and strength training.
          Your energy levels are typically higher during this phase.
        </p>
      </CardContent>
    </Card>
  ),
}

export const SimpleCard: Story = {
  render: () => (
    <Card className="w-[350px] p-6">
      <h3 className="font-semibold text-lg mb-2">Quick Stats</h3>
      <p className="text-sm text-gray-600">
        You've completed 12 out of 16 training sessions this month.
      </p>
    </Card>
  ),
}

export const MultipleCards: Story = {
  render: () => (
    <div className="flex gap-4">
      <Card className="w-[200px] p-4">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-sm">Total Distance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <p className="text-2xl font-bold">42.5 km</p>
          <p className="text-xs text-gray-500">This week</p>
        </CardContent>
      </Card>

      <Card className="w-[200px] p-4">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-sm">Sessions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <p className="text-2xl font-bold">8</p>
          <p className="text-xs text-gray-500">Completed</p>
        </CardContent>
      </Card>

      <Card className="w-[200px] p-4">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-sm">Next Race</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <p className="text-2xl font-bold">14</p>
          <p className="text-xs text-gray-500">Days away</p>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
}
