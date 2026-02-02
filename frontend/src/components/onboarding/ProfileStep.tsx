import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { profileStepSchema, type ProfileFormValues } from '@/schemas/onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface ProfileStepProps {
  onComplete: (data: ProfileFormValues) => void
  defaultValues?: Partial<ProfileFormValues>
}

export function ProfileStep({ onComplete, defaultValues }: ProfileStepProps) {
  const today = new Date()
  const defaultBirthDate = new Date(
    today.getFullYear() - 30,
    today.getMonth(),
    today.getDate()
  )
  const resolvedDefaults: Partial<ProfileFormValues> = {
    cycleRegularity: 'Regular' as const,
    distanceUnit: 'Miles' as const,
    dateOfBirth: defaultBirthDate,
    ...defaultValues
  }
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileStepSchema) as any,
    defaultValues: resolvedDefaults
  })

  const cycleRegularity = watch('cycleRegularity')
  const showCycleFields = cycleRegularity !== 'DoNotTrack'
  const dateOfBirth = watch('dateOfBirth')
  const lastPeriodStart = watch('lastPeriodStart')

  return (
    <form onSubmit={handleSubmit(onComplete)} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Enter your name"
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Fitness Level */}
      <div className="space-y-2">
        <Label htmlFor="fitnessLevel">Fitness Level *</Label>
        <Select
          onValueChange={(value: 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite') => setValue('fitnessLevel', value)}
          defaultValue={defaultValues?.fitnessLevel}
          disabled={isSubmitting}
        >
          <SelectTrigger id="fitnessLevel">
            <SelectValue placeholder="Select your fitness level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Beginner">Beginner - New to running</SelectItem>
            <SelectItem value="Intermediate">Intermediate - Regular runner</SelectItem>
            <SelectItem value="Advanced">Advanced - Experienced runner</SelectItem>
            <SelectItem value="Elite">Elite - Competitive athlete</SelectItem>
          </SelectContent>
        </Select>
        {errors.fitnessLevel && (
          <p className="text-sm text-destructive">{errors.fitnessLevel.message}</p>
        )}
      </div>

      {/* Distance Unit */}
      <div className="space-y-2">
        <Label>Distance Unit *</Label>
        <RadioGroup
          onValueChange={(value: 'Kilometers' | 'Miles') => setValue('distanceUnit', value)}
          defaultValue={defaultValues?.distanceUnit || 'Miles'}
          disabled={isSubmitting}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Miles" id="miles" />
            <Label htmlFor="miles" className="font-normal cursor-pointer">
              Miles
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Kilometers" id="kilometers" />
            <Label htmlFor="kilometers" className="font-normal cursor-pointer">
              Kilometers
            </Label>
          </div>
        </RadioGroup>
        {errors.distanceUnit && (
          <p className="text-sm text-destructive">{errors.distanceUnit.message}</p>
        )}
      </div>

      {/* Date of Birth (Optional) */}
      <div className="space-y-2">
        <Label>Date of Birth (Optional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !dateOfBirth && 'text-muted-foreground'
              )}
              disabled={isSubmitting}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateOfBirth ? format(dateOfBirth, 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateOfBirth}
              defaultMonth={dateOfBirth ?? defaultBirthDate}
              onSelect={(date: Date | undefined) => setValue('dateOfBirth', date)}
              captionLayout="dropdown"
              fromYear={1900}
              toYear={today.getFullYear()}
              disabled={(date: Date) => date > new Date() || date < new Date('1900-01-01')}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Typical Weekly Mileage (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="weeklyMileage">Typical Weekly Mileage (Optional)</Label>
        <Input
          id="weeklyMileage"
          type="number"
          step="0.1"
          {...register('typicalWeeklyMileage', { valueAsNumber: true })}
          placeholder="e.g., 25"
          disabled={isSubmitting}
        />
        {errors.typicalWeeklyMileage && (
          <p className="text-sm text-destructive">{errors.typicalWeeklyMileage.message}</p>
        )}
      </div>

      {/* Cycle Regularity */}
      <div className="space-y-2">
        <Label htmlFor="cycleRegularity">Menstrual Cycle Tracking *</Label>
        <Select
          onValueChange={(value: 'Regular' | 'Irregular' | 'DoNotTrack') => setValue('cycleRegularity', value)}
          defaultValue={defaultValues?.cycleRegularity || 'Regular'}
          disabled={isSubmitting}
        >
          <SelectTrigger id="cycleRegularity">
            <SelectValue placeholder="Select cycle regularity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Regular">Regular cycle - Track for better training</SelectItem>
            <SelectItem value="Irregular">Irregular cycle - Track with flexibility</SelectItem>
            <SelectItem value="DoNotTrack">I prefer not to track</SelectItem>
          </SelectContent>
        </Select>
        {errors.cycleRegularity && (
          <p className="text-sm text-destructive">{errors.cycleRegularity.message}</p>
        )}
      </div>

      {/* Conditional Cycle Fields */}
      {showCycleFields && (
        <>
          {/* Cycle Length */}
          <div className="space-y-2">
            <Label htmlFor="cycleLength">Cycle Length (days) *</Label>
            <Input
              id="cycleLength"
              type="number"
              {...register('cycleLength', { valueAsNumber: true })}
              placeholder="28"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Typically 21-45 days
            </p>
            {errors.cycleLength && (
              <p className="text-sm text-destructive">{errors.cycleLength.message}</p>
            )}
          </div>

          {/* Last Period Start */}
          <div className="space-y-2">
            <Label>Last Period Start Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !lastPeriodStart && 'text-muted-foreground'
                  )}
                  disabled={isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {lastPeriodStart ? format(lastPeriodStart, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={lastPeriodStart}
                  onSelect={(date: Date | undefined) => setValue('lastPeriodStart', date)}
                  disabled={(date: Date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.lastPeriodStart && (
              <p className="text-sm text-destructive">{errors.lastPeriodStart.message}</p>
            )}
          </div>
        </>
      )}

      {/* Personal Records Section (Optional) */}
      <div className="space-y-4 pt-4 border-t">
        <div>
          <Label className="text-base">Personal Records (Optional)</Label>
          <p className="text-sm text-muted-foreground">
            Help us create a better training plan by sharing your best race times
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 5K PR */}
          <div className="space-y-2">
            <Label htmlFor="fiveKPR">5K PR</Label>
            <Input
              id="fiveKPR"
              {...register('fiveKPR')}
              placeholder="0:25:30"
              disabled={isSubmitting}
            />
            {errors.fiveKPR && (
              <p className="text-sm text-destructive">{errors.fiveKPR.message}</p>
            )}
          </div>

          {/* 10K PR */}
          <div className="space-y-2">
            <Label htmlFor="tenKPR">10K PR</Label>
            <Input
              id="tenKPR"
              {...register('tenKPR')}
              placeholder="0:55:20"
              disabled={isSubmitting}
            />
            {errors.tenKPR && (
              <p className="text-sm text-destructive">{errors.tenKPR.message}</p>
            )}
          </div>

          {/* Half Marathon PR */}
          <div className="space-y-2">
            <Label htmlFor="halfMarathonPR">Half Marathon PR</Label>
            <Input
              id="halfMarathonPR"
              {...register('halfMarathonPR')}
              placeholder="1:45:30"
              disabled={isSubmitting}
            />
            {errors.halfMarathonPR && (
              <p className="text-sm text-destructive">{errors.halfMarathonPR.message}</p>
            )}
          </div>

          {/* Marathon PR */}
          <div className="space-y-2">
            <Label htmlFor="marathonPR">Marathon PR</Label>
            <Input
              id="marathonPR"
              {...register('marathonPR')}
              placeholder="3:30:00"
              disabled={isSubmitting}
            />
            {errors.marathonPR && (
              <p className="text-sm text-destructive">{errors.marathonPR.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Continue'}
      </Button>
    </form>
  )
}
