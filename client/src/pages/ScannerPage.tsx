import { useState, useCallback } from "react";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { PartDetailSheet } from "@/components/PartDetailSheet";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Scan, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LookupResult = Awaited<ReturnType<typeof import("../../../server/hubspot").lookupByCode>>;

type ScanState = "idle" | "scanning" | "loading" | "done" | "error";

export default function ScannerPage() {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(true);

  const lookupMutation = trpc.scanner.lookup.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setScanState("done");
      setSheetOpen(true);
      if (data.type === "not_found") {
        toast.error("No record found", { description: `Code: ${data.code}` });
      }
    },
    onError: (err) => {
      setErrorMsg(err.message);
      setScanState("error");
      toast.error("Lookup failed", { description: err.message });
      setTimeout(() => { setScanState("idle"); setScannerActive(true); }, 3000);
    },
  });

  const handleScan = useCallback((code: string) => {
    if (scanState === "loading") return;
    setScannerActive(false);
    setScanState("loading");
    setErrorMsg(null);
    lookupMutation.mutate({ code });
  }, [scanState, lookupMutation]);

  const handleSheetClose = () => {
    setSheetOpen(false);
    setTimeout(() => {
      setScanState("idle");
      setScannerActive(true);
    }, 500);
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground">Scan</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Point camera at QR code or barcode
        </p>
      </div>

      {/* Scanner area */}
      <div className="flex-1 px-5 flex flex-col items-center gap-4">
        <div className="relative w-full max-w-[380px]">
          <BarcodeScanner
            onScan={handleScan}
            active={scannerActive}
            onError={(e) => toast.error("Camera error", { description: e })}
          />

          {/* Loading overlay */}
          {scanState === "loading" && (
            <div className="absolute inset-0 rounded-2xl bg-black/70 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm font-medium text-white">Looking up record...</p>
            </div>
          )}

          {/* Error overlay */}
          {scanState === "error" && (
            <div className="absolute inset-0 rounded-2xl bg-destructive/20 flex flex-col items-center justify-center gap-3 border border-destructive/30">
              <AlertCircle className="w-10 h-10 text-destructive" />
              <p className="text-sm font-medium text-destructive text-center px-4">{errorMsg}</p>
            </div>
          )}
        </div>

        {/* Supported formats */}
        <div className="w-full max-w-[380px] glass-card rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Supported Formats
          </p>
          <div className="grid grid-cols-3 gap-2">
            {["QR Code", "Code 128", "Code 39", "EAN-13", "EAN-8", "Data Matrix"].map((fmt) => (
              <div key={fmt} className="px-2 py-1.5 rounded-lg bg-accent text-center">
                <span className="text-xs text-muted-foreground">{fmt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* QR code format guide */}
        <div className="w-full max-w-[380px] glass-card rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            QR Code Prefixes
          </p>
          <div className="space-y-1.5">
            {[
              { prefix: "PL:", desc: "Parts Line by HubSpot ID" },
              { prefix: "PO:", desc: "Parts Order by HubSpot ID" },
              { prefix: "SOL:", desc: "Sales Order Line (furniture)" },
              { prefix: "PRO:", desc: "Parts Line by SPOT PRO#" },
              { prefix: "ALI:", desc: "Parts Line by ALI number" },
            ].map(({ prefix, desc }) => (
              <div key={prefix} className="flex items-center gap-2">
                <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded w-12 text-center flex-shrink-0">
                  {prefix}
                </span>
                <span className="text-xs text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PartDetailSheet
        result={result}
        open={sheetOpen}
        onClose={handleSheetClose}
        onReceived={() => {}}
      />
    </div>
  );
}
