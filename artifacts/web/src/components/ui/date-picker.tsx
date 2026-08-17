"use client";

import { format, isValid, parse } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  date?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  date,
  onChange,
  placeholder = "Pick a date",
  className,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal h-9 rounded-md border border-input bg-transparent px-3 py-1 shadow-sm hover:bg-transparent no-click",
            !date && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date && isValid(date) ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          className="rounded-md"
          mode="single"
          selected={date}
          onSelect={onChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export function DateRangePicker({
  from,
  to,
  onRangeChange,
  placeholder = "Pick a date range",
  className,
  numberOfMonths = 2,
}: {
  from?: Date;
  to?: Date;
  onRangeChange?: (range: { from?: Date; to?: Date } | undefined) => void;
  placeholder?: string;
  className?: string;
  numberOfMonths?: number;
}) {
  const range = React.useMemo(() => ({ from, to }), [from, to]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal h-9 rounded-md border border-input bg-background px-3 py-1 shadow-sm no-click",
            !from && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {from ? (
            to ? (
              <>
                {format(from, "LLL dd, y")} - {format(to, "LLL dd, y")}
              </>
            ) : (
              format(from, "LLL dd, y")
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={from}
          selected={range}
          onSelect={(r) => onRangeChange?.(r as any)}
          numberOfMonths={numberOfMonths}
        />
      </PopoverContent>
    </Popover>
  );
}
