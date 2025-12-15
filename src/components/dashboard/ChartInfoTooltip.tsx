import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChartInfoTooltipProps {
  content: string;
}

export const ChartInfoTooltip = ({ content }: ChartInfoTooltipProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help inline-flex items-center justify-center">
            <HelpCircle className="h-4 w-4 text-muted-foreground/70 hover:text-muted-foreground transition-colors" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm font-normal">
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

