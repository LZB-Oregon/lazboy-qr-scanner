import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { PartDetailSheet } from "@/components/PartDetailSheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, Package, Layers, Hash, Tag, ChevronRight, Loader2, X, Sofa
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PartsLineRecord, PartsOrderRecord } from "../../../server/hubspot";

type SearchType = "auto" | "po" | "pro" | "ali";
type LookupResult =
  | { type: "parts_line"; record: PartsLineRecord }
  | { type: "parts_order"; record: PartsOrderRecord }
  | { type: "not_found"; code: string };

const SEARCH_TABS: { key: SearchType; label: string }[] = [
  { key: "auto", label: "All" },
  { key: "po", label: "PO#" },
  { key: "pro", label: "PRO#" },
  { key: "ali", label: "ALI#" },
];

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const s = status.toLowerCase();
  if (s === "received") return <span className="badge-received text-xs px-2 py-0.5 rounded-full font-medium">{status}</span>;
  if (s === "ordered") return <span className="badge-ordered text-xs px-2 py-0.5 rounded-full font-medium">{status}</span>;
  return <span className="badge-to-order text-xs px-2 py-0.5 rounded-full">{status}</span>;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("auto");
  const [activeQuery, setActiveQuery] = useState<{ q: string; type: SearchType } | null>(null);
  const [selectedResult, setSelectedResult] = useState<LookupResult | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error } = trpc.scanner.search.useQuery(
    { query: activeQuery?.q ?? "", type: activeQuery?.type ?? "auto" },
    { enabled: !!activeQuery?.q }
  );

  const handleSearch = () => {
    if (!query.trim()) return;
    setActiveQuery({ q: query.trim(), type: searchType });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleSelectLine = (record: PartsLineRecord) => {
    setSelectedResult({ type: "parts_line", record });
    setSheetOpen(true);
  };

  const handleSelectOrder = (record: PartsOrderRecord) => {
    setSelectedResult({ type: "parts_order", record });
    setSheetOpen(true);
  };

  const totalResults = (data?.orders?.length ?? 0) + (data?.lines?.length ?? 0);

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground">Search</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Look up parts by PO#, PRO#, or ALI#
        </p>
      </div>

      {/* Search input */}
      <div className="px-5 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Enter PO#, PRO#, or ALI number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-11 pr-10 h-12 bg-input border-border text-foreground text-base rounded-xl"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setActiveQuery(null); inputRef.current?.focus(); }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Type tabs */}
        <div className="flex gap-2">
          {SEARCH_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSearchType(tab.key)}
              className={cn(
                "flex-1 h-9 rounded-lg text-sm font-medium transition-all",
                searchType === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Button
          onClick={handleSearch}
          disabled={!query.trim() || isLoading}
          className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Searching...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4" /> Search
            </span>
          )}
        </Button>
      </div>

      {/* Results */}
      <div className="flex-1 px-5 mt-5 space-y-2 pb-6">
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {error.message}
          </div>
        )}

        {activeQuery && !isLoading && totalResults === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No results found</p>
            <p className="text-sm text-muted-foreground">
              Try a different search term or type
            </p>
          </div>
        )}

        {!activeQuery && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Enter a search term above to find parts
            </p>
          </div>
        )}

        {/* Results count */}
        {totalResults > 0 && (
          <p className="text-xs text-muted-foreground pb-1">
            {totalResults} result{totalResults !== 1 ? "s" : ""} for "{activeQuery?.q}"
          </p>
        )}

        {/* Parts Orders */}
        {(data?.orders ?? []).map((order) => (
          <button
            key={order.id}
            onClick={() => handleSelectOrder(order)}
            className="w-full p-4 rounded-xl bg-card border border-border text-left flex items-center gap-3 hover:bg-accent transition-colors active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs text-muted-foreground">Parts Order</span>
                {order.status && <StatusBadge status={order.status} />}
              </div>
              <p className="font-semibold text-foreground truncate">
                {order.poNumber ?? `#${order.id}`}
              </p>
              {order.expectedArrival && (
                <p className="text-xs text-muted-foreground">ETA: {order.expectedArrival}</p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </button>
        ))}

        {/* Parts Lines */}
        {(data?.lines ?? []).map((line) => (
          <button
            key={line.id}
            onClick={() => handleSelectLine(line)}
            className="w-full p-4 rounded-xl bg-card border border-border text-left flex items-center gap-3 hover:bg-accent transition-colors active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs text-muted-foreground">Parts Line</span>
                {line.lineStatus && <StatusBadge status={line.lineStatus} />}
              </div>
              <p className="font-semibold text-foreground truncate">
                {line.spotProNumber ? `PRO: ${line.spotProNumber}` : `ALI: ${line.aliNumber ?? line.id}`}
              </p>
              {line.partCategory && (
                <p className="text-xs text-muted-foreground">{line.partCategory}</p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </button>
        ))}
      </div>

      <PartDetailSheet
        result={selectedResult}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}
