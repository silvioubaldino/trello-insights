"use client";
import { FilterProvider, useFilters } from "@/contexts/FilterContext";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FilterSidebar } from "@/components/dashboard/FilterSidebar";
import { PieChartCard } from "@/components/dashboard/charts/PieChartCard";
import { BarChartCard } from "@/components/dashboard/charts/BarChartCard";
import { LineChartCard } from "@/components/dashboard/charts/LineChartCard";
import { CounterCard } from "@/components/dashboard/charts/CounterCard";
import { trelloDataService } from "@/services/trelloDataService";
import { Layers, TrendingUp } from "lucide-react";

const DashboardContent = () => {
  const { filters } = useFilters();
  const allCards = trelloDataService.getCards();
  const filteredCards = trelloDataService.filterCards(allCards, filters);

  const deliveriesByLabel = trelloDataService.getDeliveriesByLabel(filteredCards);
  const deliveriesByMember = trelloDataService.getDeliveriesByMember(filteredCards);
  const deliveriesByWeek = trelloDataService.getDeliveriesByWeek(filteredCards);
  const avgDaysOpenByMember = trelloDataService.getAverageDaysOpenByMember(filteredCards);

  const totalCards = filteredCards.length;
  const avgDaysOpen =
    filteredCards.reduce((sum, card) => sum + (card.daysOpen || 0), 0) / totalCards || 0;

  return (
    <div className="flex min-h-screen bg-background">
      <FilterSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6">
          <div className="max-w-[1600px] mx-auto space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CounterCard
                title="Total de Cards"
                value={totalCards}
                icon={Layers}
                subtitle="Cards entregues no período"
              />
              <CounterCard
                title="Média de Dias em Aberto"
                value={Math.round(avgDaysOpen * 10) / 10}
                icon={TrendingUp}
                subtitle="Tempo médio até entrega"
              />
              <CounterCard
                title="Membros Ativos"
                value={trelloDataService.getAllMembers(filteredCards).length}
                icon={Layers}
                subtitle="Pessoas trabalhando"
              />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PieChartCard
                title="Entregas por Cliente"
                data={deliveriesByLabel}
              />
              
              <BarChartCard
                title="Entregas por Pessoa"
                data={deliveriesByMember}
              />
              
              <LineChartCard
                title="Entregas por Semana"
                data={deliveriesByWeek}
              />
              
              <BarChartCard
                title="Média de Dias em Aberto por Membro"
                data={avgDaysOpenByMember}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <FilterProvider>
      <DashboardContent />
    </FilterProvider>
  );
};

export default Index;
