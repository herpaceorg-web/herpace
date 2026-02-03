import type { Meta, StoryObj } from '@storybook/react-vite'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

const meta = {
  title: 'Components/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="w-[400px]">
      <Textarea placeholder="Type your message here..." />
    </div>
  ),
}

export const WithLabel: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <Label htmlFor="notes">Session Notes</Label>
      <Textarea
        id="notes"
        placeholder="How did your training session go? Add any notes about your performance..."
      />
    </div>
  ),
}

export const RaceNotes: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <Label htmlFor="race-notes">Race Notes</Label>
      <Textarea
        id="race-notes"
        placeholder="Describe your race experience, pacing strategy, weather conditions..."
        rows={6}
      />
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <Label htmlFor="disabled-notes">Notes (Read Only)</Label>
      <Textarea
        id="disabled-notes"
        value="This session was automatically generated based on your training plan."
        disabled
      />
    </div>
  ),
}

export const WithCharacterLimit: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <div className="flex justify-between">
        <Label htmlFor="limited">Quick Feedback</Label>
        <span className="text-xs text-gray-500">0/200</span>
      </div>
      <Textarea
        id="limited"
        placeholder="Brief summary of your session..."
        maxLength={200}
      />
    </div>
  ),
}
