import { useFilters } from "@/contexts/FilterContext";
import { trelloDataService } from "@/services/trelloDataService";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, FilterX } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const FilterSidebar = () => {
  const { filters, updateMembers, updateLabels, updateDateRange, resetFilters } = useFilters();
  const allCards = trelloDataService.getCards();
  const allMembers = trelloDataService.getAllMembers(allCards);
  const allLabels = trelloDataService.getAllLabels(allCards);

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
            {/* Filtro de Membros */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Membros</Label>
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
            </div>

            <Separator />

            {/* Filtro de Clientes */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Clientes</Label>
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
            </div>

            <Separator />

            {/* Filtro de Período */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Período</Label>
              <div className="space-y-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateRange.start && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.start ? (
                        format(filters.dateRange.start, "PPP", { locale: ptBR })
                      ) : (
                        <span>Data inicial</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover z-50">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.start || undefined}
                      onSelect={(date) => updateDateRange(date || null, filters.dateRange.end)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateRange.end && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.end ? (
                        format(filters.dateRange.end, "PPP", { locale: ptBR })
                      ) : (
                        <span>Data final</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover z-50">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.end || undefined}
                      onSelect={(date) => updateDateRange(filters.dateRange.start, date || null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
};
