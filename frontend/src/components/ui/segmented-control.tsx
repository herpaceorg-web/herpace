import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SegmentedControlOption {
  value: string
  label: string
  icon?: React.ReactNode
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[]
  value: string
  onValueChange: (value: string) => void
  className?: string
}

export function SegmentedControl({
  options,
  value,
  onValueChange,
  className
}: SegmentedControlProps) {
  const activeIndex = options.findIndex(opt => opt.value === value)

  return (
    <div
      className={cn('relative grid p-1 bg-muted rounded-lg', className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
      {/* Sliding indicator */}
      <div
        className="absolute bg-[#FDFBF7] shadow-sm transition-all duration-300 ease-in-out rounded-md top-1 bottom-1"
        style={{
          left: `calc(4px + (${activeIndex} * ((100% - 8px) / ${options.length})))`,
          width: `calc((100% - 8px) / ${options.length})`,
        }}
      />
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onValueChange(option.value)}
          className={cn(
            'relative z-10 flex items-center justify-center',
            'text-foreground text-sm font-normal',
            'px-3 py-2 rounded-md',
            'transition-all duration-300 ease-in-out',
            'hover:bg-transparent active:bg-transparent',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          )}
          type="button"
        >
          {option.icon && <span className="mr-2">{option.icon}</span>}
          {option.label}
        </button>
      ))}
    </div>
  )
}
