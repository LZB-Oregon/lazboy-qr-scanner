import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, CameraOff, Flashlight, ZapOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onError?: (error: string) => void;
  active?: boolean;
  className?: string;
}

const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
];

export function BarcodeScanner({ onScan, onError, active = true, className }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const cooldownRef = useRef(false);

  const startScanner = useCallback(async () => {
    if (!containerRef.current || scannerRef.current?.isScanning) return;

    const id = "qr-scanner-container";
    try {
      scannerRef.current = new Html5Qrcode(id, {
        formatsToSupport: SUPPORTED_FORMATS,
        verbose: false,
      });

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        (decodedText) => {
          if (cooldownRef.current) return;
          cooldownRef.current = true;
          setLastScanned(decodedText);
          onScan(decodedText);
          // 2-second cooldown to prevent duplicate scans
          setTimeout(() => { cooldownRef.current = false; }, 2000);
        },
        () => {} // ignore per-frame errors
      );
      setIsRunning(true);
      setHasError(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Camera access denied";
      setHasError(true);
      onError?.(msg);
    }
  }, [onScan, onError]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop().catch(() => {});
    }
    setIsRunning(false);
  }, []);

  useEffect(() => {
    if (active) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => { stopScanner(); };
  }, [active, startScanner, stopScanner]);

  const toggleFlash = async () => {
    if (!scannerRef.current?.isScanning) return;
    try {
      const track = (scannerRef.current as unknown as { videoElement?: HTMLVideoElement })
        .videoElement?.srcObject as MediaStream | null;
      const videoTrack = track?.getVideoTracks()[0];
      if (videoTrack && "applyConstraints" in videoTrack) {
        await videoTrack.applyConstraints({ advanced: [{ torch: !flashOn } as MediaTrackConstraintSet] });
        setFlashOn(!flashOn);
      }
    } catch {
      // Flash not supported on this device
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* Scanner viewport */}
      <div className="relative w-full aspect-square max-w-[360px] mx-auto rounded-2xl overflow-hidden bg-black">
        {/* html5-qrcode target element */}
        <div id="qr-scanner-container" className="w-full h-full" ref={containerRef} />

        {/* Overlay: corner brackets */}
        {isRunning && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner brackets */}
            <div className="absolute inset-[15%]">
              {/* TL */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-sm" />
              {/* TR */}
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-sm" />
              {/* BL */}
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-sm" />
              {/* BR */}
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-sm" />
              {/* Scan line */}
              <div className="absolute left-0 right-0 h-0.5 bg-primary/70 scan-line shadow-[0_0_8px_2px_oklch(0.78_0.16_65/0.5)]" />
            </div>

            {/* Dimmed overlay outside scan box */}
            <div className="absolute inset-0 bg-black/40" style={{
              maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 60%, black 80%)",
              WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 60%, black 80%)",
            }} />
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card gap-3 p-6 text-center">
            <CameraOff className="w-12 h-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Camera access required</p>
            <Button size="sm" onClick={startScanner} className="mt-2">
              <Camera className="w-4 h-4 mr-2" /> Try Again
            </Button>
          </div>
        )}

        {/* Controls overlay */}
        {isRunning && (
          <div className="absolute bottom-3 right-3">
            <button
              onClick={toggleFlash}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white border border-white/20"
            >
              {flashOn ? <ZapOff className="w-4 h-4" /> : <Flashlight className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Last scanned indicator */}
      {lastScanned && (
        <div className="mt-3 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-center">
          <p className="text-xs text-muted-foreground">Last scanned</p>
          <p className="text-sm font-mono text-primary truncate">{lastScanned}</p>
        </div>
      )}
    </div>
  );
}
