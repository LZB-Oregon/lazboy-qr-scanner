import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PartDetailSheet } from "@/components/PartDetailSheet";
import { Button } from "@/components/ui/button";
import {
  Package, ChevronRight, RefreshCw, Loader2, Inbox, Clock, Truck, MapPin, Hash
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PartsLineRecord } from "../../../server/hubspot";

type LookupResult = { type: "parts_line"; record: PartsLineRecord };

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const s = status.toLowerCase();
  if (s === "received") return <span className="badge-received text-xs px-2 py-0.5 rounded-full font-medium">{status}</span>;
  if (s === "ordered") return <span className="badge-ordered text-xs px-2 py-0.5 rounded-full font-medium">{status}</span>;
  return <span className="badge-to-order text-xs px-2 py-0.5 rounded-full">{status}</span>;
}

export default function ReceivePage() {
  const [selectedResult, setSelectedResult] = useState<LookupResult | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data, isLoading, error, refetch, isFetching } = trpc.scanner.partsToReceive.useQuery(
    { limit: 50 },
    { refetchOnWindowFocus: false }
  );

  const handleSelect = (record: PartsLineRecord) => {
    setSelectedResult({ type: "parts_line", record });
    setSheetOpen(true);
  };

  const handleReceived = () => {
    setSheetOpen(false);
    refetch();
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">To Receive</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Parts with status: Ordered
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-10 h-10 rounded-xl border-border bg-accent"
        >
          <RefreshCw className={cn("w-4 h-4 text-muted-foreground", isFetching && "animate-spin")} />
        </Button>
      </div>

      {/* Count badge */}
      {data && data.length > 0 && (
        <div className="px-5 mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 border border-warning/20">
            <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
            <span className="text-sm font-medium text-warning">
              {data.length} part{data.length !== 1 ? "s" : ""} awaiting receipt
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 px-5 pb-6">
        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Loading parts...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {error.message}
          </div>
        )}

        {!isLoading && !error && data?.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
              <Inbox className="w-8 h-8 text-success" />
            </div>
            <div>
              <p className="font-semibold text-foreground">All caught up!</p>
              <p className="text-sm text-muted-foreground mt-1">
                No parts awaiting receipt
              </p>
            </div>
            <Button variant="outline" onClick={() => refetch()} className="mt-2">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {(data ?? []).map((line) => (
            <button
              key={line.id}
              onClick={() => handleSelect(line)}
              className="w-full p-4 rounded-xl bg-card border border-border text-left flex items-start gap-3 hover:bg-accent transition-colors active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Package className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-foreground truncate">
                    {line.spotProNumber
                      ? `PRO: ${line.spotProNumber}`
                      : line.aliNumber
                      ? `ALI: ${line.aliNumber}`
                      : `#${line.id}`}
                  </p>
                  <StatusBadge status={line.lineStatus} />
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                  {line.partCategory && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Package className="w-3 h-3" /> {line.partCategory}
                    </span>
                  )}
                  {line.partDeliveryMethod && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Truck className="w-3 h-3" /> {line.partDeliveryMethod}
                    </span>
                  )}
                  {line.chargeCode && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Hash className="w-3 h-3" /> {line.chargeCode}
                    </span>
                  )}
                </div>

                {line.poNumber && (
                  <p className="text-xs text-muted-foreground font-mono">PO: {line.poNumber}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-3" />
            </button>
          ))}
        </div>
      </div>

      <PartDetailSheet
        result={selectedResult}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onReceived={handleReceived}
      />
    </div>
  );
}
