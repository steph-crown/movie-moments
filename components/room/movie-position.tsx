import { Clock2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

export function MoviePosition() {
  return (
    <div className="bg-secondary px-4 lg:px-6 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Clock2 className="h-4 text-muted-foreground" />

        <p className="text-[13px] text-muted-foreground font-medium">
          Your position:
        </p>

        <Badge className="bg-foreground rounded-sm font-medium">
          S1E1 1:24:30
        </Badge>

        <Button variant="outline" size="sm" className="">
          Update
        </Button>
      </div>

      <div className="hidden lg:flex items-center gap-4 ">
        <div className="flex items-center gap-1 text-[13px] text-muted-foreground font-medium">
          <div className="h-2 w-2 rounded-full bg-chart-2" /> <p>6 in sync</p>
        </div>

        <div className="flex items-center gap-1 text-[13px] text-muted-foreground font-medium">
          <div className="h-2 w-2 rounded-full bg-chart-4" /> <p>6 behind</p>
        </div>

        <div className="flex items-center gap-1 text-[13px] text-muted-foreground font-medium">
          <div className="h-2 w-2 rounded-full bg-chart-1" /> <p>2 ahead</p>
        </div>
      </div>
    </div>
  );
}
