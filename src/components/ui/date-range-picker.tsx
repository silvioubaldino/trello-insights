import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, addWeeks, subWeeks, addMonths, subMonths, addQuarters, subQuarters, addYears, subYears } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DateRangePickerProps {
  value: { start: Date | null; end: Date | null };
  onChange: (start: Date | null, end: Date | null) => void;
  onClose?: () => void;
}

type PresetOption = "week" | "month" | "quarter" | "year" | "custom";

export const DateRangePicker = ({ value, onChange, onClose }: DateRangePickerProps) => {
  const [tempRange, setTempRange] = React.useState<DateRange | undefined>({
    from: value.start || undefined,
    to: value.end || undefined,
  });
  const [selectedPreset, setSelectedPreset] = React.useState<PresetOption>("custom");

  const applyPreset = (preset: PresetOption, referenceDate: Date = new Date()) => {
    switch (preset) {
      case "week":
        setTempRange({
          from: startOfWeek(referenceDate, { weekStartsOn: 0 }),
          to: endOfWeek(referenceDate, { weekStartsOn: 0 }),
        });
        break;
      case "month":
        setTempRange({
          from: startOfMonth(referenceDate),
          to: endOfMonth(referenceDate),
        });
        break;
      case "quarter":
        setTempRange({
          from: startOfQuarter(referenceDate),
          to: endOfQuarter(referenceDate),
        });
        break;
      case "year":
        setTempRange({
          from: startOfYear(referenceDate),
          to: endOfYear(referenceDate),
        });
        break;
      case "custom":
        // Mantém a seleção atual
        break;
    }
  };

  const handlePresetChange = (preset: PresetOption) => {
    setSelectedPreset(preset);
    applyPreset(preset);
  };

  const handleNavigatePeriod = (direction: "prev" | "next") => {
    if (selectedPreset === "custom" || !tempRange?.from) return;

    const referenceDate = tempRange.from;
    let newReferenceDate: Date;

    switch (selectedPreset) {
      case "week":
        newReferenceDate = direction === "prev" ? subWeeks(referenceDate, 1) : addWeeks(referenceDate, 1);
        break;
      case "month":
        newReferenceDate = direction === "prev" ? subMonths(referenceDate, 1) : addMonths(referenceDate, 1);
        break;
      case "quarter":
        newReferenceDate = direction === "prev" ? subQuarters(referenceDate, 1) : addQuarters(referenceDate, 1);
        break;
      case "year":
        newReferenceDate = direction === "prev" ? subYears(referenceDate, 1) : addYears(referenceDate, 1);
        break;
      default:
        return;
    }

    applyPreset(selectedPreset, newReferenceDate);
  };

  const handleApply = () => {
    onChange(tempRange?.from || null, tempRange?.to || null);
    onClose?.();
  };

  const handleCancel = () => {
    setTempRange({
      from: value.start || undefined,
      to: value.end || undefined,
    });
    onClose?.();
  };

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 w-[680px]">
      {/* Select de opções predefinidas com botões de navegação */}
      <div className="mb-3 flex gap-2">
        <Select value={selectedPreset} onValueChange={(v) => handlePresetChange(v as PresetOption)}>
          <SelectTrigger className="flex-1 h-9">
            <SelectValue placeholder="Selecione um período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Esta semana</SelectItem>
            <SelectItem value="month">Este mês</SelectItem>
            <SelectItem value="quarter">Este trimestre</SelectItem>
            <SelectItem value="year">Este ano</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={() => handleNavigatePeriod("prev")}
          disabled={selectedPreset === "custom"}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={() => handleNavigatePeriod("next")}
          disabled={selectedPreset === "custom"}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Dois calendários lado a lado */}
      <div className="mb-3">
        <Calendar
          mode="range"
          selected={tempRange}
          onSelect={setTempRange}
          numberOfMonths={2}
          defaultMonth={tempRange?.from}
          className="p-0"
        />
      </div>

      {/* Botões de ação */}
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button variant="outline" size="sm" onClick={handleCancel}>
          Cancelar
        </Button>
        <Button size="sm" onClick={handleApply}>
          Aplicar
        </Button>
      </div>
    </div>
  );
};
