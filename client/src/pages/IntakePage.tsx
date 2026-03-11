import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Camera, Upload, CheckCircle, AlertCircle } from "lucide-react";

export default function IntakePage() {
  const [ackNumber, setAckNumber] = useState("");
  const [custCode, setCustCode] = useState("");
  const [storeCd, setStoreCd] = useState("");
  const [damageNotes, setDamageNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { data: stores = [], isLoading: storesLoading } = trpc.intake.getStores.useQuery();
  const submitIntakeMutation = trpc.intake.submitForm.useMutation();

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);

    // Create a local preview URL
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    toast.success("Photo captured");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ackNumber.trim() || !custCode.trim() || !storeCd.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitIntakeMutation.mutateAsync({
        acknowledgementNumber: ackNumber,
        customerCode: custCode,
        storeCd,
        damageNotes: damageNotes || undefined,
        photoUrl: photoUrl || undefined,
      });

      if (result.success) {
        toast.success(`Intake ticket created: ${result.ticketId}`);
        setSubmitSuccess(true);
        setAckNumber("");
        setCustCode("");
        setStoreCd("");
        setDamageNotes("");
        setPhotoUrl(null);
        setPhotoFile(null);

        // Reset success state after 3 seconds
        setTimeout(() => setSubmitSuccess(false), 3000);
      }
    } catch (error) {
      toast.error(`Failed to submit intake: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-background to-background/80 border-b border-border p-4">
        <h1 className="text-2xl font-bold text-foreground">Furniture Intake</h1>
        <p className="text-sm text-muted-foreground mt-1">Create a new service intake ticket</p>
      </div>

      {/* Success State */}
      {submitSuccess && (
        <div className="m-4 p-4 bg-green-900/20 border border-green-700 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-400">Intake ticket created successfully</p>
            <p className="text-sm text-green-300 mt-1">The CSR will manually associate the correct SOL in HubSpot</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        {/* Photo Capture */}
        <Card className="p-4 bg-card border-border">
          <label className="block text-sm font-semibold text-foreground mb-3">Photo of Furniture</label>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoCapture}
            className="hidden"
          />
          {photoUrl ? (
            <div className="space-y-3">
              <img
                src={photoUrl}
                alt="Captured furniture"
                className="w-full h-48 object-cover rounded-lg border border-border"
              />
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full"
              >
                <Camera className="w-4 h-4 mr-2" />
                Retake Photo
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => cameraInputRef.current?.click()}
              className="w-full h-32 flex flex-col items-center justify-center gap-2"
            >
              <Camera className="w-6 h-6" />
              <span>Take Photo</span>
            </Button>
          )}
        </Card>

        {/* Acknowledgement Number */}
        <Card className="p-4 bg-card border-border">
          <label className="block text-sm font-semibold text-foreground mb-2">
            Acknowledgement Number <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            placeholder="e.g., ACK-12345"
            value={ackNumber}
            onChange={(e) => setAckNumber(e.target.value)}
            className="text-base h-12"
            disabled={isSubmitting}
          />
        </Card>

        {/* Customer Code */}
        <Card className="p-4 bg-card border-border">
          <label className="block text-sm font-semibold text-foreground mb-2">
            Customer Code <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            placeholder="e.g., CUST001"
            value={custCode}
            onChange={(e) => setCustCode(e.target.value)}
            className="text-base h-12"
            disabled={isSubmitting}
          />
        </Card>

        {/* Store Code */}
        <Card className="p-4 bg-card border-border">
          <label className="block text-sm font-semibold text-foreground mb-2">
            Store Location <span className="text-red-500">*</span>
          </label>
          <Select value={storeCd} onValueChange={setStoreCd} disabled={isSubmitting || storesLoading}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder={storesLoading ? "Loading stores..." : "Select a store"} />
            </SelectTrigger>
            <SelectContent>
              {stores.map((store: { id: string; storeCd: string; storeName: string }) => (
                <SelectItem key={store.id} value={store.storeCd}>
                  {store.storeName} ({store.storeCd})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        {/* Damage Notes */}
        <Card className="p-4 bg-card border-border">
          <label className="block text-sm font-semibold text-foreground mb-2">Damage Notes (Optional)</label>
          <Textarea
            placeholder="Describe any visible damage or issues..."
            value={damageNotes}
            onChange={(e) => setDamageNotes(e.target.value)}
            className="text-base min-h-24"
            disabled={isSubmitting}
          />
        </Card>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting || !ackNumber.trim() || !custCode.trim() || !storeCd.trim()}
          className="w-full h-14 text-base font-semibold bg-amber-600 hover:bg-amber-700 text-white"
        >
          {isSubmitting ? "Creating Ticket..." : "Submit Intake"}
        </Button>

        {/* Info Box */}
        <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-semibold mb-1">Next Steps:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>CSR manually associates the correct SOL in HubSpot</li>
              <li>HubSpot auto-generates the service tag ID</li>
              <li>Sales person prints the service tag sticker from the app</li>
            </ol>
          </div>
        </div>
      </form>
    </div>
  );
}
