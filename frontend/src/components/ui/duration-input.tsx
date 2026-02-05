import * as React from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface DurationInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: string
  onChange?: (value: string) => void
}

export const DurationInput = React.forwardRef<HTMLInputElement, DurationInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    // Parse HH:MM:SS format
    const [hours, setHours] = React.useState('')
    const [minutes, setMinutes] = React.useState('')
    const [seconds, setSeconds] = React.useState('')

    // Update internal state when value prop changes
    React.useEffect(() => {
      if (value) {
        const parts = value.split(':')
        setHours(parts[0] || '')
        setMinutes(parts[1] || '')
        setSeconds(parts[2] || '')
      }
    }, [value])

    // Notify parent of changes in HH:MM:SS format
    const notifyChange = (h: string, m: string, s: string) => {
      if (h || m || s) {
        const formatted = `${h.padStart(2, '0')}:${m.padStart(2, '0')}:${s.padStart(2, '0')}`
        onChange?.(formatted)
      } else {
        onChange?.('')
      }
    }

    const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, '').slice(0, 2)
      setHours(val)
      notifyChange(val, minutes, seconds)
    }

    const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, '').slice(0, 2)
      if (parseInt(val || '0') <= 59) {
        setMinutes(val)
        notifyChange(hours, val, seconds)
      }
    }

    const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, '').slice(0, 2)
      if (parseInt(val || '0') <= 59) {
        setSeconds(val)
        notifyChange(hours, minutes, val)
      }
    }

    return (
      <div className={cn('flex items-center gap-1', className)}>
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          placeholder="00"
          value={hours}
          onChange={handleHoursChange}
          className="w-14 text-center"
          {...props}
        />
        <span className="text-muted-foreground">:</span>
        <Input
          type="text"
          inputMode="numeric"
          placeholder="00"
          value={minutes}
          onChange={handleMinutesChange}
          className="w-14 text-center"
          disabled={props.disabled}
        />
        <span className="text-muted-foreground">:</span>
        <Input
          type="text"
          inputMode="numeric"
          placeholder="00"
          value={seconds}
          onChange={handleSecondsChange}
          className="w-14 text-center"
          disabled={props.disabled}
        />
      </div>
    )
  }
)

DurationInput.displayName = 'DurationInput'
