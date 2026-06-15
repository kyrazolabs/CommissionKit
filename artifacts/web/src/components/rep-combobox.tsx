import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface RepOption {
  id: string;
  name: string;
}

interface RepComboboxProps {
  reps: RepOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  includeAll?: boolean;
  allLabel?: string;
}

export function RepCombobox({
  reps,
  value,
  onChange,
  disabled,
  className,
  placeholder,
  includeAll,
  allLabel,
}: RepComboboxProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const selected = includeAll && value === "all"
    ? null
    : reps.find((r) => String(r.id) === value);

  const displayName = includeAll && value === "all"
    ? (allLabel ?? t("common.allReps"))
    : selected?.name;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            !displayName && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">
            {displayName ?? placeholder ?? t("common.selectRep")}
          </span>
          <ChevronsUpDown className="ml-2 size-3.5 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder={t("reps.searchReps")} />
          <CommandList className="max-h-60">
            <CommandEmpty>{t("reps.noRepsFound")}</CommandEmpty>
            <CommandGroup>
              {includeAll && (
                <CommandItem
                  value="all"
                  onSelect={() => {
                    onChange("all");
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <span>{allLabel ?? t("common.allReps")}</span>
                  {value === "all" && <Check className="ml-auto size-3.5 text-primary shrink-0" />}
                </CommandItem>
              )}
              {reps.map((r) => (
                <CommandItem
                  key={r.id}
                  value={`${r.name}`}
                  onSelect={() => {
                    onChange(String(r.id));
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <span className="truncate">{r.name}</span>
                  {value === String(r.id) && <Check className="ml-auto size-3.5 text-primary shrink-0" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
