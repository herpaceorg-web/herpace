import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <p className="text-sm">Content for Tab 1</p>
      </TabsContent>
      <TabsContent value="tab2">
        <p className="text-sm">Content for Tab 2</p>
      </TabsContent>
      <TabsContent value="tab3">
        <p className="text-sm">Content for Tab 3</p>
      </TabsContent>
    </Tabs>
  ),
}

export const CyclePhases: Story = {
  render: () => (
    <Tabs defaultValue="follicular" className="w-[500px]">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="menstrual">Menstrual</TabsTrigger>
        <TabsTrigger value="follicular">Follicular</TabsTrigger>
        <TabsTrigger value="ovulatory">Ovulatory</TabsTrigger>
        <TabsTrigger value="luteal">Luteal</TabsTrigger>
      </TabsList>
      <TabsContent value="menstrual" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Menstrual Phase</CardTitle>
            <CardDescription>Days 1-5 of your cycle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">Focus on recovery and gentle movement.</p>
            <p className="text-sm text-gray-600">Recommended: Easy runs, yoga, walking</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="follicular" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Follicular Phase</CardTitle>
            <CardDescription>Days 6-14 of your cycle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">Great time for high-intensity workouts and building strength.</p>
            <p className="text-sm text-gray-600">Recommended: Tempo runs, intervals, strength training</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="ovulatory" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Ovulatory Phase</CardTitle>
            <CardDescription>Days 15-17 of your cycle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">Peak energy and strength period.</p>
            <p className="text-sm text-gray-600">Recommended: Long runs, speed work, PRs</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="luteal" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Luteal Phase</CardTitle>
            <CardDescription>Days 18-28 of your cycle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">Energy may fluctuate, focus on steady efforts.</p>
            <p className="text-sm text-gray-600">Recommended: Moderate runs, recovery sessions</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
}

export const TrainingStats: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[450px]">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="this-week">This Week</TabsTrigger>
        <TabsTrigger value="this-month">This Month</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="text-2xl font-bold">42</div>
            <div className="text-sm text-gray-500">Total Sessions</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-2xl font-bold">215 km</div>
            <div className="text-sm text-gray-500">Total Distance</div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="this-week" className="space-y-4 mt-4">
        <div className="p-4 border rounded-lg">
          <div className="text-2xl font-bold">5</div>
          <div className="text-sm text-gray-500">Sessions Completed</div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-2xl font-bold">38 km</div>
          <div className="text-sm text-gray-500">Distance This Week</div>
        </div>
      </TabsContent>
      <TabsContent value="this-month" className="space-y-4 mt-4">
        <div className="p-4 border rounded-lg">
          <div className="text-2xl font-bold">18</div>
          <div className="text-sm text-gray-500">Sessions This Month</div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-2xl font-bold">142 km</div>
          <div className="text-sm text-gray-500">Distance This Month</div>
        </div>
      </TabsContent>
    </Tabs>
  ),
}
