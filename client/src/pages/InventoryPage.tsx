import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Sofa, RefreshCw, Loader2, Inbox, MapPin, Clock, User, Tag, Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { STORE_LOCATIONS, LOCATION_CHECKPOINTS } from "@shared/const";

export default function InventoryPage() {
  const [selectedStore, setSelectedStore] = useState<string>("00");
  const [isFetching, setIsFetching] = useState(false);

  // Fetch furniture items for the selected store
  const { data: inventory, isLoading, error, refetch } = trpc.scanner.getStoreInventory.useQuery(
    { storeCd: selectedStore },
    { refetchOnWindowFocus: false }
  );

  const handleRefresh = async () => {
    setIsFetching(true);
    await refetch();
    setIsFetching(false);
  };

  const getStoreName = (code: string) => {
    return STORE_LOCATIONS.find(s => s.code === code)?.name || code;
  };

  const getCheckpointColor = (checkpoint?: number) => {
    if (!checkpoint) return "bg-gray-600";
    const cp = LOCATION_CHECKPOINTS.find(c => c.id === checkpoint);
    return cp?.color || "bg-gray-600";
  };

  const getCheckpointLabel = (checkpoint?: number) => {
    if (!checkpoint) return "Unknown";
    const cp = LOCATION_CHECKPOINTS.find(c => c.id === checkpoint);
    return cp?.label || "Unknown";
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Store Inventory</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View furniture by location
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isFetching}
          className="w-10 h-10 rounded-xl border-border bg-accent"
        >
          <RefreshCw className={cn("w-4 h-4 text-muted-foreground", isFetching && "animate-spin")} />
        </Button>
      </div>

      {/* Store selector */}
      <div className="px-5 mb-4">
        <label className="text-xs text-muted-foreground mb-2 block font-semibold">
          Select Store Location
        </label>
        <Select value={selectedStore} onValueChange={setSelectedStore}>
          <SelectTrigger className="h-12 bg-input border-border text-foreground text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {STORE_LOCATIONS.map((store) => (
              <SelectItem key={store.code} value={store.code} className="text-foreground">
                {store.code} - {store.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Count badge */}
      {inventory && inventory.length > 0 && (
        <div className="px-5 mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">
              {inventory.length} item{inventory.length !== 1 ? "s" : ""} at {getStoreName(selectedStore)}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 px-5 pb-6">
        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Loading inventory...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {error.message}
          </div>
        )}

        {!isLoading && !error && inventory?.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/10 flex items-center justify-center">
              <Inbox className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No furniture at this location</p>
              <p className="text-sm text-muted-foreground mt-1">
                {getStoreName(selectedStore)} has no items in inventory
              </p>
            </div>
            <Button variant="outline" onClick={handleRefresh} className="mt-2">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {(inventory ?? []).map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-card border border-border text-left flex flex-col gap-3 hover:bg-accent transition-colors"
            >
              {/* Header with name and checkpoint */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sofa className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {item.name || `#${item.id}`}
                    </p>
                    {item.sku && (
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{item.sku}</p>
                    )}
                  </div>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium text-white flex-shrink-0",
                  getCheckpointColor(item.locationCheckpoint)
                )}>
                  {getCheckpointLabel(item.locationCheckpoint)}
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3">
                {item.description && (
                  <div className="col-span-2 flex items-start gap-2">
                    <Tag className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                  </div>
                )}

                {item.chargeCode && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">Charge: {item.chargeCode}</span>
                  </div>
                )}

                {item.locCd && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">Loc: {item.locCd}</span>
                  </div>
                )}

                {item.lastScanAt && (
                  <div className="col-span-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">
                      Last scan: {new Date(item.lastScanAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
