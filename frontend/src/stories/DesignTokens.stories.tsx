import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/ui/button';

const meta = {
  title: 'Design System/Design Tokens',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Color token display component
const ColorSwatch = ({ name, value, hsl }: { name: string; value: string; hsl: string }) => (
  <div className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
    <div
      className="w-16 h-16 rounded-lg border-2 border-border shadow-sm flex-shrink-0"
      style={{ backgroundColor: value }}
    />
    <div className="flex-1 min-w-0">
      <div className="font-semibold text-foreground">{name}</div>
      <div className="text-sm text-muted-foreground font-mono">{value}</div>
      <div className="text-xs text-muted-foreground font-mono">hsl({hsl})</div>
    </div>
  </div>
);

// Use case component
const UseCase = ({ title, description, example }: { title: string; description: string; example: React.ReactNode }) => (
  <div className="border rounded-lg overflow-hidden">
    <div className="bg-muted p-4">
      <h4 className="font-semibold text-sm mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    <div className="p-6 bg-background">
      {example}
    </div>
  </div>
);

export const Colors: Story = {
  render: () => (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 font-petrona">Color Palette</h1>
        <p className="text-muted-foreground">Her Pace Theme - Updated from Figma 2026-02-03</p>
      </div>

      <div className="space-y-8">
        {/* Primary Colors */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 font-petrona">Base Colors</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ColorSwatch name="Background" value="#FDFBF7" hsl="40 60% 98%" />
            <ColorSwatch name="Foreground" value="#3D3826" hsl="47 23% 19%" />
            <ColorSwatch name="Primary" value="#45423A" hsl="44 9% 25%" />
            <ColorSwatch name="Primary Foreground" value="#FFFFFF" hsl="0 0% 100%" />
            <ColorSwatch name="Secondary" value="#EBE8E2" hsl="40 18% 90%" />
            <ColorSwatch name="Secondary Foreground" value="#45423A" hsl="44 9% 25%" />
          </div>
        </section>

        {/* Surface Colors */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 font-petrona">Surface Colors</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ColorSwatch name="Card" value="#FCF9F3" hsl="40 60% 97%" />
            <ColorSwatch name="Card Foreground" value="#141414" hsl="0 0% 8%" />
            <ColorSwatch name="Popover" value="#FFFFFF" hsl="0 0% 100%" />
            <ColorSwatch name="Popover Foreground" value="#29271B" hsl="51 21% 13%" />
            <ColorSwatch name="Muted" value="#F3F0E7" hsl="45 33% 93%" />
            <ColorSwatch name="Muted Foreground" value="#85837D" hsl="45 3% 51%" />
            <ColorSwatch name="Accent" value="#E7E4DD" hsl="42 17% 89%" />
            <ColorSwatch name="Accent Foreground" value="#29271B" hsl="51 21% 13%" />
          </div>
        </section>

        {/* Semantic Colors */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 font-petrona">Semantic Colors</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ColorSwatch name="Destructive" value="#A14139" hsl="5 48% 43%" />
            <ColorSwatch name="Destructive Foreground" value="#FFFFFF" hsl="0 0% 100%" />
            <ColorSwatch name="Info" value="#4E6D80" hsl="203 24% 40%" />
            <ColorSwatch name="Info Foreground" value="#FFFFFF" hsl="0 0% 100%" />
            <ColorSwatch name="Success" value="#677344" hsl="75 26% 36%" />
            <ColorSwatch name="Success Foreground" value="#FFFFFF" hsl="0 0% 100%" />
            <ColorSwatch name="Warning" value="#D97706" hsl="32 95% 44%" />
            <ColorSwatch name="Warning Foreground" value="#FFFFFF" hsl="0 0% 100%" />
          </div>
        </section>

        {/* UI Colors */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 font-petrona">UI Elements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ColorSwatch name="Border" value="#EBE8E2" hsl="40 18% 90%" />
            <ColorSwatch name="Input" value="#DDD9CF" hsl="43 17% 84%" />
            <ColorSwatch name="Ring (Focus)" value="#45423A" hsl="44 9% 25%" />
          </div>
        </section>

        {/* Sidebar Colors */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 font-petrona">Sidebar Colors</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ColorSwatch name="Sidebar" value="#F7F5EE" hsl="47 36% 95%" />
            <ColorSwatch name="Sidebar Foreground" value="#3E3E38" hsl="60 5% 23%" />
            <ColorSwatch name="Sidebar Primary" value="#CB6441" hsl="15 57% 53%" />
            <ColorSwatch name="Sidebar Primary Foreground" value="#FCFCFC" hsl="0 0% 99%" />
            <ColorSwatch name="Sidebar Accent" value="#E7E4DD" hsl="42 17% 89%" />
            <ColorSwatch name="Sidebar Accent Foreground" value="#353535" hsl="0 0% 21%" />
            <ColorSwatch name="Sidebar Border" value="#EBEBEB" hsl="0 0% 92%" />
            <ColorSwatch name="Sidebar Ring" value="#B4B4B4" hsl="0 0% 71%" />
          </div>
        </section>

        {/* Chart Colors */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 font-petrona">Chart Colors</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ColorSwatch name="Chart 1" value="#B55A2D" hsl="20 60% 44%" />
            <ColorSwatch name="Chart 2" value="#597D93" hsl="203 25% 46%" />
            <ColorSwatch name="Chart 3" value="#DED7C2" hsl="45 30% 82%" />
            <ColorSwatch name="Chart 4" value="#DAD2EF" hsl="257 48% 88%" />
            <ColorSwatch name="Chart 5" value="#EFA910" hsl="41 87% 50%" />
          </div>
        </section>
      </div>
    </div>
  ),
};

export const UseCases: Story = {
  render: () => (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 font-petrona">Color Use Cases</h1>
        <p className="text-muted-foreground">Real-world examples of when to use each color</p>
      </div>

      <div className="space-y-8">
        {/* Primary Color Uses */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 font-petrona">Primary Colors</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <UseCase
              title="Primary Buttons"
              description="Use bg-primary with text-primary-foreground for main call-to-action buttons"
              example={
                <div className="flex gap-3 flex-wrap">
                  <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90">
                    Start Training Plan
                  </button>
                  <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90">
                    Save Changes
                  </button>
                </div>
              }
            />
            <UseCase
              title="Headings & Important Text"
              description="Use text-foreground for body text, darker tones for emphasis"
              example={
                <div>
                  <h3 className="text-foreground font-bold text-xl mb-2">Training Schedule</h3>
                  <p className="text-foreground">Your personalized training plan adapts to your cycle</p>
                  <p className="text-muted-foreground text-sm mt-2">Secondary information in muted color</p>
                </div>
              }
            />
          </div>
        </section>

        {/* Secondary Color Uses */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 font-petrona">Secondary & Muted</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <UseCase
              title="Secondary Buttons & Backgrounds"
              description="Use bg-secondary for less prominent actions and subtle backgrounds"
              example={
                <div className="space-y-3">
                  <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90">
                    Cancel
                  </button>
                  <div className="bg-secondary p-4 rounded-lg">
                    <p className="text-secondary-foreground">This is a subtle callout box using secondary colors</p>
                  </div>
                </div>
              }
            />
            <UseCase
              title="Muted Text & Disabled States"
              description="Use text-muted-foreground for labels, captions, and placeholder text"
              example={
                <div className="space-y-2">
                  <div>
                    <label className="text-sm text-muted-foreground">Email Address</label>
                    <input
                      type="email"
                      placeholder="Enter your email..."
                      className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Helper text appears in muted color</p>
                </div>
              }
            />
          </div>
        </section>

        {/* Semantic Color Uses */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 font-petrona">Semantic Colors</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <UseCase
              title="Destructive Actions"
              description="Use bg-destructive for delete, remove, or dangerous actions"
              example={
                <div className="space-y-3">
                  <button className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90">
                    Delete Training Plan
                  </button>
                  <div className="border border-destructive bg-destructive/10 p-3 rounded-lg">
                    <p className="text-destructive text-sm font-medium">Warning: This action cannot be undone</p>
                  </div>
                </div>
              }
            />
            <UseCase
              title="Success Messages"
              description="Use bg-success for confirmations and positive feedback"
              example={
                <div className="space-y-3">
                  <button className="bg-success text-success-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90">
                    Plan Saved
                  </button>
                  <div className="border border-success bg-success/10 p-3 rounded-lg">
                    <p className="text-success text-sm font-medium">✓ Your workout has been logged successfully</p>
                  </div>
                </div>
              }
            />
            <UseCase
              title="Info Messages"
              description="Use bg-info for informational alerts and neutral notifications"
              example={
                <div className="space-y-3">
                  <button className="bg-info text-info-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90">
                    Learn More
                  </button>
                  <div className="border border-info bg-info/10 p-3 rounded-lg">
                    <p className="text-info text-sm font-medium">ℹ️ Your next ovulatory phase starts in 3 days</p>
                  </div>
                </div>
              }
            />
            <UseCase
              title="Warning Messages"
              description="Use bg-warning for cautions and important notices"
              example={
                <div className="space-y-3">
                  <button className="bg-warning text-warning-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90">
                    Review Plan
                  </button>
                  <div className="border border-warning bg-warning/10 p-3 rounded-lg">
                    <p className="text-warning text-sm font-medium">⚠️ You haven't logged a workout in 5 days</p>
                  </div>
                </div>
              }
            />
          </div>
        </section>

        {/* Cards & Surfaces */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 font-petrona">Cards & Surfaces</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <UseCase
              title="Card Components"
              description="Use bg-card with text-card-foreground for elevated content containers"
              example={
                <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                  <h3 className="text-card-foreground font-semibold mb-2">Today's Workout</h3>
                  <p className="text-muted-foreground text-sm">Easy run - 30 minutes</p>
                  <button className="mt-3 bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm">
                    Start Workout
                  </button>
                </div>
              }
            />
            <UseCase
              title="Popovers & Dropdowns"
              description="Use bg-popover with text-popover-foreground for floating UI elements"
              example={
                <div className="bg-popover border border-border rounded-lg p-3 shadow-lg max-w-xs">
                  <div className="text-popover-foreground font-medium mb-2">Quick Actions</div>
                  <div className="space-y-1">
                    <button className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded">Edit Profile</button>
                    <button className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded">View Stats</button>
                    <button className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded">Settings</button>
                  </div>
                </div>
              }
            />
          </div>
        </section>

        {/* Borders & Inputs */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 font-petrona">Borders & Inputs</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <UseCase
              title="Form Inputs"
              description="Use border-input for form fields, border-border for containers"
              example={
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Name"
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:outline-none"
                  />
                  <div className="border border-border p-3 rounded-lg">
                    <p className="text-sm">Content with standard border</p>
                  </div>
                </div>
              }
            />
            <UseCase
              title="Focus States"
              description="Use ring-ring for focus indicators on interactive elements"
              example={
                <button className="w-full px-4 py-2 border-2 border-border rounded-lg hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  Click or Tab to Focus
                </button>
              }
            />
          </div>
        </section>

        {/* Chart Colors */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 font-petrona">Chart Colors</h2>
          <UseCase
            title="Data Visualization"
            description="Use chart colors for graphs, progress indicators, and multi-category data"
            example={
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-chart-1"></div>
                    <span className="text-sm">Menstrual Phase</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-chart-2"></div>
                    <span className="text-sm">Follicular Phase</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-chart-3"></div>
                    <span className="text-sm">Ovulatory Phase</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-chart-4"></div>
                    <span className="text-sm">Luteal Phase</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-chart-5"></div>
                    <span className="text-sm">Rest Days</span>
                  </div>
                </div>
              </div>
            }
          />
        </section>
      </div>
    </div>
  ),
};

export const Typography: Story = {
  render: () => (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 font-petrona">Typography</h1>
        <p className="text-muted-foreground">Font families and type scale</p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4 font-petrona">Font Families</h2>
          <div className="space-y-6">
            <div className="border rounded-lg p-6 font-manrope">
              <div className="text-sm text-muted-foreground mb-2">Manrope (Primary/UI) - font-manrope</div>
              <div className="text-2xl mb-2">The quick brown fox jumps over the lazy dog</div>
              <div className="text-base">ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789</div>
            </div>
            <div className="border rounded-lg p-6 font-petrona">
              <div className="text-sm text-muted-foreground mb-2">Petrona (Headings/Display) - font-petrona</div>
              <div className="text-2xl mb-2">The quick brown fox jumps over the lazy dog</div>
              <div className="text-base">ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789</div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 font-petrona">Type Scale</h2>
          <div className="border rounded-lg p-6 space-y-4">
            <div className="text-xs">XS (12px) - Labels and captions</div>
            <div className="text-sm">SM (14px) - Helper text and small UI elements</div>
            <div className="text-base">Base (16px) - Body text and standard content</div>
            <div className="text-lg">LG (18px) - Emphasized text</div>
            <div className="text-xl">XL (20px) - Section subheadings</div>
            <div className="text-2xl">2XL (24px) - Section headings</div>
            <div className="text-3xl">3XL (30px) - Page titles</div>
            <div className="text-4xl font-petrona">4XL (36px) - Hero headings</div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 font-petrona">Use Cases</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <UseCase
              title="Page Headings"
              description="Use font-petrona with text-3xl or text-4xl for page titles"
              example={
                <div>
                  <h1 className="text-4xl font-bold font-petrona mb-2">Training Dashboard</h1>
                  <p className="text-muted-foreground">Track your progress and upcoming workouts</p>
                </div>
              }
            />
            <UseCase
              title="Body Content"
              description="Use font-manrope (default) for UI elements and body text"
              example={
                <div className="space-y-2">
                  <p className="text-base">Your personalized training plan adapts to your menstrual cycle phases, ensuring optimal performance and recovery.</p>
                  <p className="text-sm text-muted-foreground">Last updated: 2 hours ago</p>
                </div>
              }
            />
          </div>
        </section>
      </div>
    </div>
  ),
};

export const Spacing: Story = {
  render: () => (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 font-petrona">Spacing Scale</h1>
        <p className="text-muted-foreground">Consistent spacing tokens for layouts</p>
      </div>

      <div className="space-y-6">
        {[
          { name: 'spacing-0', value: '0px', tailwind: 'p-0' },
          { name: 'spacing-1', value: '4px', tailwind: 'p-1' },
          { name: 'spacing-1.5', value: '6px', tailwind: 'p-1.5' },
          { name: 'spacing-2', value: '8px', tailwind: 'p-2' },
          { name: 'spacing-3', value: '12px', tailwind: 'p-3' },
          { name: 'spacing-4', value: '16px', tailwind: 'p-4' },
          { name: 'spacing-6', value: '24px', tailwind: 'p-6' },
          { name: 'spacing-horizontal', value: '32px', tailwind: 'px-8' },
          { name: 'spacing-vertical', value: '96px', tailwind: 'py-24' },
        ].map(({ name, value, tailwind }) => (
          <div key={name} className="flex items-center gap-4 p-3 border rounded-lg">
            <div className="w-32 flex items-center">
              <div className="bg-primary h-8" style={{ width: value }} />
            </div>
            <div className="flex-1">
              <div className="font-semibold">{name}</div>
              <div className="text-sm text-muted-foreground font-mono">{value} • {tailwind}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 border rounded-lg bg-muted/30">
        <h3 className="font-semibold mb-3">Usage Examples</h3>
        <div className="space-y-2 text-sm">
          <div><code className="bg-primary/10 px-2 py-1 rounded">p-4</code> - Standard component padding (16px)</div>
          <div><code className="bg-primary/10 px-2 py-1 rounded">gap-3</code> - Space between flex/grid items (12px)</div>
          <div><code className="bg-primary/10 px-2 py-1 rounded">mb-6</code> - Section margin bottom (24px)</div>
          <div><code className="bg-primary/10 px-2 py-1 rounded">px-8</code> - Page horizontal padding (32px)</div>
        </div>
      </div>
    </div>
  ),
};

export const Overview: Story = {
  render: () => (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 font-petrona">Her Pace Design System</h1>
        <p className="text-muted-foreground">Complete design token reference - Synced with Figma</p>
      </div>

      <div className="prose prose-sm max-w-none">
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mt-0 mb-3 font-petrona">About This Design System</h2>
          <p className="mb-4">
            This design system is built on CSS custom properties defined in{' '}
            <code className="text-sm bg-muted px-2 py-0.5 rounded">src/index.css</code> and consumed through
            Tailwind CSS utility classes. All tokens are synced with the{' '}
            <a href="https://www.figma.com/design/q5zmCbrDcUbyJbGH3Rh1Vu/Her-Pace-DS--Shadcn" className="text-primary hover:underline" target="_blank" rel="noopener">
              Her Pace Figma design system
            </a>.
          </p>
          <div className="text-xs text-muted-foreground">Last updated: February 3, 2026</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-3">Using Tokens in Code</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="font-medium mb-1">Tailwind Classes (Recommended)</div>
                <code className="block bg-muted p-2 rounded text-xs">
                  className="bg-primary text-primary-foreground"
                </code>
              </div>
              <div>
                <div className="font-medium mb-1">CSS Custom Properties</div>
                <code className="block bg-muted p-2 rounded text-xs">
                  background: hsl(var(--primary));
                </code>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-3">Available Token Categories</h3>
            <ul className="space-y-2 text-sm list-disc list-inside">
              <li>Colors (base, semantic, sidebar)</li>
              <li>Typography (fonts, sizes, weights)</li>
              <li>Spacing (padding, margin, gaps)</li>
              <li>Border radius</li>
              <li>Shadows</li>
              <li>Chart colors</li>
            </ul>
          </div>
        </div>

        <div className="border border-primary/20 rounded-lg bg-primary/5 p-6">
          <h3 className="font-semibold text-lg mt-0 mb-3">Updating Design Tokens</h3>
          <p className="mb-3">To maintain consistency with Figma designs:</p>
          <ol className="space-y-2 ml-5">
            <li>Update colors in Figma design file</li>
            <li>Copy hex values from Figma's "Her Pace Theme" variables</li>
            <li>Update <code className="bg-primary/10 px-1.5 py-0.5 rounded text-sm">src/index.css</code> with new HSL values</li>
            <li>Storybook automatically reflects changes</li>
            <li>Test components to ensure visual consistency</li>
          </ol>
          <p className="mt-4 text-sm text-muted-foreground">
            For automated token sync, consider using the Figma Tokens plugin + Style Dictionary workflow.
          </p>
        </div>
      </div>
    </div>
  ),
};
