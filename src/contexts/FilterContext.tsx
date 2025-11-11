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
 * Retorna o domingo da semana atual
 */
const getCurrentWeekStart = (): Date => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);
  sunday.setHours(0, 0, 0, 0);
  return sunday;
};

/**
 * Retorna o sábado da semana atual
 */
const getCurrentWeekEnd = (): Date => {
  const sunday = getCurrentWeekStart();
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  saturday.setHours(23, 59, 59, 999);
  return saturday;
};

const initialFilters: TrelloFilters = {
  members: [],
  labels: [],
  dateRange: {
    start: getCurrentWeekStart(),
    end: getCurrentWeekEnd(),
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
