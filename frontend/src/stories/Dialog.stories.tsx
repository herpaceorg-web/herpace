import type { Meta, StoryObj } from '@storybook/react-vite'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Complete Session</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Session as Complete</DialogTitle>
          <DialogDescription>
            How did your training session go? You can add notes about your performance.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Session Notes</Label>
            <Input id="notes" placeholder="Felt great today, maintained good pace..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const RaceResult: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add Race Result</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter Race Results</DialogTitle>
          <DialogDescription>
            Record your race time and details
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hours">Hours</Label>
              <Input id="hours" type="number" placeholder="1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minutes">Minutes</Label>
              <Input id="minutes" type="number" placeholder="45" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seconds">Seconds</Label>
              <Input id="seconds" type="number" placeholder="30" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Save Result</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const Simple: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">View Details</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Training Session Details</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-600">
            This is an easy run session designed to build your aerobic base.
            Keep your heart rate in zone 2 throughout the run.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  ),
}
