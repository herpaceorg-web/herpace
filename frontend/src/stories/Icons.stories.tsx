import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  // Currently used icons
  CalendarDays,
  Snowflake,
  Sprout,
  Sun,
  Leaf,
  Check,
  ChevronDown,
  X,
  FileWarning,
  AlertCircle,
  CheckCircle,
  Info,

  // Common UI icons
  Search,
  Menu,
  Home,
  Settings,
  User,
  LogOut,
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Upload,
  Download,
  Trash2,
  Edit,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,

  // Training/Activity icons
  Activity,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Trophy,
  Timer,
  Clock,
  Play,
  Pause,
  Square,

  // Status icons
  Bell,
  BellOff,
  Heart,
  Star,
  Flag,
  Bookmark,
  Share2,
  Copy,
  ExternalLink,

  // Data/Analytics icons
  BarChart,
  LineChart,
  PieChart,

  // File/Document icons
  File,
  FileText,
  Folder,
  Image,

  // More icons
  MapPin,
  Navigation as NavigationIcon,
  Compass,
  Zap,
  Battery,
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,

  // Social/Communication
  MessageCircle,
  MessageSquare,
  Send,
  Phone,
  Video,

  // Utility
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw,
  MoreVertical,
  MoreHorizontal,
  HelpCircle,
} from 'lucide-react'

const IconGrid = ({ icons }: { icons: Array<{ name: string; icon: React.ComponentType<any> }> }) => {
  return (
    <div className="grid grid-cols-6 gap-4">
      {icons.map(({ name, icon: Icon }) => (
        <div
          key={name}
          className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          title={name}
        >
          <Icon className="w-6 h-6" />
          <span className="text-xs text-center text-gray-600 truncate w-full">{name}</span>
        </div>
      ))}
    </div>
  )
}

// Dummy component for Storybook meta
const IconShowcase = () => null

const meta = {
  title: 'Design System/Icons',
  component: IconShowcase,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof IconShowcase>

export default meta
type Story = StoryObj<typeof meta>

export const CurrentlyUsed: Story = {
  render: () => {
    const currentIcons = [
      { name: 'CalendarDays', icon: CalendarDays },
      { name: 'Snowflake', icon: Snowflake },
      { name: 'Sprout', icon: Sprout },
      { name: 'Sun', icon: Sun },
      { name: 'Leaf', icon: Leaf },
      { name: 'Check', icon: Check },
      { name: 'ChevronDown', icon: ChevronDown },
      { name: 'X', icon: X },
      { name: 'FileWarning', icon: FileWarning },
      { name: 'AlertCircle', icon: AlertCircle },
      { name: 'CheckCircle', icon: CheckCircle },
      { name: 'Info', icon: Info },
    ]

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Currently Used Icons</h2>
          <p className="text-sm text-gray-600 mb-4">Icons already in use in the HerPace app</p>
        </div>
        <IconGrid icons={currentIcons} />
      </div>
    )
  },
}

export const Navigation: Story = {
  render: () => {
    const navigationIcons = [
      { name: 'Menu', icon: Menu },
      { name: 'Home', icon: Home },
      { name: 'Settings', icon: Settings },
      { name: 'User', icon: User },
      { name: 'Search', icon: Search },
      { name: 'ChevronLeft', icon: ChevronLeft },
      { name: 'ChevronRight', icon: ChevronRight },
      { name: 'ChevronUp', icon: ChevronUp },
      { name: 'ChevronDown', icon: ChevronDown },
      { name: 'ArrowLeft', icon: ArrowLeft },
      { name: 'ArrowRight', icon: ArrowRight },
      { name: 'ArrowUp', icon: ArrowUp },
      { name: 'ArrowDown', icon: ArrowDown },
      { name: 'MoreVertical', icon: MoreVertical },
      { name: 'MoreHorizontal', icon: MoreHorizontal },
    ]

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Navigation Icons</h2>
          <p className="text-sm text-gray-600 mb-4">Icons for menus, navigation, and UI controls</p>
        </div>
        <IconGrid icons={navigationIcons} />
      </div>
    )
  },
}

export const Training: Story = {
  render: () => {
    const trainingIcons = [
      { name: 'Activity', icon: Activity },
      { name: 'TrendingUp', icon: TrendingUp },
      { name: 'TrendingDown', icon: TrendingDown },
      { name: 'Target', icon: Target },
      { name: 'Award', icon: Award },
      { name: 'Trophy', icon: Trophy },
      { name: 'Timer', icon: Timer },
      { name: 'Clock', icon: Clock },
      { name: 'Play', icon: Play },
      { name: 'Pause', icon: Pause },
      { name: 'Square', icon: Square },
      { name: 'BarChart', icon: BarChart },
      { name: 'LineChart', icon: LineChart },
      { name: 'PieChart', icon: PieChart },
    ]

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Training & Activity Icons</h2>
          <p className="text-sm text-gray-600 mb-4">Icons for training sessions, stats, and analytics</p>
        </div>
        <IconGrid icons={trainingIcons} />
      </div>
    )
  },
}

export const Status: Story = {
  render: () => {
    const statusIcons = [
      { name: 'AlertCircle', icon: AlertCircle },
      { name: 'CheckCircle', icon: CheckCircle },
      { name: 'Info', icon: Info },
      { name: 'FileWarning', icon: FileWarning },
      { name: 'Bell', icon: Bell },
      { name: 'BellOff', icon: BellOff },
      { name: 'Heart', icon: Heart },
      { name: 'Star', icon: Star },
      { name: 'Flag', icon: Flag },
      { name: 'Bookmark', icon: Bookmark },
      { name: 'Zap', icon: Zap },
    ]

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Status & Feedback Icons</h2>
          <p className="text-sm text-gray-600 mb-4">Icons for alerts, notifications, and status indicators</p>
        </div>
        <IconGrid icons={statusIcons} />
      </div>
    )
  },
}

export const Actions: Story = {
  render: () => {
    const actionIcons = [
      { name: 'Plus', icon: Plus },
      { name: 'Minus', icon: Minus },
      { name: 'Edit', icon: Edit },
      { name: 'Trash2', icon: Trash2 },
      { name: 'Copy', icon: Copy },
      { name: 'Share2', icon: Share2 },
      { name: 'Upload', icon: Upload },
      { name: 'Download', icon: Download },
      { name: 'Send', icon: Send },
      { name: 'RefreshCw', icon: RefreshCw },
      { name: 'Filter', icon: Filter },
      { name: 'SortAsc', icon: SortAsc },
      { name: 'SortDesc', icon: SortDesc },
      { name: 'ExternalLink', icon: ExternalLink },
    ]

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Action Icons</h2>
          <p className="text-sm text-gray-600 mb-4">Icons for common user actions and operations</p>
        </div>
        <IconGrid icons={actionIcons} />
      </div>
    )
  },
}

export const Auth: Story = {
  render: () => {
    const authIcons = [
      { name: 'User', icon: User },
      { name: 'LogIn', icon: LogIn },
      { name: 'LogOut', icon: LogOut },
      { name: 'Mail', icon: Mail },
      { name: 'Lock', icon: Lock },
      { name: 'Eye', icon: Eye },
      { name: 'EyeOff', icon: EyeOff },
    ]

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Authentication Icons</h2>
          <p className="text-sm text-gray-600 mb-4">Icons for login, signup, and user management</p>
        </div>
        <IconGrid icons={authIcons} />
      </div>
    )
  },
}

export const CyclePhases: Story = {
  render: () => {
    const cycleIcons = [
      { name: 'Snowflake', icon: Snowflake },
      { name: 'Sprout', icon: Sprout },
      { name: 'Sun', icon: Sun },
      { name: 'Leaf', icon: Leaf },
    ]

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Menstrual Cycle Phase Icons</h2>
          <p className="text-sm text-gray-600 mb-4">Icons representing each phase of the menstrual cycle</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="border rounded-lg p-6 bg-[rgba(78,109,128,0.1)]">
            <div className="flex items-center gap-3 mb-2">
              <Snowflake className="w-6 h-6 text-[#4E6D80]" />
              <span className="font-semibold">Menstrual Phase</span>
            </div>
            <p className="text-sm text-gray-600">Days 1-5: Rest and recovery period</p>
          </div>

          <div className="border rounded-lg p-6 bg-[rgba(103,115,68,0.1)]">
            <div className="flex items-center gap-3 mb-2">
              <Sprout className="w-6 h-6 text-[#677344]" />
              <span className="font-semibold">Follicular Phase</span>
            </div>
            <p className="text-sm text-gray-600">Days 6-14: Energy building phase</p>
          </div>

          <div className="border rounded-lg p-6 bg-[rgba(239,169,16,0.1)]">
            <div className="flex items-center gap-3 mb-2">
              <Sun className="w-6 h-6 text-[#efa910]" />
              <span className="font-semibold">Ovulatory Phase</span>
            </div>
            <p className="text-sm text-gray-600">Days 15-17: Peak energy and strength</p>
          </div>

          <div className="border rounded-lg p-6 bg-[rgba(181,90,45,0.1)]">
            <div className="flex items-center gap-3 mb-2">
              <Leaf className="w-6 h-6 text-[#b55a2d]" />
              <span className="font-semibold">Luteal Phase</span>
            </div>
            <p className="text-sm text-gray-600">Days 18-28: Steady effort period</p>
          </div>
        </div>
      </div>
    )
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Icon Sizes</h2>
        <p className="text-sm text-gray-600 mb-4">Common icon size variations</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Activity className="w-3 h-3" />
          <code className="text-sm bg-gray-100 px-2 py-1 rounded">w-3 h-3 (12px)</code>
          <span className="text-sm text-gray-600">Small - badges, compact UI</span>
        </div>

        <div className="flex items-center gap-4">
          <Activity className="w-4 h-4" />
          <code className="text-sm bg-gray-100 px-2 py-1 rounded">w-4 h-4 (16px)</code>
          <span className="text-sm text-gray-600">Default - buttons, inputs</span>
        </div>

        <div className="flex items-center gap-4">
          <Activity className="w-5 h-5" />
          <code className="text-sm bg-gray-100 px-2 py-1 rounded">w-5 h-5 (20px)</code>
          <span className="text-sm text-gray-600">Medium - list items, cards</span>
        </div>

        <div className="flex items-center gap-4">
          <Activity className="w-6 h-6" />
          <code className="text-sm bg-gray-100 px-2 py-1 rounded">w-6 h-6 (24px)</code>
          <span className="text-sm text-gray-600">Large - headings, featured items</span>
        </div>

        <div className="flex items-center gap-4">
          <Activity className="w-8 h-8" />
          <code className="text-sm bg-gray-100 px-2 py-1 rounded">w-8 h-8 (32px)</code>
          <span className="text-sm text-gray-600">Extra large - hero sections</span>
        </div>
      </div>
    </div>
  ),
}

export const Usage: Story = {
  render: () => (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">How to Use Icons</h2>
        <p className="text-sm text-gray-600">Import and use Lucide React icons in your components</p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">1. Import the icon</h3>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`import { Activity, Calendar, User } from 'lucide-react'`}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold mb-2">2. Use in your component</h3>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`<Activity className="w-5 h-5" />
<Calendar className="w-4 h-4 text-blue-600" />
<User className="w-6 h-6 text-gray-500" />`}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold mb-2">3. Common patterns</h3>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`// In buttons
<button className="flex items-center gap-2">
  <Plus className="w-4 h-4" />
  Add Item
</button>

// With custom colors
<Activity className="w-5 h-5 text-[#677344]" />

// Responsive sizes
<Menu className="w-5 h-5 md:w-6 md:h-6" />`}
          </pre>
        </div>
      </div>

      <div className="border-t pt-4">
        <p className="text-sm text-gray-600">
          Browse all available icons at{' '}
          <a
            href="https://lucide.dev/icons"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            lucide.dev/icons
          </a>
        </p>
      </div>
    </div>
  ),
}
