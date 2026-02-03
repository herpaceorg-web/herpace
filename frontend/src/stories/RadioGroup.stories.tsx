import type { Meta, StoryObj } from '@storybook/react-vite'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

const meta = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="option1">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option1" id="option1" />
        <Label htmlFor="option1">Option 1</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option2" id="option2" />
        <Label htmlFor="option2">Option 2</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option3" id="option3" />
        <Label htmlFor="option3">Option 3</Label>
      </div>
    </RadioGroup>
  ),
}

export const ExperienceLevel: Story = {
  render: () => (
    <div className="space-y-3">
      <Label className="text-base font-semibold">Running Experience</Label>
      <RadioGroup defaultValue="intermediate">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="beginner" id="beginner" />
          <Label htmlFor="beginner">
            <div>
              <div className="font-medium">Beginner</div>
              <div className="text-sm text-gray-500">0-6 months of running</div>
            </div>
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="intermediate" id="intermediate" />
          <Label htmlFor="intermediate">
            <div>
              <div className="font-medium">Intermediate</div>
              <div className="text-sm text-gray-500">6 months - 2 years</div>
            </div>
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="advanced" id="advanced" />
          <Label htmlFor="advanced">
            <div>
              <div className="font-medium">Advanced</div>
              <div className="text-sm text-gray-500">2+ years of consistent running</div>
            </div>
          </Label>
        </div>
      </RadioGroup>
    </div>
  ),
}

export const SessionFeedback: Story = {
  render: () => (
    <div className="space-y-3">
      <Label className="text-base font-semibold">How did the session feel?</Label>
      <RadioGroup>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="easy" id="easy" />
          <Label htmlFor="easy">Easy - Could have done more</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="moderate" id="moderate" />
          <Label htmlFor="moderate">Moderate - Just right</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="hard" id="hard" />
          <Label htmlFor="hard">Hard - Very challenging</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="too-hard" id="too-hard" />
          <Label htmlFor="too-hard">Too Hard - Couldn't complete</Label>
        </div>
      </RadioGroup>
    </div>
  ),
}
