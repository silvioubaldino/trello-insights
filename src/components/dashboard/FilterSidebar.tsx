import { useFilters } from "@/contexts/FilterContext";
import { trelloDataService } from "@/services/trelloDataService";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, FilterX } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";

export const FilterSidebar = () => {
  const { filters, updateMembers, updateLabels, updateDateRange, resetFilters } = useFilters();
  const allCards = trelloDataService.getCards();
  const allMembers = trelloDataService.getAllMembers(allCards);
  const allLabels = trelloDataService.getAllLabels(allCards);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const handleMemberToggle = (member: string) => {
    const newMembers = filters.members.includes(member)
      ? filters.members.filter((m) => m !== member)
      : [...filters.members, member];
    updateMembers(newMembers);
  };

  const handleLabelToggle = (label: string) => {
    const newLabels = filters.labels.includes(label)
      ? filters.labels.filter((l) => l !== label)
      : [...filters.labels, label];
    updateLabels(newLabels);
  };

  const formatDateRange = () => {
    if (filters.dateRange.start && filters.dateRange.end) {
      return `${format(filters.dateRange.start, "dd/MM/yyyy", { locale: ptBR })} - ${format(filters.dateRange.end, "dd/MM/yyyy", { locale: ptBR })}`;
    }
    if (filters.dateRange.start) {
      return `De ${format(filters.dateRange.start, "dd/MM/yyyy", { locale: ptBR })}`;
    }
    if (filters.dateRange.end) {
      return `Até ${format(filters.dateRange.end, "dd/MM/yyyy", { locale: ptBR })}`;
    }
    return "Selecione o período";
  };

  return (
    <aside className="w-80 bg-card border-r border-border">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Filtros</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-8 gap-2"
          >
            <FilterX className="h-4 w-4" />
            Limpar
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="space-y-6">
            {/* Filtro de Período */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Período</Label>
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateRange.start && !filters.dateRange.end && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateRange()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                  <DateRangePicker
                    value={filters.dateRange}
                    onChange={(start, end) => {
                      updateDateRange(start, end);
                    }}
                    onClose={() => setIsDatePickerOpen(false)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Separator />

            {/* Filtro de Membros */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Membros</Label>
              <ScrollArea className="h-[240px] pr-4">
                <div className="space-y-3">
                  {allMembers.map((member) => (
                    <div key={member} className="flex items-center space-x-2">
                      <Checkbox
                        id={`member-${member}`}
                        checked={filters.members.includes(member)}
                        onCheckedChange={() => handleMemberToggle(member)}
                      />
                      <label
                        htmlFor={`member-${member}`}
                        className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {member}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <Separator />

            {/* Filtro de Clientes */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Clientes</Label>
              <ScrollArea className="h-[240px] pr-4">
                <div className="space-y-3">
                  {allLabels.map((label) => (
                    <div key={label} className="flex items-center space-x-2">
                      <Checkbox
                        id={`label-${label}`}
                        checked={filters.labels.includes(label)}
                        onCheckedChange={() => handleLabelToggle(label)}
                      />
                      <label
                        htmlFor={`label-${label}`}
                        className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
};
