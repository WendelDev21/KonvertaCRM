import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import type { ReactNode } from "react"

interface TrendProps {
  value: number
  isPositive: boolean
}

interface DashboardCardProps {
  title: string
  description?: string
  value: ReactNode
  icon: ReactNode
  trend?: TrendProps
  className?: string
  children?: ReactNode
}

export function DashboardCard({ title, description, value, icon, trend, className, children }: DashboardCardProps) {
  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <div className="h-8 w-8 rounded-full bg-muted/20 p-1.5 flex items-center justify-center">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className="flex items-center text-xs mt-1">
            {trend.isPositive ? (
              <ArrowUpIcon className="h-3 w-3 text-emerald-500 mr-1" />
            ) : (
              <ArrowDownIcon className="h-3 w-3 text-rose-500 mr-1" />
            )}
            <span className={cn("font-medium", trend.isPositive ? "text-emerald-500" : "text-rose-500")}>
              {trend.value}%
            </span>
            <span className="text-muted-foreground ml-1">em relação ao período anterior</span>
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  )
}
