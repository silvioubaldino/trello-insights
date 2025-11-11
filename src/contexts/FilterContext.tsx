import React, { createContext, useContext, useState, ReactNode } from "react";
import { TrelloFilters } from "@/types/trello";

interface FilterContextType {
  filters: TrelloFilters;
  setFilters: (filters: TrelloFilters) => void;
  updateMembers: (members: string[]) => void;
  updateLabels: (labels: string[]) => void;
  updateDateRange: (start: Date | null, end: Date | null) => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

/**
 * Calcula o início da semana atual (domingo)
 */
function getCurrentWeekStart(): Date {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
  
  // Retrocede para o domingo da semana atual
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);
  
  // Zera horas para início do dia
  sunday.setHours(0, 0, 0, 0);
  
  return sunday;
}

/**
 * Calcula o fim da semana atual (sábado 23:59:59)
 */
function getCurrentWeekEnd(): Date {
  const weekStart = getCurrentWeekStart();
  const saturday = new Date(weekStart);
  
  // Avança 6 dias para o sábado
  saturday.setDate(weekStart.getDate() + 6);
  
  // Define para fim do dia
  saturday.setHours(23, 59, 59, 999);
  
  return saturday;
}

// Filtros iniciais com semana atual pré-preenchida
const initialFilters: TrelloFilters = {
  members: [],
  labels: [],
  dateRange: {
    start: getCurrentWeekStart(),  // Domingo da semana atual
    end: getCurrentWeekEnd(),      // Sábado da semana atual
  },
};

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<TrelloFilters>(initialFilters);

  const updateMembers = (members: string[]) => {
    setFilters((prev) => ({ ...prev, members }));
  };

  const updateLabels = (labels: string[]) => {
    setFilters((prev) => ({ ...prev, labels }));
  };

  const updateDateRange = (start: Date | null, end: Date | null) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: { start, end },
    }));
  };

  const resetFilters = () => {
    // Recalcula a semana atual ao resetar (caso tenha mudado de semana)
    setFilters({
      members: [],
      labels: [],
      dateRange: {
        start: getCurrentWeekStart(),
        end: getCurrentWeekEnd(),
      },
    });
  };

  return (
    <FilterContext.Provider
      value={{
        filters,
        setFilters,
        updateMembers,
        updateLabels,
        updateDateRange,
        resetFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return context;
};
