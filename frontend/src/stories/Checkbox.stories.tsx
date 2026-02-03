import type { Meta, StoryObj } from '@storybook/react-vite'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <Checkbox />,
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms" className="cursor-pointer">
        I agree to the terms and conditions
      </Label>
    </div>
  ),
}

export const Checked: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="checked" defaultChecked />
      <Label htmlFor="checked">Checked by default</Label>
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="disabled" disabled />
      <Label htmlFor="disabled" className="text-gray-400">
        Disabled checkbox
      </Label>
    </div>
  ),
}

export const CheckedAndDisabled: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="checked-disabled" defaultChecked disabled />
      <Label htmlFor="checked-disabled" className="text-gray-400">
        Checked and disabled
      </Label>
    </div>
  ),
}

export const MultipleOptions: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Checkbox id="training" />
        <Label htmlFor="training">Send training reminders</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="cycle" />
        <Label htmlFor="cycle">Cycle phase notifications</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="updates" />
        <Label htmlFor="updates">Product updates and news</Label>
      </div>
    </div>
  ),
}
