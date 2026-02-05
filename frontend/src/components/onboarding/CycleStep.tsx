import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { NumberInput } from '@/components/ui/number-input'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import type { DateRange } from 'react-day-picker'

// Schema for Step 2: Cycle Tracking
const cycleStepSchema = z.object({
  cycleRegularity: z.enum(['Regular', 'Irregular', 'PreferNotToShare', 'DoNotTrack'], {
    message: 'Please select your cycle tracking preference'
  }),
  birthControlType: z.enum([
    'None',
    'Pill',
    'HormonalIUD',
    'CopperIUD',
    'Implant',
    'Shot',
    'Patch',
    'Ring',
    'Other'
  ], {
    message: 'Please select your birth control type'
  }),
  minCycleLength: z.number().min(20).max(40).default(27),
  maxCycleLength: z.number().min(20).max(40).default(30),
  periodDuration: z.number().min(1).max(10).optional(),
  symptomDaysBeforePeriod: z.number().min(0).max(14).optional(),
  conditions: z.array(z.enum(['PCOS', 'Endometriosis', 'Perimenopause', 'Menopause', 'PMDD', 'None'])).default([]),
  lastPeriodStartDate: z.date().optional(),
  lastPeriodEndDate: z.date().optional(),
}).refine(
  (data) => {
    // If both dates are provided, end date must be after start date
    if (data.lastPeriodStartDate && data.lastPeriodEndDate) {
      return data.lastPeriodEndDate > data.lastPeriodStartDate
    }
    return true
  },
  {
    message: 'Period end date must be after start date',
    path: ['lastPeriodEndDate']
  }
).refine(
  (data) => {
    // Min cycle length must be less than or equal to max
    return data.minCycleLength <= data.maxCycleLength
  },
  {
    message: 'Minimum cycle length must be less than or equal to maximum',
    path: ['maxCycleLength']
  }
)

export type CycleFormValues = z.output<typeof cycleStepSchema>

interface CycleStepProps {
  onComplete: (data: CycleFormValues) => void
  onBack: () => void
  defaultValues?: Partial<CycleFormValues>
}

export function CycleStep({ onComplete, onBack, defaultValues }: CycleStepProps) {
  const resolvedDefaults: Partial<CycleFormValues> = {
    minCycleLength: 27,
    maxCycleLength: 30,
    birthControlType: 'None',
    conditions: [],
    ...defaultValues
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<CycleFormValues>({
    resolver: zodResolver(cycleStepSchema) as any,
    defaultValues: resolvedDefaults
  })

  const cycleRegularity = watch('cycleRegularity')
  const birthControlType = watch('birthControlType')
  const minCycleLength = watch('minCycleLength')
  const maxCycleLength = watch('maxCycleLength')
  const periodDuration = watch('periodDuration')
  const symptomDaysBeforePeriod = watch('symptomDaysBeforePeriod')
  const conditions = watch('conditions')
  const lastPeriodStartDate = watch('lastPeriodStartDate')
  const lastPeriodEndDate = watch('lastPeriodEndDate')

  // Show cycle length and date fields only if Regular or Irregular
  const showCycleFields = cycleRegularity && (cycleRegularity === 'Regular' || cycleRegularity === 'Irregular')

  // Create date range object for the range picker
  const dateRange: DateRange | undefined = lastPeriodStartDate || lastPeriodEndDate
    ? { from: lastPeriodStartDate, to: lastPeriodEndDate }
    : undefined

  // Handle condition checkbox changes
  const handleConditionToggle = (condition: 'PCOS' | 'Endometriosis' | 'Perimenopause' | 'Menopause' | 'PMDD' | 'None') => {
    const currentConditions = conditions || []

    if (condition === 'None') {
      // If "None" is selected, clear all other conditions
      setValue('conditions', ['None'])
    } else {
      // Remove "None" if present and toggle the selected condition
      const withoutNone = currentConditions.filter(c => c !== 'None')
      if (withoutNone.includes(condition)) {
        setValue('conditions', withoutNone.filter(c => c !== condition))
      } else {
        setValue('conditions', [...withoutNone, condition])
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onComplete)} className="space-y-6">
      {/* Title + Subtitle */}
      <div>
        <h3 className="font-petrona text-2xl font-normal text-foreground mb-1">Your Cycle</h3>
        <p className="text-sm font-normal text-[#696863] mb-4">
          Help us sync your training with your body's natural rhythm
        </p>
      </div>

      {/* Cycle Tracking Dropdown */}
      <div className="space-y-2">
        <Label htmlFor="cycleRegularity" className="text-sm font-normal text-foreground">
          Do you have a menstrual cycle? *
        </Label>
        <Select
          onValueChange={(value: 'Regular' | 'Irregular' | 'PreferNotToShare' | 'DoNotTrack') => setValue('cycleRegularity', value)}
          defaultValue={defaultValues?.cycleRegularity}
          disabled={isSubmitting}
        >
          <SelectTrigger id="cycleRegularity">
            <SelectValue placeholder="Select your tracking preference" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Regular">Yes, my cycle is regular</SelectItem>
            <SelectItem value="Irregular">Yes, but my cycle is irregular</SelectItem>
            <SelectItem value="PreferNotToShare">I prefer not to share</SelectItem>
            <SelectItem value="DoNotTrack">I don't have a cycle</SelectItem>
          </SelectContent>
        </Select>
        {errors.cycleRegularity && (
          <p className="text-sm text-destructive">{errors.cycleRegularity.message}</p>
        )}
      </div>

      {/* Birth Control Dropdown - always visible */}
      <div className="space-y-2">
        <Label htmlFor="birthControlType" className="text-sm font-normal text-foreground">
          Are you on birth control? *
        </Label>
        <Select
          onValueChange={(value: 'None' | 'Pill' | 'HormonalIUD' | 'CopperIUD' | 'Implant' | 'Shot' | 'Patch' | 'Ring' | 'Other') => setValue('birthControlType', value)}
          defaultValue={defaultValues?.birthControlType || 'None'}
          disabled={isSubmitting}
        >
          <SelectTrigger id="birthControlType">
            <SelectValue placeholder="Select birth control type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="None">No</SelectItem>
            <SelectItem value="Pill">Yes, pill (oral contraceptive)</SelectItem>
            <SelectItem value="HormonalIUD">Yes, hormonal IUD</SelectItem>
            <SelectItem value="CopperIUD">Yes, copper IUD (non-hormonal)</SelectItem>
            <SelectItem value="Implant">Yes, implant</SelectItem>
            <SelectItem value="Shot">Yes, shot/injection</SelectItem>
            <SelectItem value="Patch">Yes, patch</SelectItem>
            <SelectItem value="Ring">Yes, ring</SelectItem>
            <SelectItem value="Other">Yes, other</SelectItem>
          </SelectContent>
        </Select>
        {errors.birthControlType && (
          <p className="text-sm text-destructive">{errors.birthControlType.message}</p>
        )}
      </div>

      {/* Conditions and Cycle Details - only show if tracking */}
      {showCycleFields && (
        <div className="space-y-6">
          {/* Conditions Checkboxes */}
          <div className="space-y-2">
            <Label className="text-sm font-normal text-foreground">
              Do you experience any of the following? (Optional)
            </Label>
            <div className="space-y-3">
              {(['PCOS', 'Endometriosis', 'Perimenopause', 'Menopause', 'PMDD', 'None'] as const).map((condition) => (
                <div key={condition} className="flex items-center space-x-2">
                  <Checkbox
                    id={condition}
                    checked={conditions?.includes(condition) || false}
                    onCheckedChange={() => handleConditionToggle(condition)}
                    disabled={isSubmitting}
                  />
                  <Label
                    htmlFor={condition}
                    className={cn(
                      "text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                      conditions?.includes(condition) ? "text-foreground" : "text-[#696863]"
                    )}
                  >
                    {condition === 'PCOS' ? 'PCOS (Polycystic Ovary Syndrome)' :
                     condition === 'PMDD' ? 'PMDD (Premenstrual Dysphoric Disorder)' :
                     condition}
                  </Label>
                </div>
              ))}
            </div>
            {errors.conditions && (
              <p className="text-sm text-destructive">{errors.conditions.message}</p>
            )}
          </div>

          {/* Cycle Length Range Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-normal text-foreground">
                Cycle Length Range
              </Label>
              <span className="text-sm font-medium text-foreground">
                {minCycleLength} - {maxCycleLength} days
              </span>
            </div>
            <Slider
              value={[minCycleLength || 27, maxCycleLength || 30]}
              onValueChange={(values) => {
                setValue('minCycleLength', values[0])
                setValue('maxCycleLength', values[1])
              }}
              min={20}
              max={40}
              step={1}
              className="w-full"
              disabled={isSubmitting}
            />
            <p className="text-xs text-[#696863]">
              Select your typical cycle length range (20-40 days)
            </p>
            {(errors.minCycleLength || errors.maxCycleLength) && (
              <p className="text-sm text-destructive">
                {errors.minCycleLength?.message || errors.maxCycleLength?.message}
              </p>
            )}
          </div>

          {/* Divider */}
          <Separator className="my-6" />

          {/* Your Period Section Title */}
          <div>
            <h4 className="font-petrona text-2xl font-normal text-foreground mb-1">Your Period</h4>
            <p className="text-sm font-normal text-[#696863] mb-4">
              Help us understand your period patterns and symptoms
            </p>
          </div>

          {/* Period Duration */}
          <div className="space-y-2">
            <Label htmlFor="periodDuration" className="text-sm font-normal text-foreground">
              Typical Period Duration (Optional)
            </Label>
            <NumberInput
              id="periodDuration"
              value={periodDuration || 0}
              onChange={(value) => setValue('periodDuration', value || undefined)}
              min={1}
              max={10}
              step={1}
              placeholder="e.g., 5"
              disabled={isSubmitting}
            />
            <p className="text-xs text-[#696863]">
              How many days does your period typically last?
            </p>
            {errors.periodDuration && (
              <p className="text-sm text-destructive">{errors.periodDuration.message}</p>
            )}
          </div>

          {/* Symptom Days Before Period */}
          <div className="space-y-2">
            <Label htmlFor="symptomDaysBeforePeriod" className="text-sm font-normal text-foreground">
              Days of Symptoms Before Period (Optional)
            </Label>
            <NumberInput
              id="symptomDaysBeforePeriod"
              value={symptomDaysBeforePeriod || 0}
              onChange={(value) => setValue('symptomDaysBeforePeriod', value || undefined)}
              min={0}
              max={14}
              step={1}
              placeholder="e.g., 3"
              disabled={isSubmitting}
            />
            <p className="text-xs text-[#696863]">
              How many days before your period do you experience symptoms that impact training?
            </p>
            {errors.symptomDaysBeforePeriod && (
              <p className="text-sm text-destructive">{errors.symptomDaysBeforePeriod.message}</p>
            )}
          </div>

          {/* Last Period Date Range */}
          <div className="space-y-2">
            <Label className="text-sm font-normal text-foreground">
              Last Period (Optional)
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dateRange && 'text-[#696863]'
                  )}
                  disabled={isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(dateRange.from, 'LLL dd, y')
                    )
                  ) : (
                    'Pick start and end dates'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-lg" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range: DateRange | undefined) => {
                    setValue('lastPeriodStartDate', range?.from)
                    setValue('lastPeriodEndDate', range?.to)
                  }}
                  disabled={(date: Date) => date > new Date()}
                  initialFocus
                  className="rounded-lg"
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-[#696863]">
              Select the start and end dates of your last period
            </p>
            {errors.lastPeriodEndDate && (
              <p className="text-sm text-destructive">{errors.lastPeriodEndDate.message}</p>
            )}
          </div>
        </div>
      )}

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
          {isSubmitting ? 'Saving...' : 'Next: Your Plan'}
        </Button>
      </div>
    </form>
  )
}
