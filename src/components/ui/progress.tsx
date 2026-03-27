"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

function Progress({
  className,
  value = 0,
  ...props
}: ProgressProps) {
  return (
    <div
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </div>
  )
}

export { Progress }
