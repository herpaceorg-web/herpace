import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { RaceCompletionStatus } from '@/types/api'

const resultSchema = z.object({
  status: z.string(),
  hours: z.string().optional(),
  minutes: z.string().optional(),
  seconds: z.string().optional(),
}).refine(
  (data) => {
    const status = parseInt(data.status)
    if (status === RaceCompletionStatus.Completed) {
      const hours = parseInt(data.hours || '0')
      const minutes = parseInt(data.minutes || '0')
      const seconds = parseInt(data.seconds || '0')
      return hours >= 0 && minutes >= 0 && minutes < 60 && seconds >= 0 && seconds < 60 && (hours > 0 || minutes > 0 || seconds > 0)
    }
    return true
  },
  {
    message: 'Valid time is required for completed races',
    path: ['hours'],
  }
)

type ResultFormData = z.infer<typeof resultSchema>

interface RaceResultDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (status: RaceCompletionStatus, finishTime?: string) => Promise<void>
}

export function RaceResultDialog({ open, onOpenChange, onSubmit }: RaceResultDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResultFormData>({
    resolver: zodResolver(resultSchema),
    defaultValues: {
      status: String(RaceCompletionStatus.Completed),
    },
  })

  const selectedStatus = watch('status')
  const statusNum = parseInt(selectedStatus || String(RaceCompletionStatus.Completed))

  const onSubmitForm = async (data: ResultFormData) => {
    setIsSubmitting(true)
    try {
      const status = parseInt(data.status) as RaceCompletionStatus
      let finishTime: string | undefined

      if (status === RaceCompletionStatus.Completed) {
        const hours = parseInt(data.hours || '0')
        const minutes = parseInt(data.minutes || '0')
        const seconds = parseInt(data.seconds || '0')
        finishTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      }

      await onSubmit(status, finishTime)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Log Race Result</DialogTitle>
          <DialogDescription>
            Record how your race went. This will archive your training plan if completed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <div className="space-y-2">
            <Label>Result Status</Label>
            <RadioGroup defaultValue={String(RaceCompletionStatus.Completed)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value={String(RaceCompletionStatus.Completed)}
                  id="completed"
                  {...register('status')}
                />
                <Label htmlFor="completed" className="font-normal cursor-pointer">
                  Completed
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value={String(RaceCompletionStatus.DNS)}
                  id="dns"
                  {...register('status')}
                />
                <Label htmlFor="dns" className="font-normal cursor-pointer">
                  DNS (Did Not Start)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value={String(RaceCompletionStatus.DNF)}
                  id="dnf"
                  {...register('status')}
                />
                <Label htmlFor="dnf" className="font-normal cursor-pointer">
                  DNF (Did Not Finish)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {statusNum === RaceCompletionStatus.Completed && (
            <div className="space-y-2">
              <Label>Finish Time</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="HH"
                    min="0"
                    {...register('hours')}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Hours</p>
                </div>
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="MM"
                    min="0"
                    max="59"
                    {...register('minutes')}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Minutes</p>
                </div>
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="SS"
                    min="0"
                    max="59"
                    {...register('seconds')}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Seconds</p>
                </div>
              </div>
              {errors.hours && (
                <p className="text-sm text-destructive">{errors.hours.message}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Log Result'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
