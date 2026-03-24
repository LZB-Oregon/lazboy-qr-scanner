import { useState, useRef } from "react";
import { Camera, Truck, Printer, ArrowLeft, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

// Store location codes
const STORE_CODES = [
  { code: "00", name: "Warehouse" },
  { code: "01", name: "Delta Park" },
  { code: "02", name: "Tualatin" },
  { code: "03", name: "Happy Valley" },
  { code: "04", name: "Tanasbourne" },
  { code: "05", name: "Salem" },
  { code: "07", name: "Eugene" },
  { code: "08", name: "Delta Park 2" },
  { code: "09", name: "Phoenix" },
];

// Predefined location codes
const LOC_CODES = [
  "RECEIVING",
  "BENCH",
  "STORAGE_A",
  "STORAGE_B",
  "STORAGE_C",
  "TRANSIT",
  "READY_FOR_RETURN",
];

type Step = "photo" | "location" | "transfer" | "print" | "complete";

export default function CheckInPage() {
  const [step, setStep] = useState<Step>("photo");
  const [photo, setPhoto] = useState<string | null>(null);
  const [storeCd, setStoreCd] = useState("00");
  const [locCd, setLocCd] = useState("RECEIVING");
  const [createIST, setCreateIST] = useState(false);
  const [destStoreCd, setDestStoreCd] = useState("00");
  const [uniqueId, setUniqueId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate unique ID in MMDDYSEQ## format
  const generateUniqueId = () => {
    const timestamp = new Date();
    const month = String(timestamp.getMonth() + 1).padStart(2, "0");
    const day = String(timestamp.getDate()).padStart(2, "0");
    const year = String(timestamp.getFullYear()).slice(-1);
    const seq = String(Math.floor(Math.random() * 99) + 1).padStart(2, "0");
    return `${month}${day}${year}${seq}##`;
  };

  const handlePhotoCapture = () => {
    if (fileInputRef.current?.files?.[0]) {
      const file = fileInputRef.current.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhoto(e.target?.result as string);
        setError(null);
        setStep("location");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRetakePhoto = () => {
    setPhoto(null);
    fileInputRef.current?.click();
  };

  const handleLocationSubmit = () => {
    if (!storeCd || !locCd) {
      setError("Please select both store and location");
      return;
    }
    setError(null);
    setStep("transfer");
  };

  const handleTransferSubmit = (wantIST: boolean) => {
    setCreateIST(wantIST);
    setStep("print");
  };

  const handlePrintSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Generate unique ID
      const id = generateUniqueId();
      setUniqueId(id);

      // TODO: In production, this would:
      // 1. Upload photo to S3
      // 2. Create/update Sales Order Line in HubSpot
      // 3. Create IST Ticket if requested
      // 4. Send to Zebra printer
      
      console.log("Check-in data:", {
        uniqueId: id,
        storeCd,
        locCd,
        createIST,
        destStoreCd: createIST ? destStoreCd : undefined,
        photoUrl: photo ? "[photo captured]" : null,
      });

      setStep("complete");
    } catch (err) {
      setError("Failed to process check-in. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep("photo");
    setPhoto(null);
    setStoreCd("00");
    setLocCd("RECEIVING");
    setCreateIST(false);
    setDestStoreCd("00");
    setUniqueId(null);
    setError(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-5 py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <button className="p-2 hover:bg-accent rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold text-foreground">Check In</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-5 py-6 gap-6">
        {/* Error Alert */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-start gap-3">
            <X className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Step: Photo */}
        {step === "photo" && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Take a Photo
              </h2>
              <p className="text-sm text-muted-foreground">
                Capture the furniture being checked in
              </p>
            </div>

            {photo && (
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-muted border-2 border-primary">
                <img
                  src={photo}
                  alt="Furniture"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />

            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-12 gap-2"
              size="lg"
            >
              <Camera className="w-5 h-5" />
              {photo ? "Retake Photo" : "Take Photo"}
            </Button>

            {photo && (
              <Button
                onClick={() => setStep("location")}
                className="w-full h-12"
                size="lg"
              >
                Continue
              </Button>
            )}
          </div>
        )}

        {/* Step: Location */}
        {step === "location" && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Location Info
              </h2>
              <p className="text-sm text-muted-foreground">
                Where is this furniture?
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Store
                </label>
                <select
                  value={storeCd}
                  onChange={(e) => setStoreCd(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {STORE_CODES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Location
                </label>
                <select
                  value={locCd}
                  onChange={(e) => setLocCd(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {LOC_CODES.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setStep("photo")}
                variant="outline"
                className="flex-1 h-12"
              >
                Back
              </Button>
              <Button
                onClick={handleLocationSubmit}
                className="flex-1 h-12"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step: Transfer */}
        {step === "transfer" && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Store Transfer
              </h2>
              <p className="text-sm text-muted-foreground">
                Do you want to initiate a transfer?
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => handleTransferSubmit(true)}
                className="w-full h-12 gap-2"
                size="lg"
              >
                <Truck className="w-5 h-5" />
                Yes, Create Transfer
              </Button>

              <Button
                onClick={() => handleTransferSubmit(false)}
                variant="outline"
                className="w-full h-12"
                size="lg"
              >
                No, Just Check In
              </Button>
            </div>

            {createIST && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Destination Store
                </label>
                <select
                  value={destStoreCd}
                  onChange={(e) => setDestStoreCd(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {STORE_CODES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button
              onClick={() => setStep("location")}
              variant="outline"
              className="w-full h-12"
            >
              Back
            </Button>
          </div>
        )}

        {/* Step: Print */}
        {step === "print" && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Print Tag
              </h2>
              <p className="text-sm text-muted-foreground">
                Ready to print the furniture tag?
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Store:</span>
                <span className="text-sm font-medium text-foreground">
                  {STORE_CODES.find((s) => s.code === storeCd)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Location:</span>
                <span className="text-sm font-medium text-foreground">
                  {locCd}
                </span>
              </div>
              {createIST && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Destination:
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {STORE_CODES.find((s) => s.code === destStoreCd)?.name}
                  </span>
                </div>
              )}
            </div>

            <Button
              onClick={handlePrintSubmit}
              disabled={loading}
              className="w-full h-12 gap-2"
              size="lg"
            >
              <Printer className="w-5 h-5" />
              {loading ? "Processing..." : "Print Tag"}
            </Button>

            <Button
              onClick={() => setStep("transfer")}
              variant="outline"
              className="w-full h-12"
              disabled={loading}
            >
              Back
            </Button>
          </div>
        )}

        {/* Step: Complete */}
        {step === "complete" && (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-500" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Check In Complete!
              </h2>
              <p className="text-sm text-muted-foreground">
                Furniture has been checked in successfully
              </p>
            </div>

            {uniqueId && (
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">
                  Unique ID
                </p>
                <p className="text-2xl font-bold text-primary font-mono">
                  {uniqueId}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Button
                onClick={handleReset}
                className="w-full h-12"
                size="lg"
              >
                Check In Another
              </Button>

              <Link href="/">
                <Button
                  variant="outline"
                  className="w-full h-12"
                >
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
