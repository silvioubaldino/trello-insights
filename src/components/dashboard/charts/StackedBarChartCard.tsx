import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChartData } from "@/types/trello";

interface StackedBarChartCardProps {
  title: string;
  data: ChartData[];
  xAxisKey?: string;
  bars: Array<{
    dataKey: string;
    fill: string;
    name?: string;
  }>;
}

export const StackedBarChartCard = ({ 
  title, 
  data, 
  xAxisKey = "name",
  bars 
}: StackedBarChartCardProps) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
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
