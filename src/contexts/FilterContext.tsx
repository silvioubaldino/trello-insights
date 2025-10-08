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

const initialFilters: TrelloFilters = {
  members: [],
  labels: [],
  dateRange: {
    start: null,
    end: null,
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
    setFilters(initialFilters);
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
