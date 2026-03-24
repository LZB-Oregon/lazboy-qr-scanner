import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  ScanLine, Package, Search, History, ChevronRight, Clock,
  CheckCircle2, Eye, Sofa, Layers, AlertCircle, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  parts_line: { icon: Package, color: "text-primary" },
  parts_order: { icon: Layers, color: "text-warning" },
  sales_order_line: { icon: Sofa, color: "text-primary" },
  unknown: { icon: AlertCircle, color: "text-destructive" },
};

const ACTION_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  view: { icon: Eye, label: "Viewed", color: "text-muted-foreground" },
  receive: { icon: CheckCircle2, label: "Received", color: "text-success" },
  checkin: { icon: CheckCircle2, label: "Checked In", color: "text-primary" },
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

export default function Home() {
  const { data: pendingParts } = trpc.scanner.partsToReceive.useQuery(
    { limit: 5 },
    { refetchOnWindowFocus: false }
  );
  const { data: history } = trpc.scanner.scanHistory.useQuery(
    { limit: 5 },
    { refetchOnWindowFocus: false }
  );
  const { data: liveData } = trpc.scanner.getLiveData.useQuery(
    undefined,
    { refetchInterval: 30000, refetchOnWindowFocus: true }
  );

  const pendingCount = pendingParts?.length ?? 0;

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-5 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            La-Z-Boy Oregon
          </span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mt-3">
          Warehouse<br />
          <span className="text-primary">Receiving</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Scan barcodes to receive parts and check in furniture
        </p>
      </div>

      {/* Live Data Dashboard */}
      {liveData && (liveData.partsOrdersCount > 0 || liveData.partsLinesCount > 0) && (
        <div className="px-5 mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Live Data</h2>
            <span className="text-xs text-primary font-medium">Real-time</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-card border border-primary/20 flex flex-col">
              <p className="text-xs text-muted-foreground mb-1">Parts Orders</p>
              <p className="text-2xl font-bold text-primary">{liveData.partsOrdersCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Active</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-warning/20 flex flex-col">
              <p className="text-xs text-muted-foreground mb-1">Parts Lines</p>
              <p className="text-2xl font-bold text-warning">{liveData.partsLinesCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Awaiting</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="px-5 space-y-3">
        <Link href="/scan">
          <div className="relative overflow-hidden p-5 rounded-2xl bg-primary text-primary-foreground cursor-pointer active:scale-[0.98] transition-transform">
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-primary-foreground/10" />
            <div className="absolute -right-2 -bottom-6 w-32 h-32 rounded-full bg-primary-foreground/5" />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-foreground/15 flex items-center justify-center flex-shrink-0">
                <ScanLine className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold">Scan Now</p>
                <p className="text-sm opacity-80">QR, Code 128, Code 39, EAN-13</p>
              </div>
              <ChevronRight className="w-5 h-5 opacity-60" />
            </div>
          </div>
        </Link>

        <div className="grid grid-cols-3 gap-3">
          <Link href="/receive">
            <div className="p-4 rounded-xl bg-card border border-border flex flex-col items-center gap-2 cursor-pointer hover:bg-accent transition-colors active:scale-[0.97] relative">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-warning" />
              </div>
              <span className="text-xs font-semibold text-foreground text-center">To Receive</span>
              {pendingCount > 0 && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-warning text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </div>
              )}
            </div>
          </Link>
          <Link href="/search">
            <div className="p-4 rounded-xl bg-card border border-border flex flex-col items-center gap-2 cursor-pointer hover:bg-accent transition-colors active:scale-[0.97]">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Search className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-semibold text-foreground text-center">Search</span>
            </div>
          </Link>
          <Link href="/history">
            <div className="p-4 rounded-xl bg-card border border-border flex flex-col items-center gap-2 cursor-pointer hover:bg-accent transition-colors active:scale-[0.97]">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <History className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-xs font-semibold text-foreground text-center">History</span>
            </div>
          </Link>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="px-5 mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Awaiting Receipt</h2>
            <Link href="/receive">
              <span className="text-xs text-primary font-medium">View all →</span>
            </Link>
          </div>
          <div className="space-y-2">
            {(pendingParts ?? []).slice(0, 3).map((line) => (
              <Link href="/receive" key={line.id}>
                <div className="p-3 rounded-xl bg-card border border-warning/20 flex items-center gap-3 cursor-pointer hover:bg-accent transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {line.partsLineName || line.sku || `Part ${line.id.slice(0, 8)}`}
                    </p>
                    {line.custCode && (
                      <p className="text-xs text-muted-foreground">Code: {line.custCode}</p>
                    )}
                  </div>
                  <span className="badge-ordered text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                    Ordered
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {history && history.length > 0 && (
        <div className="px-5 mt-5 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
            <Link href="/history">
              <span className="text-xs text-primary font-medium">View all →</span>
            </Link>
          </div>
          <div className="space-y-2">
            {history.slice(0, 4).map((item) => {
              const typeConf = TYPE_CONFIG[item.resolvedType ?? "unknown"] ?? TYPE_CONFIG.unknown;
              const actionConf = ACTION_CONFIG[item.action] ?? ACTION_CONFIG.view;
              const TypeIcon = typeConf.icon;
              const ActionIcon = actionConf.icon;
              return (
                <div key={item.id} className="p-3 rounded-xl bg-card border border-border flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <TypeIcon className={cn("w-4 h-4", typeConf.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.displayName ?? item.scannedCode}
                    </p>
                    <span className={cn("flex items-center gap-1 text-xs", actionConf.color)}>
                      <ActionIcon className="w-3 h-3" />
                      {actionConf.label}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(item.scannedAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
