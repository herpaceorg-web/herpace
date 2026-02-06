import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const [indicatorStyle, setIndicatorStyle] = React.useState<{
    left: number
    width: number
    height: number
    top: number
  } | null>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  const updateActiveTabPosition = React.useCallback(() => {
    const list = listRef.current
    if (!list) return

    const activeTab = list.querySelector('[data-state="active"]') as HTMLElement
    if (activeTab) {
      const listRect = list.getBoundingClientRect()
      const tabRect = activeTab.getBoundingClientRect()

      setIndicatorStyle({
        left: tabRect.left - listRect.left,
        width: tabRect.width,
        height: tabRect.height,
        top: tabRect.top - listRect.top,
      })
    }
  }, [])

  React.useEffect(() => {
    // Update on mount and when props change
    updateActiveTabPosition()

    // Update on resize
    const handleResize = () => updateActiveTabPosition()
    window.addEventListener('resize', handleResize)

    // Use MutationObserver to detect tab changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-state') {
          updateActiveTabPosition()
        }
      })
    })

    if (listRef.current) {
      observer.observe(listRef.current, {
        attributes: true,
        attributeFilter: ['data-state'],
        subtree: true,
        childList: true,
      })
    }

    // Also listen for click events to ensure immediate updates
    const handleClick = () => {
      // Small delay to let Radix update the DOM
      setTimeout(updateActiveTabPosition, 0)
    }
    listRef.current?.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('resize', handleResize)
      observer.disconnect()
      listRef.current?.removeEventListener('click', handleClick)
    }
  }, [updateActiveTabPosition])

  return (
    <TabsPrimitive.List
      ref={(node) => {
        listRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      }}
      className={cn(
        "relative inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    >
      {/* Sliding indicator */}
      {indicatorStyle && (
        <div
          className="absolute bg-white shadow-sm transition-all duration-300 ease-in-out z-0"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
            height: `${indicatorStyle.height}px`,
            top: `${indicatorStyle.top}px`,
            borderRadius: 'inherit',
          }}
        />
      )}
      {props.children}
    </TabsPrimitive.List>
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground z-10",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
