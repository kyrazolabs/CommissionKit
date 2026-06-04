"use client"

import * as React from "react"
import { format, getYear, setMonth, setYear } from "date-fns"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface MonthPickerProps {
  value?: string // yyyy-MM
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]

export function MonthPicker({
  value,
  onChange,
  placeholder = "Pick a month",
  className,
}: MonthPickerProps) {
  const date = React.useMemo(() => {
    if (!value) return new Date()
    const [y, m] = value.split("-").map(Number)
    return new Date(y, m - 1, 1)
  }, [value])

  const [viewDate, setViewDate] = React.useState(date)

  const handlePrevYear = () => setViewDate(setYear(viewDate, getYear(viewDate) - 1))
  const handleNextYear = () => setViewDate(setYear(viewDate, getYear(viewDate) + 1))

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = setMonth(viewDate, monthIndex)
    onChange?.(format(newDate, "yyyy-MM"))
  }

  const currentYear = getYear(viewDate)
  const selectedMonth = value ? date.getMonth() : -1
  const selectedYear = value ? date.getFullYear() : -1

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal h-9 rounded-md border border-input bg-transparent px-3 py-1 shadow-sm hover:bg-transparent",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(date, "MMMM yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-54 p-3" align="start">
        <div className="flex items-center justify-between mb-4 px-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={(e) => {
              e.preventDefault()
              handlePrevYear()
            }}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="text-sm font-semibold">
            {currentYear}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={(e) => {
              e.preventDefault()
              handleNextYear()
            }}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MONTHS.map((month, index) => {
            const isSelected = selectedYear === currentYear && selectedMonth === index
            return (
              <Button
                key={month}
                variant={isSelected ? "default" : "ghost"}
                className={cn(
                  "h-6 w-full text-sm font-normal",
                  isSelected && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                onClick={(e) => {
                  e.preventDefault()
                  handleMonthSelect(index)
                }}
              >
                {month}
              </Button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
