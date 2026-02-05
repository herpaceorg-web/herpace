import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { raceStepSchema, type RaceFormValues } from '@/schemas/onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface RaceStepProps {
  onComplete: (data: RaceFormValues) => void
  onBack: () => void
  defaultValues?: Partial<RaceFormValues>
}

const STANDARD_DISTANCES = {
  FiveK: 5,
  TenK: 10,
  HalfMarathon: 21.0975,
  Marathon: 42.195,
  Custom: 0
}

export function RaceStep({ onComplete, onBack, defaultValues }: RaceStepProps) {
  const resolvedDefaults: Partial<RaceFormValues> = defaultValues || {
    distanceType: 'FiveK' as const,
    distance: 5,
    trainingStartDate: new Date(Date.now() + 86400000) // Tomorrow
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<RaceFormValues>({
    resolver: zodResolver(raceStepSchema) as any,
    defaultValues: resolvedDefaults
  })

  const raceDate = watch('raceDate')
  const trainingStartDate = watch('trainingStartDate')

  // Update distance when distance type changes
  const handleDistanceTypeChange = (value: 'FiveK' | 'TenK' | 'HalfMarathon' | 'Marathon' | 'Custom') => {
    setValue('distanceType', value)
    if (value !== 'Custom') {
      const standardDistance = STANDARD_DISTANCES[value]
      setValue('distance', standardDistance)
    }
  }

  return (
    <form onSubmit={handleSubmit(onComplete)} className="space-y-6">
      {/* Your Race Section */}
      <div>
        <h3 className="font-petrona text-2xl font-normal text-foreground mb-1">Your Race</h3>
        <p className="text-sm font-normal text-[#696863] mb-4">Tell us about your race</p>
      </div>

      {/* Race Name */}
      <div className="space-y-2">
        <Label htmlFor="raceName">Race Name *</Label>
        <Input
          id="raceName"
          {...register('raceName')}
          placeholder="e.g., Chicago Marathon 2026"
          disabled={isSubmitting}
        />
        {errors.raceName && (
          <p className="text-sm text-destructive">{errors.raceName.message}</p>
        )}
      </div>

      {/* Race Date */}
      <div className="space-y-2">
        <Label>Race Date *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !raceDate && 'text-muted-foreground'
              )}
              disabled={isSubmitting}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {raceDate ? format(raceDate, 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={raceDate}
              onSelect={(date: Date | undefined) => date && setValue('raceDate', date)}
              disabled={(date: Date) => {
                const minDate = new Date()
                minDate.setDate(minDate.getDate() + 7)
                return date < minDate
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">
          Race must be at least 7 days in the future
        </p>
        {errors.raceDate && (
          <p className="text-sm text-destructive">{errors.raceDate.message}</p>
        )}
      </div>

      <Separator />

      {/* Your Training Plan Section */}
      <div>
        <h3 className="font-petrona text-2xl font-normal text-foreground mb-1">Your Training Plan</h3>
        <p className="text-sm font-normal text-[#696863] mb-4">Customize your training</p>
      </div>

      {/* Training Start Date */}
      <div className="space-y-2">
        <Label>Training Start Date *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !trainingStartDate && 'text-muted-foreground'
              )}
              disabled={isSubmitting}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {trainingStartDate ? format(trainingStartDate, 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={trainingStartDate}
              onSelect={(date: Date | undefined) => date && setValue('trainingStartDate', date)}
              disabled={(date: Date) => {
                const tomorrow = new Date()
                tomorrow.setDate(tomorrow.getDate() + 1)

                // Can't select before tomorrow
                if (date < tomorrow) return true

                // Can't select on or after race date
                if (raceDate && date >= raceDate) return true

                return false
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">
          When do you want to start training? Must be before your race date.
        </p>
        {errors.trainingStartDate && (
          <p className="text-sm text-destructive">{errors.trainingStartDate.message}</p>
        )}
      </div>

      {/* Distance Type */}
      <div className="space-y-2">
        <Label htmlFor="distanceType">Distance Type *</Label>
        <Select
          onValueChange={handleDistanceTypeChange}
          defaultValue={defaultValues?.distanceType || 'HalfMarathon'}
          disabled={isSubmitting}
        >
          <SelectTrigger id="distanceType">
            <SelectValue placeholder="Select distance type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="HalfMarathon">Half Marathon (21.1 km)</SelectItem>
            <SelectItem value="Marathon">Marathon (42.2 km)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          HerPace is excited to offer Training Plans for all distances in the near future
        </p>
        {errors.distanceType && (
          <p className="text-sm text-destructive">{errors.distanceType.message}</p>
        )}
      </div>

      {/* Goal Time (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="goalTime">Goal Time (Optional)</Label>
        <Input
          id="goalTime"
          {...register('goalTime')}
          placeholder="H, H:MM, or H:MM:SS (e.g., 3:45 or 3:45:00)"
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">
          Format: Hours, Hours:Minutes, or Hours:Minutes:Seconds
        </p>
        {errors.goalTime && (
          <p className="text-sm text-destructive">{errors.goalTime.message}</p>
        )}
      </div>

      <Separator />

      {/* Your Training Sessions Section */}
      <div>
        <h3 className="font-petrona text-2xl font-normal text-foreground mb-1">Your Training Sessions</h3>
        <p className="text-sm font-normal text-[#696863] mb-4">Set your goals</p>
      </div>

      {/* Race Completion Goal (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="raceCompletionGoal">Your Goal (Optional)</Label>
        <Textarea
          id="raceCompletionGoal"
          {...register('raceCompletionGoal')}
          placeholder="e.g., Complete my first marathon, qualify for Boston, or just have fun!"
          disabled={isSubmitting}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Tell us what you want to achieve with this race
        </p>
        {errors.raceCompletionGoal && (
          <p className="text-sm text-destructive">{errors.raceCompletionGoal.message}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1"
        >
          Back
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Saving...' : 'Generate Plan'}
        </Button>
      </div>
    </form>
  )
}
