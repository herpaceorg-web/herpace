import type { Meta, StoryObj } from '@storybook/react-vite'
import { Separator } from '@/components/ui/separator'

const meta = {
  title: 'Components/Separator',
  component: Separator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: () => (
    <div className="w-[300px]">
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Training Sessions</h4>
        <p className="text-sm text-gray-500">Manage your workout schedule</p>
      </div>
      <Separator className="my-4" />
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Race Calendar</h4>
        <p className="text-sm text-gray-500">Track your upcoming races</p>
      </div>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div className="flex h-20 items-center space-x-4">
      <div>
        <div className="text-2xl font-bold">42</div>
        <div className="text-xs text-gray-500">Sessions</div>
      </div>
      <Separator orientation="vertical" />
      <div>
        <div className="text-2xl font-bold">215 km</div>
        <div className="text-xs text-gray-500">Distance</div>
      </div>
      <Separator orientation="vertical" />
      <div>
        <div className="text-2xl font-bold">3</div>
        <div className="text-xs text-gray-500">Races</div>
      </div>
    </div>
  ),
}

export const InForm: Story = {
  render: () => (
    <div className="w-[350px] space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Create Account</h3>
        <p className="text-sm text-gray-500">Enter your details below</p>
      </div>
      <Separator />
      <div className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          className="w-full px-3 py-2 border rounded-lg"
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
      <Separator />
      <div className="flex items-center gap-2">
        <input type="checkbox" id="terms" />
        <label htmlFor="terms" className="text-sm">
          I agree to the terms and conditions
        </label>
      </div>
    </div>
  ),
}

export const InMenu: Story = {
  render: () => (
    <div className="w-[200px] rounded-lg border p-2">
      <div className="px-2 py-1.5 text-sm font-semibold">Account</div>
      <div className="px-2 py-1.5 text-sm hover:bg-gray-100 rounded cursor-pointer">Profile</div>
      <div className="px-2 py-1.5 text-sm hover:bg-gray-100 rounded cursor-pointer">Settings</div>
      <Separator className="my-1" />
      <div className="px-2 py-1.5 text-sm font-semibold">Training</div>
      <div className="px-2 py-1.5 text-sm hover:bg-gray-100 rounded cursor-pointer">Dashboard</div>
      <div className="px-2 py-1.5 text-sm hover:bg-gray-100 rounded cursor-pointer">Calendar</div>
      <div className="px-2 py-1.5 text-sm hover:bg-gray-100 rounded cursor-pointer">History</div>
      <Separator className="my-1" />
      <div className="px-2 py-1.5 text-sm text-red-600 hover:bg-gray-100 rounded cursor-pointer">
        Logout
      </div>
    </div>
  ),
}
