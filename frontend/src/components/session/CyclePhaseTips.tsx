import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { CyclePhaseTipsDto } from '@/types/api'

interface CyclePhaseTipsProps {
  tips: CyclePhaseTipsDto
}

export function CyclePhaseTips({ tips }: CyclePhaseTipsProps) {
  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
      <CardHeader>
        <CardTitle className="text-xl">
          {tips.phase} Phase Wellness Tips
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="nutrition" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
            <TabsTrigger value="rest">Rest</TabsTrigger>
            <TabsTrigger value="injury">Injury Prevention</TabsTrigger>
            <TabsTrigger value="mood">Mood</TabsTrigger>
          </TabsList>

          <TabsContent value="nutrition" className="mt-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground mb-3">Nutrition Guidance</h4>
              <ul className="space-y-2">
                {(tips.nutritionTips || []).map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                    <span className="text-sm">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="rest" className="mt-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground mb-3">Rest & Recovery</h4>
              <ul className="space-y-2">
                {(tips.restTips || []).map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                    <span className="text-sm">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="injury" className="mt-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground mb-3">Injury Prevention</h4>
              <ul className="space-y-2">
                {(tips.injuryPreventionTips || []).map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                    <span className="text-sm">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="mood" className="mt-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground mb-3">Mood & Energy Insights</h4>
              <ul className="space-y-2">
                {(tips.moodInsights || []).map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                    <span className="text-sm">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
