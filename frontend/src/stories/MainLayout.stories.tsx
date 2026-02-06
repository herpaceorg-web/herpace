import type { Meta, StoryObj } from '@storybook/react-vite'
import { MainLayout } from '@/components/layout/MainLayout'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'

const meta = {
  title: 'Layout/MainLayout',
  component: MainLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <AuthProvider>
        <MemoryRouter>
          <Story />
        </MemoryRouter>
      </AuthProvider>
    ),
  ],
} satisfies Meta<typeof MainLayout>

export default meta
type Story = StoryObj<typeof meta>

// Navigation Bar Only
export const NavigationBar: Story = {
  args: {
    children: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Navigation bar is displayed above. This story shows just the header navigation.
        </p>
      </div>
    ),
  },
}

// Training Hub Active
export const TrainingHubActive: Story = {
  decorators: [
    (Story) => (
      <AuthProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Story />
        </MemoryRouter>
      </AuthProvider>
    ),
  ],
  args: {
    children: (
      <div className="space-y-4">
        <h2 className="text-3xl font-bold">Training Hub</h2>
        <p className="text-muted-foreground">
          This is the dashboard page content. The Training Hub link is highlighted in the navigation.
        </p>
      </div>
    ),
  },
}

// Calendar Active
export const CalendarActive: Story = {
  decorators: [
    (Story) => (
      <AuthProvider>
        <MemoryRouter initialEntries={['/calendar']}>
          <Story />
        </MemoryRouter>
      </AuthProvider>
    ),
  ],
  args: {
    children: (
      <div className="space-y-4">
        <h2 className="text-3xl font-bold">Calendar</h2>
        <p className="text-muted-foreground">
          This is the calendar page content. The Calendar link is highlighted in the navigation.
        </p>
      </div>
    ),
  },
}

// Full Layout Example
export const WithContent: Story = {
  decorators: [
    (Story) => (
      <AuthProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Story />
        </MemoryRouter>
      </AuthProvider>
    ),
  ],
  args: {
    children: (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg p-6">
          <h1 className="text-3xl font-bold mb-2">Half Marathon Training</h1>
          <p className="text-lg opacity-90">
            45 days until race day
          </p>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Today's Workout</h2>
          <p className="text-muted-foreground">
            30 Minute Easy Run - 5km at conversational pace
          </p>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
          <ul className="space-y-2">
            <li className="text-sm">Tomorrow: Speed Intervals - 6km</li>
            <li className="text-sm">Friday: Long Run - 15km</li>
            <li className="text-sm">Sunday: Recovery Run - 4km</li>
          </ul>
        </div>
      </div>
    ),
  },
}
