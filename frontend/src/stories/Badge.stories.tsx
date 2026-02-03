import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from '@/components/ui/badge'

const meta = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Upcoming',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Completed',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Cancelled',
  },
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'In Progress',
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
}

export const RaceStatus: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm">Race Status:</span>
        <Badge>Upcoming</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm">Race Status:</span>
        <Badge variant="secondary">Completed</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm">Race Status:</span>
        <Badge variant="outline">Training</Badge>
      </div>
    </div>
  ),
}
