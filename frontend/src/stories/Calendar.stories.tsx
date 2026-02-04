import type { Meta, StoryObj } from '@storybook/react-vite';
import { Calendar } from '../components/ui/calendar';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

const meta = {
  title: 'Components/Calendar',
  component: Calendar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    return (
      <div className="p-4 border rounded-lg bg-card">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
        />
        <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
          <strong>Selected:</strong> {selectedDate ? selectedDate.toLocaleDateString() : 'None'}
        </div>
      </div>
    );
  },
};

export const DateRangeSingleMonth: Story = {
  render: () => {
    const [singleMonthRange, setSingleMonthRange] = useState<DateRange | undefined>({
      from: new Date(2026, 1, 5),
      to: new Date(2026, 1, 12),
    });

    return (
      <div className="p-4 border rounded-lg bg-card">
        <Calendar
          mode="range"
          selected={singleMonthRange}
          onSelect={setSingleMonthRange}
        />
        <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
          <strong>Selected Range:</strong>{' '}
          {singleMonthRange?.from ? (
            <>
              {singleMonthRange.from.toLocaleDateString()}
              {singleMonthRange.to && ` - ${singleMonthRange.to.toLocaleDateString()}`}
            </>
          ) : (
            'None'
          )}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Select a date range within a single month view.',
      },
    },
  },
};

export const DateRangeTwoMonths: Story = {
  render: () => {
    const [twoMonthRange, setTwoMonthRange] = useState<DateRange | undefined>({
      from: new Date(2026, 1, 1),
      to: new Date(2026, 1, 14),
    });

    return (
      <div className="p-4 border rounded-lg bg-card">
        <Calendar
          mode="range"
          selected={twoMonthRange}
          onSelect={setTwoMonthRange}
          numberOfMonths={2}
        />
        <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
          <strong>Selected Range:</strong>{' '}
          {twoMonthRange?.from ? (
            <>
              {twoMonthRange.from.toLocaleDateString()}
              {twoMonthRange.to && ` - ${twoMonthRange.to.toLocaleDateString()}`}
            </>
          ) : (
            'None'
          )}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Select a date range with two months displayed side by side.',
      },
    },
  },
};

export const MultipleDates: Story = {
  render: () => {
    const [multipleDates, setMultipleDates] = useState<Date[] | undefined>([
      new Date(2026, 1, 5),
      new Date(2026, 1, 12),
      new Date(2026, 1, 20),
    ]);

    return (
      <div className="p-4 border rounded-lg bg-card">
        <Calendar
          mode="multiple"
          selected={multipleDates}
          onSelect={setMultipleDates}
        />
        <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
          <strong>Selected Dates:</strong>{' '}
          {multipleDates && multipleDates.length > 0
            ? multipleDates.map(d => d.toLocaleDateString()).join(', ')
            : 'None'}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Select multiple individual dates.',
      },
    },
  },
};

export const WithWeekNumbers: Story = {
  render: () => (
    <div className="p-4 border rounded-lg bg-card">
      <Calendar
        mode="single"
        showWeekNumber
        weekStartsOn={1}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Display week numbers on the left side of the calendar.',
      },
    },
  },
};

export const DisabledDates: Story = {
  render: () => {
    const [disabledDate, setDisabledDate] = useState<Date | undefined>(new Date());
    const disabledDays = [
      new Date(2026, 1, 6),
      new Date(2026, 1, 13),
      new Date(2026, 1, 20),
      new Date(2026, 1, 27),
    ];

    return (
      <div className="p-4 border rounded-lg bg-card">
        <Calendar
          mode="single"
          selected={disabledDate}
          onSelect={setDisabledDate}
          disabled={disabledDays}
          defaultMonth={new Date(2026, 1)}
        />
        <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
          <strong>Note:</strong> Fridays are disabled in this example
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Disable specific dates to prevent selection.',
      },
    },
  },
};

export const DisabledPastDates: Story = {
  render: () => {
    const [futureDate, setFutureDate] = useState<Date | undefined>();

    return (
      <div className="p-4 border rounded-lg bg-card">
        <Calendar
          mode="single"
          selected={futureDate}
          onSelect={setFutureDate}
          disabled={{ before: new Date() }}
        />
        <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
          <strong>Use Case:</strong> Booking future appointments - past dates are disabled
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Disable all dates before today - useful for booking systems.',
      },
    },
  },
};

export const DateRangeWithMinMax: Story = {
  render: () => {
    const [constrainedRange, setConstrainedRange] = useState<DateRange | undefined>();
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

    return (
      <div className="p-4 border rounded-lg bg-card">
        <Calendar
          mode="range"
          selected={constrainedRange}
          onSelect={setConstrainedRange}
          disabled={{ before: today }}
          fromDate={today}
          toDate={nextMonth}
          numberOfMonths={2}
        />
        <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
          <strong>Use Case:</strong> Training plan date range (next 30 days only)
          <div className="mt-2">
            {constrainedRange?.from && (
              <>
                <strong>From:</strong> {constrainedRange.from.toLocaleDateString()}
                {constrainedRange.to && <> <strong>To:</strong> {constrainedRange.to.toLocaleDateString()}</>}
              </>
            )}
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Date range selection with minimum and maximum date constraints.',
      },
    },
  },
};

export const CycleTracking: Story = {
  render: () => {
    const [cycleDate, setCycleDate] = useState<Date | undefined>(new Date());

    const menstrualPhase = [
      new Date(2026, 1, 1),
      new Date(2026, 1, 2),
      new Date(2026, 1, 3),
      new Date(2026, 1, 4),
      new Date(2026, 1, 5),
    ];

    const follicularPhase = [
      new Date(2026, 1, 6),
      new Date(2026, 1, 7),
      new Date(2026, 1, 8),
      new Date(2026, 1, 9),
      new Date(2026, 1, 10),
      new Date(2026, 1, 11),
      new Date(2026, 1, 12),
    ];

    const ovulatoryPhase = [
      new Date(2026, 1, 13),
      new Date(2026, 1, 14),
      new Date(2026, 1, 15),
      new Date(2026, 1, 16),
    ];

    const lutealPhase = [
      new Date(2026, 1, 17),
      new Date(2026, 1, 18),
      new Date(2026, 1, 19),
      new Date(2026, 1, 20),
      new Date(2026, 1, 21),
      new Date(2026, 1, 22),
      new Date(2026, 1, 23),
      new Date(2026, 1, 24),
      new Date(2026, 1, 25),
      new Date(2026, 1, 26),
      new Date(2026, 1, 27),
      new Date(2026, 1, 28),
    ];

    return (
      <div className="p-4 border rounded-lg bg-card">
        <Calendar
          mode="single"
          selected={cycleDate}
          onSelect={setCycleDate}
          defaultMonth={new Date(2026, 1)}
          modifiers={{
            menstrual: menstrualPhase,
            follicular: follicularPhase,
            ovulatory: ovulatoryPhase,
            luteal: lutealPhase,
          }}
          modifiersClassNames={{
            menstrual: 'bg-chart-1/20 text-chart-1 font-semibold',
            follicular: 'bg-chart-2/20 text-chart-2 font-semibold',
            ovulatory: 'bg-chart-3/20 text-chart-3 font-semibold',
            luteal: 'bg-chart-4/20 text-chart-4 font-semibold',
          }}
        />
        <div className="mt-4 pt-4 border-t space-y-2">
          <div className="text-sm font-semibold mb-2">Cycle Phases:</div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 rounded bg-chart-1/20 border border-chart-1"></div>
            <span>Menstrual (1-5)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 rounded bg-chart-2/20 border border-chart-2"></div>
            <span>Follicular (6-12)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 rounded bg-chart-3/20 border border-chart-3"></div>
            <span>Ovulatory (13-16)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 rounded bg-chart-4/20 border border-chart-4"></div>
            <span>Luteal (17-28)</span>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Example of cycle tracking with visual indicators for each phase using custom modifiers.',
      },
    },
  },
};

export const WorkoutCalendar: Story = {
  render: () => {
    const [workoutDate, setWorkoutDate] = useState<Date | undefined>(new Date());

    const workoutDays = [
      new Date(2026, 1, 2),
      new Date(2026, 1, 4),
      new Date(2026, 1, 6),
      new Date(2026, 1, 9),
      new Date(2026, 1, 11),
      new Date(2026, 1, 13),
      new Date(2026, 1, 16),
      new Date(2026, 1, 18),
      new Date(2026, 1, 20),
      new Date(2026, 1, 23),
      new Date(2026, 1, 25),
      new Date(2026, 1, 27),
    ];

    const restDays = [
      new Date(2026, 1, 1),
      new Date(2026, 1, 8),
      new Date(2026, 1, 15),
      new Date(2026, 1, 22),
    ];

    return (
      <div className="p-4 border rounded-lg bg-card">
        <Calendar
          mode="single"
          selected={workoutDate}
          onSelect={setWorkoutDate}
          defaultMonth={new Date(2026, 1)}
          modifiers={{
            workout: workoutDays,
            rest: restDays,
          }}
          modifiersClassNames={{
            workout: 'bg-success/20 text-success font-semibold',
            rest: 'bg-warning/20 text-warning font-semibold',
          }}
        />
        <div className="mt-4 pt-4 border-t space-y-2">
          <div className="text-sm font-semibold mb-2">Training Schedule:</div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 rounded bg-success/20 border border-success"></div>
            <span>Workout Day</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 rounded bg-warning/20 border border-warning"></div>
            <span>Rest Day</span>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Click any date to view workout details
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Training calendar showing workout and rest days with color coding.',
      },
    },
  },
};

export const CompactCalendar: Story = {
  render: () => {
    const [compactDate, setCompactDate] = useState<Date | undefined>(new Date());

    return (
      <div className="p-3 border rounded-lg bg-card max-w-xs">
        <Calendar
          mode="single"
          selected={compactDate}
          onSelect={setCompactDate}
          className="[--cell-size:1.75rem]"
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Smaller calendar with reduced cell size for compact layouts.',
      },
    },
  },
};

export const MonthYearDropdowns: Story = {
  render: () => {
    const [dropdownDate, setDropdownDate] = useState<Date | undefined>(new Date());

    return (
      <div className="p-4 border rounded-lg bg-card">
        <Calendar
          mode="single"
          selected={dropdownDate}
          onSelect={setDropdownDate}
          captionLayout="dropdown"
          fromYear={2020}
          toYear={2030}
        />
        <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
          <strong>Use Case:</strong> Date of birth selection with year dropdown
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Calendar with dropdown selectors for month and year navigation.',
      },
    },
  },
};

export const InPopover: Story = {
  render: () => {
    const [popoverDate, setPopoverDate] = useState<Date | undefined>(new Date());
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Select Date</label>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-64 px-3 py-2 border border-input rounded-lg bg-background text-left hover:bg-accent transition-colors"
          >
            {popoverDate ? popoverDate.toLocaleDateString() : 'Pick a date'}
          </button>
        </div>

        {isOpen && (
          <div className="relative">
            <div className="absolute top-2 left-0 z-50 bg-popover border border-border rounded-lg shadow-lg p-3">
              <Calendar
                mode="single"
                selected={popoverDate}
                onSelect={(newDate) => {
                  setPopoverDate(newDate);
                  setIsOpen(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Calendar displayed in a popover when clicking a date input field.',
      },
    },
  },
};

export const UseCases: Story = {
  render: () => (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 font-petrona">Calendar Use Cases</h1>
        <p className="text-muted-foreground">Common calendar patterns in Her Pace</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold font-petrona">Date Selection</h3>
          <div className="border rounded-lg p-4 bg-card">
            <h4 className="font-medium mb-2">Single Date</h4>
            <p className="text-sm text-muted-foreground mb-3">
              For date of birth, race date, or any single date input
            </p>
            <code className="text-xs bg-muted p-2 rounded block">
              mode="single"
            </code>
          </div>

          <div className="border rounded-lg p-4 bg-card">
            <h4 className="font-medium mb-2">Date Range</h4>
            <p className="text-sm text-muted-foreground mb-3">
              For training plan duration, vacation dates, or date filters
            </p>
            <code className="text-xs bg-muted p-2 rounded block">
              mode="range"
            </code>
          </div>

          <div className="border rounded-lg p-4 bg-card">
            <h4 className="font-medium mb-2">Multiple Dates</h4>
            <p className="text-sm text-muted-foreground mb-3">
              For selecting multiple workout days or rest days
            </p>
            <code className="text-xs bg-muted p-2 rounded block">
              mode="multiple"
            </code>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold font-petrona">Visual Indicators</h3>

          <div className="border rounded-lg p-4 bg-card">
            <h4 className="font-medium mb-2">Cycle Phase Tracking</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Show menstrual cycle phases with color coding
            </p>
            <code className="text-xs bg-muted p-2 rounded block overflow-x-auto">
              {'modifiers={{ menstrual: dates }}'}
            </code>
          </div>

          <div className="border rounded-lg p-4 bg-card">
            <h4 className="font-medium mb-2">Training Schedule</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Highlight workout days, rest days, and race days
            </p>
            <code className="text-xs bg-muted p-2 rounded block overflow-x-auto">
              {'modifiers={{ workout: [], rest: [] }}'}
            </code>
          </div>

          <div className="border rounded-lg p-4 bg-card">
            <h4 className="font-medium mb-2">Disabled Dates</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Prevent selection of past dates or unavailable dates
            </p>
            <code className="text-xs bg-muted p-2 rounded block">
              {'disabled={{ before: new Date() }}'}
            </code>
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 border border-primary/20 rounded-lg bg-primary/5">
        <h3 className="font-semibold text-lg mb-3">Integration Tips</h3>
        <ul className="space-y-2 text-sm">
          <li>✓ Use with React Hook Form for form validation</li>
          <li>✓ Combine with Popover component for date picker inputs</li>
          <li>✓ Apply custom modifiers for cycle phases and workout indicators</li>
          <li>✓ Set min/max dates to constrain date selection</li>
          <li>✓ Use <code className="bg-primary/10 px-1.5 py-0.5 rounded">numberOfMonths</code> for range selection</li>
        </ul>
      </div>
    </div>
  ),
};
