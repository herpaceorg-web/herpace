import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { profileStepSchema, type ProfileFormValues } from '@/schemas/onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NumberInput } from '@/components/ui/number-input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DurationInput } from '@/components/ui/duration-input'
import { cn } from '@/lib/utils'

interface ProfileStepProps {
  onComplete: (data: ProfileFormValues) => void
  onNameChange?: (name: string) => void
  onBack?: () => void
  defaultValues?: Partial<ProfileFormValues>
}

export function ProfileStep({ onComplete, onNameChange, onBack, defaultValues }: ProfileStepProps) {
  const today = new Date()
  const defaultBirthDate = new Date(
    today.getFullYear() - 30,
    today.getMonth(),
    today.getDate()
  )
  const resolvedDefaults: Partial<ProfileFormValues> = {
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

  const dateOfBirth = watch('dateOfBirth')
  const typicalWeeklyMileage = watch('typicalWeeklyMileage')

  // Watch PR values for DurationInput
  const fiveKPR = watch('fiveKPR')
  const tenKPR = watch('tenKPR')
  const halfMarathonPR = watch('halfMarathonPR')
  const marathonPR = watch('marathonPR')

  // Notify parent when name input loses focus
  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (onNameChange && e.target.value) {
      onNameChange(e.target.value)
    }
  }

  return (
    <form onSubmit={handleSubmit(onComplete)} className="space-y-6">
      {/* The Basics Section */}
      <div>
        <h3 className="font-petrona text-2xl font-normal text-foreground mb-1">The Basics</h3>
        <p className="text-sm font-normal text-[#696863] mb-4">Let's start with you</p>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-normal text-foreground">Name *</Label>
        <Input
          id="name"
          {...register('name')}
          onBlur={handleNameBlur}
          placeholder="Enter your name"
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Date of Birth (Optional) */}
      <div className="space-y-2">
        <Label className="text-sm font-normal text-foreground">Date of Birth (Optional)</Label>
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
          <PopoverContent className="w-auto p-0 rounded-lg" align="start">
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
              className="rounded-lg"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Divider */}
      <Separator className="my-6" />

      {/* Training Background Section */}
      <div>
        <h3 className="font-petrona text-2xl font-normal text-foreground mb-1">Training Background</h3>
        <p className="text-sm font-normal text-[#696863] mb-4">Tell us about your running history</p>
      </div>

      {/* Running Experience */}
      <div className="space-y-2">
        <Label htmlFor="fitnessLevel" className="text-sm font-normal text-foreground">Running Experience *</Label>
        <Select
          onValueChange={(value: 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite') => setValue('fitnessLevel', value)}
          defaultValue={defaultValues?.fitnessLevel}
          disabled={isSubmitting}
        >
          <SelectTrigger id="fitnessLevel">
            <SelectValue placeholder="Select your running experience" />
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

      {/* Current Weekly Mileage (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="weeklyMileage" className="text-sm font-normal text-foreground">Current Weekly Mileage (Optional)</Label>
        <NumberInput
          id="weeklyMileage"
          value={typicalWeeklyMileage || 0}
          onChange={(value) => setValue('typicalWeeklyMileage', value)}
          min={0}
          max={200}
          step={5}
          suffix="Miles"
          placeholder="e.g., 25"
          disabled={isSubmitting}
        />
        {errors.typicalWeeklyMileage && (
          <p className="text-sm text-destructive">{errors.typicalWeeklyMileage.message}</p>
        )}
      </div>

      {/* Preferred Distance Unit */}
      <div className="space-y-2">
        <Label className="text-sm font-normal text-foreground">Preferred Distance Unit *</Label>
        <RadioGroup
          onValueChange={(value: 'Kilometers' | 'Miles') => setValue('distanceUnit', value)}
          defaultValue={defaultValues?.distanceUnit || 'Miles'}
          disabled={isSubmitting}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Miles" id="miles" />
            <Label htmlFor="miles" className="text-sm font-normal cursor-pointer">
              Miles
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Kilometers" id="kilometers" />
            <Label htmlFor="kilometers" className="text-sm font-normal cursor-pointer">
              Kilometers
            </Label>
          </div>
        </RadioGroup>
        {errors.distanceUnit && (
          <p className="text-sm text-destructive">{errors.distanceUnit.message}</p>
        )}
      </div>

      {/* Personal Records Section (Optional) */}
      <div className="space-y-4">
        <div>
          <h4 className="font-petrona text-lg font-normal text-foreground mb-1">Personal Records (Optional)</h4>
          <p className="text-sm font-normal text-[#696863]">
            Help us create a better training plan by sharing your best race times
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 5K PR */}
          <div className="space-y-2">
            <Label htmlFor="fiveKPR" className="text-sm font-normal text-foreground">5K PR</Label>
            <DurationInput
              id="fiveKPR"
              value={fiveKPR}
              onChange={(value) => setValue('fiveKPR', value)}
              disabled={isSubmitting}
            />
            {errors.fiveKPR && (
              <p className="text-sm text-destructive">{errors.fiveKPR.message}</p>
            )}
          </div>

          {/* 10K PR */}
          <div className="space-y-2">
            <Label htmlFor="tenKPR" className="text-sm font-normal text-foreground">10K PR</Label>
            <DurationInput
              id="tenKPR"
              value={tenKPR}
              onChange={(value) => setValue('tenKPR', value)}
              disabled={isSubmitting}
            />
            {errors.tenKPR && (
              <p className="text-sm text-destructive">{errors.tenKPR.message}</p>
            )}
          </div>

          {/* Half Marathon PR */}
          <div className="space-y-2">
            <Label htmlFor="halfMarathonPR" className="text-sm font-normal text-foreground">Half Marathon PR</Label>
            <DurationInput
              id="halfMarathonPR"
              value={halfMarathonPR}
              onChange={(value) => setValue('halfMarathonPR', value)}
              disabled={isSubmitting}
            />
            {errors.halfMarathonPR && (
              <p className="text-sm text-destructive">{errors.halfMarathonPR.message}</p>
            )}
          </div>

          {/* Marathon PR */}
          <div className="space-y-2">
            <Label htmlFor="marathonPR" className="text-sm font-normal text-foreground">Marathon PR</Label>
            <DurationInput
              id="marathonPR"
              value={marathonPR}
              onChange={(value) => setValue('marathonPR', value)}
              disabled={isSubmitting}
            />
            {errors.marathonPR && (
              <p className="text-sm text-destructive">{errors.marathonPR.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-1"
          >
            Back
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className={onBack ? "flex-1" : "w-full"}>
          {isSubmitting ? 'Saving...' : 'Next: Your Cycle'}
        </Button>
      </div>
    </form>
  )
}
