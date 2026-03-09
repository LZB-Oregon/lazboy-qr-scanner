import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PartDetailSheet } from "@/components/PartDetailSheet";
import { Button } from "@/components/ui/button";
import {
  Package, Layers, Sofa, CheckCircle2, Eye, RefreshCw, Loader2,
  History, Clock, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PartsLineRecord, PartsOrderRecord, SalesOrderLineRecord } from "../../../server/hubspot";
import { trpc as trpcClient } from "@/lib/trpc";

type ScanHistoryItem = {
  id: number;
  scannedCode: string;
  resolvedType: string | null;
  hubspotId: string | null;
  displayName: string | null;
  action: "view" | "receive" | "checkin";
  success: number;
  note: string | null;
  userId: number | null;
  scannedAt: Date;
};

type LookupResult =
  | { type: "parts_line"; record: PartsLineRecord }
  | { type: "parts_order"; record: PartsOrderRecord }
  | { type: "sales_order_line"; record: SalesOrderLineRecord }
  | { type: "not_found"; code: string };

const ACTION_CONFIG = {
  view: { icon: Eye, label: "Viewed", color: "text-muted-foreground" },
  receive: { icon: CheckCircle2, label: "Received", color: "text-success" },
  checkin: { icon: CheckCircle2, label: "Checked In", color: "text-primary" },
};

const TYPE_CONFIG = {
  parts_line: { icon: Package, label: "Parts Line", color: "text-primary" },
  parts_order: { icon: Layers, label: "Parts Order", color: "text-warning" },
  sales_order_line: { icon: Sofa, label: "Furniture", color: "text-primary" },
  unknown: { icon: AlertCircle, label: "Unknown", color: "text-muted-foreground" },
};

function formatTime(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function HistoryPage() {
  const [selectedResult, setSelectedResult] = useState<LookupResult | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data, isLoading, error, refetch, isFetching } = trpc.scanner.scanHistory.useQuery(
    { limit: 50 },
    { refetchOnWindowFocus: false }
  );

  const lookupMutation = trpcClient.scanner.lookup.useMutation({
    onSuccess: (result) => {
      setSelectedResult(result);
      setSheetOpen(true);
    },
  });

  const handleItemTap = (item: ScanHistoryItem) => {
    if (item.hubspotId && item.resolvedType) {
      const prefix = item.resolvedType === "parts_line" ? "PL:"
        : item.resolvedType === "parts_order" ? "PO:"
        : item.resolvedType === "sales_order_line" ? "SOL:"
        : "";
      if (prefix) {
        lookupMutation.mutate({ code: `${prefix}${item.hubspotId}` });
        return;
      }
    }
    lookupMutation.mutate({ code: item.scannedCode });
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">History</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Recent scans and actions
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

      <div className="flex-1 px-5 pb-6">
        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Loading history...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {error.message}
          </div>
        )}

        {!isLoading && !error && data?.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
              <History className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No scan history yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start scanning to build your audit trail
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {(data ?? []).map((item) => {
            const typeConf = TYPE_CONFIG[(item.resolvedType as keyof typeof TYPE_CONFIG) ?? "unknown"] ?? TYPE_CONFIG.unknown;
            const actionConf = ACTION_CONFIG[item.action] ?? ACTION_CONFIG.view;
            const TypeIcon = typeConf.icon;
            const ActionIcon = actionConf.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleItemTap(item)}
                className="w-full p-4 rounded-xl bg-card border border-border text-left flex items-start gap-3 hover:bg-accent transition-colors active:scale-[0.98]"
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  item.success ? "bg-primary/10" : "bg-destructive/10"
                )}>
                  <TypeIcon className={cn("w-5 h-5", item.success ? typeConf.color : "text-destructive")} />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-foreground truncate text-sm">
                      {item.displayName ?? item.scannedCode}
                    </p>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatTime(item.scannedAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={cn("flex items-center gap-1 text-xs font-medium", actionConf.color)}>
                      <ActionIcon className="w-3 h-3" />
                      {actionConf.label}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{typeConf.label}</span>
                  </div>

                  {item.note && (
                    <p className="text-xs text-muted-foreground font-mono">{item.note}</p>
                  )}

                  {!item.success && (
                    <p className="text-xs text-destructive">Not found</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <PartDetailSheet
        result={selectedResult}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}
