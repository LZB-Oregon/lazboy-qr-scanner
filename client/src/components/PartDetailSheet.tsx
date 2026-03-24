import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package, CheckCircle2, Clock, MapPin, Tag, Truck, User, Layers,
  AlertCircle, Hash, Barcode, Building2, ArrowRight, Sofa
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { STORE_LOCATIONS } from "@shared/const";
import type { PartsLineRecord, PartsOrderRecord, SalesOrderLineRecord } from "../../../server/hubspot";

type LookupResult =
  | { type: "parts_line"; record: PartsLineRecord }
  | { type: "parts_order"; record: PartsOrderRecord }
  | { type: "sales_order_line"; record: SalesOrderLineRecord }
  | { type: "not_found"; code: string };

interface PartDetailSheetProps {
  result: LookupResult | null;
  open: boolean;
  onClose: () => void;
  onReceived?: () => void;
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <Badge variant="outline" className="text-muted-foreground">—</Badge>;
  const s = status.toLowerCase();
  if (s === "received") return <Badge className="badge-received font-medium">{status}</Badge>;
  if (s === "ordered") return <Badge className="badge-ordered font-medium">{status}</Badge>;
  return <Badge variant="outline" className="badge-to-order">{status}</Badge>;
}

function DetailRow({ icon: Icon, label, value, mono = false }: {
  icon: React.ElementType; label: string; value: string | null | undefined; mono?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className={cn("text-sm font-medium text-foreground break-all", mono && "font-mono")}>{value}</p>
      </div>
    </div>
  );
}

// ─── Parts Line Detail ────────────────────────────────────────────────────────

function PartsLineDetail({ record, onReceived }: { record: PartsLineRecord; onReceived?: () => void }) {
  const [binLocation, setBinLocation] = useState(record.binLocation ?? "");
  const [receiving, setReceiving] = useState(false);

  const receiveMutation = trpc.scanner.receivePart.useMutation({
    onSuccess: () => {
      toast.success("Part received!", {
        description: `Bin: ${binLocation} — Status updated in HubSpot`,
        duration: 4000,
      });
      setReceiving(false);
      onReceived?.();
    },
    onError: (err) => {
      toast.error("Failed to receive part", { description: err.message });
      setReceiving(false);
    },
  });

  const handleReceive = () => {
    if (!binLocation.trim()) {
      toast.error("Bin location required");
      return;
    }
    setReceiving(true);
    receiveMutation.mutate({ partsLineId: record.id, binLocation: binLocation.trim() });
  };

  const isReceived = record.lineStatus?.toLowerCase() === "received";

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Package className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Parts Line</p>
          <p className="font-semibold text-foreground">#{record.id}</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={record.lineStatus} />
        </div>
      </div>

      <DetailRow icon={Tag} label="PRO#" value={record.spotProNumber} mono />
      <DetailRow icon={Barcode} label="ALI#" value={record.aliNumber} mono />
      <DetailRow icon={Package} label="Category" value={record.partCategory} />
      <DetailRow icon={Hash} label="Charge Code" value={record.chargeCode} />
      <DetailRow icon={User} label="Vendor Code" value={record.vendorCode} />
      <DetailRow icon={Truck} label="Delivery Method" value={record.partDeliveryMethod} />
      <DetailRow icon={Package} label="Part Source" value={record.partSource} />
      <DetailRow icon={MapPin} label="Bin Location" value={record.binLocation} />

      {!isReceived && (
        <>
          <Separator className="my-4" />
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">Receive Part</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Bin location (required)"
                value={binLocation}
                onChange={(e) => setBinLocation(e.target.value)}
                className="pl-9 bg-input border-border text-foreground h-12 text-base"
              />
            </div>
            <Button
              onClick={handleReceive}
              disabled={receiving || !binLocation.trim()}
              className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {receiving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Receiving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Receive Part
                </span>
              )}
            </Button>
          </div>
        </>
      )}

      {isReceived && (
        <div className="mt-4 p-4 rounded-xl bg-success/10 border border-success/20 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-success">Already Received</p>
            <p className="text-xs text-muted-foreground">Part received in warehouse</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Parts Order Detail ────────────────────────────────────────────────────────

function PartsOrderDetail({ record }: { record: PartsOrderRecord }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
          <Layers className="w-5 h-5 text-warning" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Parts Order</p>
          <p className="font-semibold text-foreground">PO: {record.poNumber ?? "—"}</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={record.status} />
        </div>
      </div>

      <DetailRow icon={Barcode} label="PO Number" value={record.poNumber} mono />
      <DetailRow icon={Clock} label="Expected Arrival" value={record.expectedArrival} />
      <DetailRow icon={Package} label="Notes" value={record.orderNotes} />

      {record.partsLocked && (
        <div className="mt-4 p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-warning flex-shrink-0" />
          <p className="text-sm font-medium text-warning">Parts Locked</p>
        </div>
      )}

      {record.partsLines && record.partsLines.length > 0 && (
        <>
          <Separator className="my-4" />
          <p className="text-sm font-semibold text-foreground mb-3">
            Parts Lines ({record.partsLines.length})
          </p>
          <div className="space-y-2">
            {record.partsLines.map((line) => (
              <div key={line.id} className="p-3 rounded-xl bg-accent border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-mono">#{line.id}</p>
                    {line.spotProNumber && (
                      <p className="text-sm font-medium text-foreground">PRO: {line.spotProNumber}</p>
                    )}
                    {line.partCategory && (
                      <p className="text-xs text-muted-foreground">{line.partCategory}</p>
                    )}
                  </div>
                  <StatusBadge status={line.lineStatus} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sales Order Line (Furniture) Detail ─────────────────────────────────────

function SalesOrderLineDetail({ record, onCheckedIn }: { record: SalesOrderLineRecord; onCheckedIn?: () => void }) {
  const [storeCd, setStoreCd] = useState(record.storeCd ?? "");
  const [locCd, setLocCd] = useState(record.locCd ?? "");
  const [checking, setChecking] = useState(false);

  const checkinMutation = trpc.scanner.checkinFurniture.useMutation({
    onSuccess: () => {
      toast.success("Furniture checked in!", {
        description: record.name ?? "Item status updated in HubSpot",
        duration: 4000,
      });
      setChecking(false);
      onCheckedIn?.();
    },
    onError: (err) => {
      toast.error("Check-in failed", { description: err.message });
      setChecking(false);
    },
  });

  const handleCheckin = () => {
    if (!storeCd.trim()) {
      toast.error("Store location required");
      return;
    }
    setChecking(true);
    checkinMutation.mutate({
      salesOrderLineId: record.id,
      storeCd: storeCd.trim(),
      locCd: locCd.trim() || undefined,
    });
  };

  const isReceived = record.lineStatus?.toLowerCase() === "received";

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Sofa className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Sales Order Line</p>
          <p className="font-semibold text-foreground truncate">{record.name ?? `#${record.id}`}</p>
        </div>
        <div className="ml-auto flex-shrink-0">
          <StatusBadge status={record.lineStatus} />
        </div>
      </div>

      <DetailRow icon={Tag} label="SKU" value={record.sku} mono />
      <DetailRow icon={Package} label="Description" value={record.description} />
      <DetailRow icon={Hash} label="Quantity" value={record.quantity} />
      <DetailRow icon={Tag} label="Price" value={record.price ? `$${record.price}` : null} />
      <DetailRow icon={User} label="Charge Code" value={record.chargeCode} />
      <DetailRow icon={Building2} label="Vendor Code" value={record.vendorCode} />
      <DetailRow icon={Truck} label="Delivery Method" value={record.partDeliveryMethod} />
      <DetailRow icon={Package} label="Part Source" value={record.partSource} />
      <DetailRow icon={MapPin} label="Store Location" value={record.storeCd} />
      <DetailRow icon={MapPin} label="Location Code" value={record.locCd} />

      {!isReceived && (
        <>
          <Separator className="my-4" />
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">Check In Furniture</Label>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Store Location *</Label>
              <Select value={storeCd} onValueChange={setStoreCd}>
                <SelectTrigger className="h-12 bg-input border-border text-foreground text-base">
                  <SelectValue placeholder="Select store..." />
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

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Location code (optional)"
                value={locCd}
                onChange={(e) => setLocCd(e.target.value)}
                className="pl-9 bg-input border-border text-foreground h-12 text-base"
              />
            </div>

            <Button
              onClick={handleCheckin}
              disabled={checking || !storeCd.trim()}
              className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {checking ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Checking In...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Check In Item
                </span>
              )}
            </Button>
          </div>
        </>
      )}

      {isReceived && (
        <div className="mt-4 p-4 rounded-xl bg-success/10 border border-success/20 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-success">Already Checked In</p>
            <p className="text-xs text-muted-foreground">Item received in warehouse</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Sheet ───────────────────────────────────────────────────────────────

export function PartDetailSheet({ result, open, onClose, onReceived }: PartDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="bg-card border-t border-border rounded-t-2xl max-h-[90vh] overflow-y-auto px-5 pb-8"
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="text-left text-foreground">
            {result?.type === "parts_line" && "Parts Line Details"}
            {result?.type === "parts_order" && "Parts Order Details"}
            {result?.type === "sales_order_line" && "Furniture Details"}
            {result?.type === "not_found" && "Not Found"}
          </SheetTitle>
        </SheetHeader>

        {result?.type === "parts_line" && (
          <PartsLineDetail record={result.record} onReceived={onReceived} />
        )}
        {result?.type === "parts_order" && (
          <PartsOrderDetail record={result.record} />
        )}
        {result?.type === "sales_order_line" && (
          <SalesOrderLineDetail record={result.record} onCheckedIn={onReceived} />
        )}
        {result?.type === "not_found" && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <div>
              <p className="font-semibold text-foreground">Not Found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Could not find record for: {result.code}
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
