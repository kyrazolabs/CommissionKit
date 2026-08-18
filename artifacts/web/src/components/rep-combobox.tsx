import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
  /** When provided, enables server-side search. Called with the search query. Parent should update `reps` prop. */
  onSearch?: (query: string) => void;
  /** Whether a server-side search is in progress */
  searching?: boolean;
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
  onSearch,
  searching,
}: RepComboboxProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const selected = includeAll && value === "all" ? null : reps.find((r) => String(r.id) === value);

  const displayName =
    includeAll && value === "all" ? (allLabel ?? t("common.allReps")) : selected?.name;

  const handleSearch = useCallback(
    (query: string) => {
      if (onSearch) {
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
          onSearch(query);
        }, 300);
      }
    },
    [onSearch],
  );

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
          <span className="truncate">{displayName ?? placeholder ?? t("common.selectRep")}</span>
          <ChevronsUpDown className="ml-2 size-3.5 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-75 p-0" align="start">
        <Command shouldFilter={!onSearch}>
          <CommandInput
            placeholder={t("reps.searchReps")}
            onValueChange={onSearch ? handleSearch : undefined}
          />
          <CommandList className="max-h-60">
            {searching ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin mr-2" />
                Searching...
              </div>
            ) : (
              <>
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
                      {value === "all" && (
                        <Check className="ml-auto size-3.5 text-primary shrink-0" />
                      )}
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
                      {value === String(r.id) && (
                        <Check className="ml-auto size-3.5 text-primary shrink-0" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
