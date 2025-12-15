import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChartData } from "@/types/trello";
import { ChartInfoTooltip } from "../ChartInfoTooltip";

interface StackedBarChartCardProps {
  title: string;
  data: ChartData[];
  xAxisKey?: string;
  bars: Array<{
    dataKey: string;
    fill: string;
    name?: string;
  }>;
  description?: string;
}

export const StackedBarChartCard = ({ 
  title, 
  data, 
  xAxisKey = "name",
  bars,
  description
}: StackedBarChartCardProps) => {
  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          {description && <ChartInfoTooltip content={description} />}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey={xAxisKey}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Legend />
            {bars.map((bar, index) => (
              <Bar 
                key={bar.dataKey}
                dataKey={bar.dataKey} 
                stackId="a"
                fill={bar.fill}
                name={bar.name || bar.dataKey}
                radius={index === bars.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
