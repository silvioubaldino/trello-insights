"use client";
import { useEffect, useState } from "react";
import { FilterProvider, useFilters } from "@/contexts/FilterContext";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FilterSidebar } from "@/components/dashboard/FilterSidebar";
import { PieChartCard } from "@/components/dashboard/charts/PieChartCard";
import { BarChartCard } from "@/components/dashboard/charts/BarChartCard";
import { LineChartCard } from "@/components/dashboard/charts/LineChartCard";
import { CounterCard } from "@/components/dashboard/charts/CounterCard";
import { StackedBarChartCard } from "@/components/dashboard/charts/StackedBarChartCard";
import { trelloDataService } from "@/services/trelloDataService";
import { Layers, TrendingUp, Loader2 } from "lucide-react";

// Board ID fixo - pode ser movido para variável de ambiente posteriormente
const BOARD_ID = "659436fd99b94b5c7432e98e";

const DashboardContent = () => {
  const { filters } = useFilters();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carrega dados da API do Trello ao montar o componente
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await trelloDataService.refreshFromBackend(BOARD_ID);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setError("Erro ao carregar dados. Usando dados mockados.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const allCards = trelloDataService.getCards();
  const filteredCards = trelloDataService.filterCards(allCards, filters);

  const deliveriesByLabel = trelloDataService.getDeliveriesByLabel(filteredCards);
  const deliveriesByMember = trelloDataService.getDeliveriesByMember(filteredCards);
  const deliveriesByWeek = trelloDataService.getDeliveriesByWeek(filteredCards);
  const avgDaysOpenByMember = trelloDataService.getAverageDaysOpenByMember(filteredCards);
  const rejectionsByMember = trelloDataService.getRejectionsByMember(filteredCards);

  const totalCards = filteredCards.length;
  const avgDaysOpen =
    filteredCards.reduce((sum, card) => sum + (card.daysOpen || 0), 0) / totalCards || 0;

  return (
    <div className="flex min-h-screen bg-background">
      <FilterSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Carregando dados do Trello...</p>
              </div>
            </div>
          ) : (
            <div className="max-w-[1600px] mx-auto space-y-6">
              {error && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                  {error}
                </div>
              )}
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
              
              <StackedBarChartCard
                title="Rejeições por Membro"
                data={rejectionsByMember}
                bars={[
                  {
                    dataKey: "Rejeições Internas",
                    fill: "hsl(var(--chart-1))",
                    name: "Rejeições Internas"
                  },
                  {
                    dataKey: "Rejeições do Cliente",
                    fill: "hsl(var(--chart-2))",
                    name: "Rejeições do Cliente"
                  }
                ]}
              />
            </div>
            </div>
          )}
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
