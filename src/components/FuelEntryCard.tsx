import { useMemo } from "react";
import { cn } from "@/lib/utils";

export interface FuelEntryCardProps {
  date: string | Date;
  liters: number;
  cost: number;
  /** Distance covered since previous fill-up, in km. Needed to compute L/100km. */
  distanceKm?: number;
  className?: string;
}

function FuelEntryCard({
  date,
  liters,
  cost,
  distanceKm,
  className,
}: FuelEntryCardProps) {
  const formattedDate = useMemo(() => {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(d);
  }, [date]);

  const pricePerLiter = liters > 0 ? cost / liters : null;
  const consumption =
    distanceKm && distanceKm > 0 ? (liters / distanceKm) * 100 : null;

  return (
    <div className={cn("bg-card rounded-lg border p-4 shadow-sm", className)}>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm font-medium">
          {formattedDate}
        </span>
        <span className="text-lg font-semibold">{cost.toFixed(2)} zł</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <div className="text-muted-foreground">Liters</div>
          <div className="font-medium">{liters.toFixed(2)} L</div>
        </div>
        <div>
          <div className="text-muted-foreground">Price/L</div>
          <div className="font-medium">
            {pricePerLiter !== null ? `${pricePerLiter.toFixed(2)} zł` : "—"}
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-muted-foreground">Consumption</div>
          <div className="font-medium">
            {consumption !== null ? `${consumption.toFixed(2)} L/100km` : "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FuelEntryCard;
