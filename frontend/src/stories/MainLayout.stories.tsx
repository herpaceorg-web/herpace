import type { Meta, StoryObj } from '@storybook/react-vite'
import { MainLayout } from '@/components/layout/MainLayout'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
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
  render: () => (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-normal text-primary font-[family-name:'Petrona'] leading-none">HerPace</h1>

            {/* Navigation */}
            <nav className="flex items-center gap-6">
              <a
                href="#"
                className="text-sm font-medium text-primary"
              >
                Training Hub
              </a>
              <a
                href="#"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Calendar
              </a>
            </nav>
          </div>

          {/* User menu */}
          <div className="flex items-center gap-4">
            <button
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
    </div>
  ),
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
  render: () => (
    <MainLayout>
      <div className="space-y-4">
        <h2 className="text-3xl font-bold">Training Hub</h2>
        <p className="text-muted-foreground">
          This is the dashboard page content. The Training Hub link is highlighted in the navigation.
        </p>
      </div>
    </MainLayout>
  ),
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
  render: () => (
    <MainLayout>
      <div className="space-y-4">
        <h2 className="text-3xl font-bold">Calendar</h2>
        <p className="text-muted-foreground">
          This is the calendar page content. The Calendar link is highlighted in the navigation.
        </p>
      </div>
    </MainLayout>
  ),
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
  render: () => (
    <MainLayout>
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
    </MainLayout>
  ),
}
