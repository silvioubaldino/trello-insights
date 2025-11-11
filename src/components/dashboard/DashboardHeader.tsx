import { BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const DashboardHeader = ({ onRefresh, isRefreshing = false }: DashboardHeaderProps) => {
  return (
    <header className="bg-gradient-to-r from-primary to-accent text-primary-foreground py-6 px-6 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Trello Analytics</h1>
            <p className="text-sm opacity-90">Dashboard de visualização de dados</p>
          </div>
        </div>
        
        {onRefresh && (
          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            variant="secondary"
            size="default"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Atualizando...' : 'Atualizar dados'}
          </Button>
        )}
      </div>
    </header>
  );
};
