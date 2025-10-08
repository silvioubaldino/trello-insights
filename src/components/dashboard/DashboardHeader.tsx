import { BarChart3 } from "lucide-react";

export const DashboardHeader = () => {
  return (
    <header className="bg-gradient-to-r from-primary to-accent text-primary-foreground py-6 px-6 shadow-md">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Trello Analytics</h1>
          <p className="text-sm opacity-90">Dashboard de visualização de dados</p>
        </div>
      </div>
    </header>
  );
};
