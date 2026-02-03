import type { Meta, StoryObj } from '@storybook/react-vite'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

const meta = {
  title: 'Components/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="w-[250px]">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
          <SelectItem value="option3">Option 3</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}

export const WithLabel: Story = {
  render: () => (
    <div className="w-[250px] space-y-2">
      <Label>Experience Level</Label>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select your level" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="beginner">Beginner</SelectItem>
          <SelectItem value="intermediate">Intermediate</SelectItem>
          <SelectItem value="advanced">Advanced</SelectItem>
          <SelectItem value="elite">Elite</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}

export const RaceDistance: Story = {
  render: () => (
    <div className="w-[250px] space-y-2">
      <Label>Race Distance</Label>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select distance" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="5k">5K</SelectItem>
          <SelectItem value="10k">10K</SelectItem>
          <SelectItem value="half">Half Marathon</SelectItem>
          <SelectItem value="full">Full Marathon</SelectItem>
          <SelectItem value="ultra">Ultra Marathon</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}

export const CyclePhase: Story = {
  render: () => (
    <div className="w-[250px] space-y-2">
      <Label>Current Cycle Phase</Label>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select phase" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="menstrual">Menstrual (Days 1-5)</SelectItem>
          <SelectItem value="follicular">Follicular (Days 6-14)</SelectItem>
          <SelectItem value="ovulatory">Ovulatory (Days 15-17)</SelectItem>
          <SelectItem value="luteal">Luteal (Days 18-28)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}
