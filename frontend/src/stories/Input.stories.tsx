import type { Meta, StoryObj } from '@storybook/react-vite'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const meta = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'date'],
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <div className="w-[350px]">
      <Input {...args} placeholder="Enter text..." />
    </div>
  ),
}

export const WithLabel: Story = {
  render: () => (
    <div className="w-[350px] space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
}

export const Password: Story = {
  render: () => (
    <div className="w-[350px] space-y-2">
      <Label htmlFor="password">Password</Label>
      <Input id="password" type="password" placeholder="Enter password" />
    </div>
  ),
}

export const Number: Story = {
  render: () => (
    <div className="w-[350px] space-y-2">
      <Label htmlFor="age">Age</Label>
      <Input id="age" type="number" placeholder="25" />
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="w-[350px] space-y-2">
      <Label htmlFor="disabled">Disabled Input</Label>
      <Input id="disabled" placeholder="Cannot edit" disabled />
    </div>
  ),
}

export const FormExample: Story = {
  render: () => (
    <div className="w-[400px] space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" placeholder="Jane Doe" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email-form">Email</Label>
        <Input id="email-form" type="email" placeholder="jane@example.com" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="weight">Weight (kg)</Label>
        <Input id="weight" type="number" placeholder="65" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="race-date">Race Date</Label>
        <Input id="race-date" type="date" />
      </div>
    </div>
  ),
}
