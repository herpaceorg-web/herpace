import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Check } from 'lucide-react'
import { raceStepSchema, type RaceFormValues } from '@/schemas/onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { DurationInput } from '@/components/ui/duration-input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface RaceStepProps {
  onComplete: (data: RaceFormValues) => void
  onBack: () => void
  defaultValues?: Partial<RaceFormValues>
  fitnessLevel?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite'
}

const STANDARD_DISTANCES = {
  FiveK: 5,
  TenK: 10,
  HalfMarathon: 21.0975,
  Marathon: 42.195,
  Custom: 0
}

export function RaceStep({ onComplete, onBack, defaultValues, fitnessLevel }: RaceStepProps) {
  const eightWeeksFromNow = new Date()
  eightWeeksFromNow.setDate(eightWeeksFromNow.getDate() + 56)

  const resolvedDefaults: Partial<RaceFormValues> = defaultValues || {
    distanceType: 'HalfMarathon' as const,
    distance: 21.0975,
    raceDate: eightWeeksFromNow,
    trainingStartDate: new Date(Date.now() + 86400000) // Tomorrow
  }

  const [goalType, setGoalType] = useState<'time' | 'completion'>('completion')
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [trainingDaysError, setTrainingDaysError] = useState<string>('')
  const [planDateError, setPlanDateError] = useState<string>('')

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
  const goalTime = watch('goalTime')
  const planLength = watch('planLength')
  const longRunDay = watch('longRunDay')

  // Update distance when distance type changes
  const handleDistanceTypeChange = (value: 'FiveK' | 'TenK' | 'HalfMarathon' | 'Marathon' | 'Custom') => {
    setValue('distanceType', value)
    if (value !== 'Custom') {
      const standardDistance = STANDARD_DISTANCES[value]
      setValue('distance', standardDistance)
    }
  }

  // Update training start date when plan length or race date changes
  useEffect(() => {
    if (raceDate && planLength) {
      const weeks = typeof planLength === 'number' ? planLength : 16
      const startDate = new Date(raceDate)
      startDate.setDate(startDate.getDate() - (weeks * 7))
      setValue('trainingStartDate', startDate)
    }
  }, [planLength, raceDate, setValue])

  // Validate training days (minimum 3)
  useEffect(() => {
    if (selectedDays.length > 0 && selectedDays.length < 3) {
      setTrainingDaysError('Please select at least 3 training days per week')
    } else {
      setTrainingDaysError('')
    }
  }, [selectedDays])

  // Validate plan start date matches plan length
  useEffect(() => {
    if (trainingStartDate && raceDate && planLength) {
      const daysDiff = Math.floor((raceDate.getTime() - trainingStartDate.getTime()) / (1000 * 60 * 60 * 24))
      const weeksDiff = daysDiff / 7
      const requiredWeeks = typeof planLength === 'number' ? planLength : 16

      if (weeksDiff < requiredWeeks) {
        setPlanDateError(`Plan start date must be at least ${requiredWeeks} weeks before race date`)
      } else {
        setPlanDateError('')
      }
    }
  }, [trainingStartDate, raceDate, planLength])

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

      {/* Distance Type */}
      <div className="space-y-2">
        <Label htmlFor="distanceType">Distance *</Label>
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
        <p className="text-xs text-[#696863]">
          HerPace is excited to offer Training Plans for all distances in the near future
        </p>
        {errors.distanceType && (
          <p className="text-sm text-destructive">{errors.distanceType.message}</p>
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
              defaultMonth={eightWeeksFromNow}
              disabled={(date: Date) => {
                const minDate = new Date()
                minDate.setDate(minDate.getDate() + 56)
                return date < minDate
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <p className="text-xs text-[#696863]">
          Race must be at least 8 weeks in the future
        </p>
        {errors.raceDate && (
          <p className="text-sm text-destructive">{errors.raceDate.message}</p>
        )}
      </div>

      {/* Race Goal */}
      <div className="space-y-4">
        <Label>Race goal type *</Label>
        <RadioGroup
          value={goalType}
          onValueChange={(value: 'time' | 'completion') => {
            setGoalType(value)
            if (value === 'completion') {
              setValue('goalTime', undefined)
            }
          }}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="time" id="timeGoal" />
            <Label htmlFor="timeGoal" className="text-sm font-normal text-foreground cursor-pointer">
              Time Goal
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="completion" id="completionGoal" />
            <Label htmlFor="completionGoal" className="text-sm font-normal text-foreground cursor-pointer">
              Completion Goal
            </Label>
          </div>
        </RadioGroup>

        {goalType === 'time' && (
          <div className="space-y-2">
            <Label htmlFor="goalTime" className="text-sm font-normal text-foreground">Race goal description</Label>
            <DurationInput
              id="goalTime"
              value={goalTime}
              onChange={(value) => setValue('goalTime', value)}
              disabled={isSubmitting}
            />
            {errors.goalTime && (
              <p className="text-sm text-destructive">{errors.goalTime.message}</p>
            )}
          </div>
        )}

        {goalType === 'completion' && (
          <div className="space-y-2">
            <Label className="text-sm font-normal text-foreground">Race goal description</Label>
            <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2">
              <p className="text-sm text-muted-foreground">
                Just looking to complete the race - no specific time goal
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Race Description (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="raceCompletionGoal" className="text-sm font-normal text-foreground">Race Description (Optional)</Label>
        <Textarea
          id="raceCompletionGoal"
          {...register('raceCompletionGoal')}
          placeholder="e.g., Have fun, don't get injured, qualify for boston"
          disabled={isSubmitting}
          rows={3}
        />
        <p className="text-xs text-[#696863]">
          What do you hope to achieve with this race?
        </p>
        {errors.raceCompletionGoal && (
          <p className="text-sm text-destructive">{errors.raceCompletionGoal.message}</p>
        )}
      </div>

      <Separator />

      {/* Your Training Plan Section */}
      <div>
        <h3 className="font-petrona text-2xl font-normal text-foreground mb-1">Your Training Plan</h3>
        <p className="text-sm font-normal text-[#696863] mb-4">Customize your training</p>
      </div>

      {/* Plan Length */}
      <div className="space-y-2">
        <Label htmlFor="planLength" className="text-sm font-normal text-foreground">Plan Length *</Label>
        <Select
          onValueChange={(value) => setValue('planLength', Number(value))}
          defaultValue="16"
          disabled={isSubmitting}
        >
          <SelectTrigger id="planLength">
            <SelectValue placeholder="Select plan length" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="8">
              8 weeks (2 months) - Experienced runners with a solid base{fitnessLevel === 'Elite' && ' (Recommended)'}
            </SelectItem>
            <SelectItem value="12">
              12 weeks (3 months) - Standard training period{fitnessLevel === 'Advanced' && ' (Recommended)'}
            </SelectItem>
            <SelectItem value="16">
              16 weeks (4 months) - Balanced preparation with gradual progression{fitnessLevel === 'Intermediate' && ' (Recommended)'}
            </SelectItem>
            <SelectItem value="20">
              20 weeks (5 months) - Extended training for major goals
            </SelectItem>
            <SelectItem value="24">
              24 weeks (6 months) - Comprehensive preparation for first-timers{fitnessLevel === 'Beginner' && ' (Recommended)'}
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-[#696863]">
          Choose a plan length that fits your experience and race goals
        </p>
      </div>

      {/* Plan Start Date */}
      <div className="space-y-2">
        <Label>Plan Start Date *</Label>
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
        <p className="text-xs text-[#696863]">
          When do you want to start your plan? Must be before your race date.
        </p>
        {planDateError && (
          <p className="text-sm text-destructive">{planDateError}</p>
        )}
        {errors.trainingStartDate && (
          <p className="text-sm text-destructive">{errors.trainingStartDate.message}</p>
        )}
      </div>

      <Separator />

      {/* Your Training Sessions Section */}
      <div>
        <h3 className="font-petrona text-2xl font-normal text-foreground mb-1">Your Training Sessions</h3>
        <p className="text-sm font-normal text-[#696863] mb-4">Choose your training days</p>
      </div>

      {/* Training Days */}
      <div className="space-y-2">
        <Label className="text-sm font-normal text-foreground">Training Days *</Label>
        <div className="flex flex-wrap gap-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
            const isSelected = selectedDays.includes(day)
            return (
              <button
                key={day}
                type="button"
                onClick={() => {
                  setSelectedDays(prev => {
                    const isCurrentlySelected = prev.includes(day)
                    if (isCurrentlySelected) {
                      // If deselecting a day that's the long run day, clear long run day
                      if (longRunDay === day) {
                        setValue('longRunDay', undefined)
                      }
                      return prev.filter(d => d !== day)
                    }
                    return [...prev, day]
                  })
                }}
                disabled={isSubmitting}
                className={cn(
                  'flex items-center gap-3 h-8 px-4 py-2 rounded-[10px] text-sm font-medium transition-colors',
                  isSelected
                    ? 'bg-secondary-foreground text-secondary'
                    : 'bg-secondary text-foreground'
                )}
              >
                {day}
                {isSelected && (
                  <div className="flex items-center justify-center w-4 h-4 rounded bg-secondary border border-primary">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
        {selectedDays.length > 0 && (
          <p className="text-sm font-medium text-foreground">
            {selectedDays.length} {selectedDays.length === 1 ? 'day' : 'days'} per week
          </p>
        )}
        <p className="text-xs text-[#696863]">
          3-5 days recommended for half marathon and marathon training
        </p>
        {trainingDaysError && (
          <p className="text-sm text-destructive">{trainingDaysError}</p>
        )}
      </div>

      {/* Long Run Day */}
      <div className="space-y-2">
        <Label className="text-sm font-normal text-foreground">Long Run Day *</Label>
        {selectedDays.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedDays.map((day) => {
              const fullDayName = day === 'Mon' ? 'Monday' :
                                  day === 'Tue' ? 'Tuesday' :
                                  day === 'Wed' ? 'Wednesday' :
                                  day === 'Thu' ? 'Thursday' :
                                  day === 'Fri' ? 'Friday' :
                                  day === 'Sat' ? 'Saturday' : 'Sunday'
              const isSelected = watch('longRunDay') === day
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setValue('longRunDay', isSelected ? undefined : day)}
                  disabled={isSubmitting}
                  className={cn(
                    'flex items-center gap-3 h-8 px-4 py-2 rounded-[10px] text-sm font-medium transition-colors',
                    isSelected
                      ? 'bg-secondary-foreground text-secondary'
                      : 'bg-secondary text-foreground'
                  )}
                >
                  {fullDayName}
                  {isSelected && (
                    <div className="flex items-center justify-center w-4 h-4 rounded bg-secondary border border-primary">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
        <p className="text-xs text-[#696863]">
          Choose which day you want to do your long run
        </p>
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
        <Button
          type="submit"
          disabled={isSubmitting || !!trainingDaysError || !!planDateError || selectedDays.length === 0}
          className="flex-1"
        >
          {isSubmitting ? 'Saving...' : 'Generate Plan'}
        </Button>
      </div>
    </form>
  )
}
