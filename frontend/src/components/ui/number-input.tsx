import * as React from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value'> {
  value?: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value = 0, onChange, min = 0, max = 999, step = 1, suffix, disabled, ...props }, ref) => {
    const handleDecrement = () => {
      const newValue = Math.max(min, (value || 0) - step)
      onChange?.(newValue)
    }

    const handleIncrement = () => {
      const newValue = Math.min(max, (value || 0) + step)
      onChange?.(newValue)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      if (val === '') {
        onChange?.(0)
        return
      }
      const numVal = parseFloat(val)
      if (!isNaN(numVal)) {
        const clampedValue = Math.max(min, Math.min(max, numVal))
        onChange?.(clampedValue)
      }
    }

    return (
      <div
        className={cn(
          'flex h-10 w-full items-center rounded-md border border-input bg-background',
          className
        )}
      >
        <div className="flex-1 flex items-center justify-center px-3">
          <div className="flex items-center gap-2">
            <input
              ref={ref}
              type="text"
              inputMode="decimal"
              value={value}
              onChange={handleInputChange}
              disabled={disabled}
              className="w-12 bg-transparent py-2 text-sm text-center outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              {...props}
            />
            {suffix && (
              <span className="text-sm text-foreground whitespace-nowrap">
                {suffix}
              </span>
            )}
          </div>
        </div>
        <div className="flex h-full items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-full rounded-none border-l border-input px-2 hover:bg-accent"
            onClick={handleDecrement}
            disabled={disabled || value <= min}
            tabIndex={-1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-full rounded-none rounded-r-md border-l border-input px-2 hover:bg-accent"
            onClick={handleIncrement}
            disabled={disabled || value >= max}
            tabIndex={-1}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }
)

NumberInput.displayName = 'NumberInput'
