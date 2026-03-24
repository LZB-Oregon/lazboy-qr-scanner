import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Camera, Plus, Search } from "lucide-react";

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

export default function CheckInPage() {
  const [step, setStep] = useState<"search" | "capture" | "details" | "confirm">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFurniture, setSelectedFurniture] = useState<any>(null);
  const [furniturePhotoUrl, setFurniturePhotoUrl] = useState<string | null>(null);
  const [ackPhotoUrl, setAckPhotoUrl] = useState<string | null>(null);
  const [storeCd, setStoreCd] = useState("00");
  const [locCd, setLocCd] = useState("RECEIVING");
  const [destStoreCd, setDestStoreCd] = useState("00");
  const [createIst, setCreateIst] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const furniturePhotoRef = useRef<HTMLInputElement>(null);
  const ackPhotoRef = useRef<HTMLInputElement>(null);

  const searchFurniture = trpc.scanner.searchFurniture.useQuery(
    { customerName: searchQuery, serviceOrderNumber: searchQuery },
    { enabled: searchQuery.length > 2 }
  );

  const checkInMutation = trpc.scanner.checkIn.useMutation();
  const createFurnitureMutation = trpc.scanner.createFurniture.useMutation();

  const handleSearch = (furniture: any) => {
    setSelectedFurniture(furniture);
    setStep("capture");
    setError(null);
  };

  const handlePhotoCapture = async (file: File, type: "furniture" | "ack") => {
    try {
      // Upload to S3 using the storage helper
      const formData = new FormData();
      formData.append("file", file);
      
      // For now, we'll store the file locally and upload it
      // In production, this should use the storagePut helper
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (type === "furniture") {
          setFurniturePhotoUrl(dataUrl);
        } else {
          setAckPhotoUrl(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(`Failed to capture ${type} photo`);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedFurniture) {
      setError("No furniture selected");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await checkInMutation.mutateAsync({
        furnitureId: selectedFurniture.id,
        storeCd,
        locCd,
        furniturePhotoUrl: furniturePhotoUrl || undefined,
        ackPhotoUrl: ackPhotoUrl || undefined,
        destStoreCd: createIst ? destStoreCd : undefined,
      });

      setSelectedFurniture(result);
      setStep("confirm");
    } catch (err) {
      setError("Failed to check in furniture");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFurniture = async (name: string, customerName: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await createFurnitureMutation.mutateAsync({
        name,
        customerName,
        storeCd,
        locCd,
      });

      setSelectedFurniture(result);
      setStep("capture");
    } catch (err) {
      setError("Failed to create furniture record");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Furniture Check-In</h1>
          <p className="text-muted-foreground">GERS IST Workflow - V1</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Search or Create */}
        {step === "search" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Find Furniture</CardTitle>
                <CardDescription>Search by customer name or order number</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Customer name or order #..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {searchFurniture.isLoading && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}

                {searchFurniture.data && searchFurniture.data.length > 0 && (
                  <div className="space-y-2">
                    {searchFurniture.data.map((item: any) => (
                      <button
                        key={item.id}
                        onClick={() => handleSearch(item)}
                        className="w-full p-3 text-left border rounded-lg hover:bg-accent transition"
                      >
                        <div className="font-semibold">{item.customerName}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.serviceOrderNumber && `Order: ${item.serviceOrderNumber}`}
                          {item.name && ` • ${item.name}`}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchQuery.length > 2 && searchFurniture.data?.length === 0 && !searchFurniture.isLoading && (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">No furniture found</p>
                    <Button
                      variant="outline"
                      onClick={() => setStep("details")}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Record
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Capture Photos */}
        {step === "capture" && selectedFurniture && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Capture Photos</CardTitle>
                <CardDescription>
                  {selectedFurniture.customerName} • {selectedFurniture.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Furniture Photo */}
                <div>
                  <label className="block text-sm font-medium mb-2">Furniture Photo</label>
                  <div className="border-2 border-dashed rounded-lg p-4">
                    {furniturePhotoUrl ? (
                      <div className="space-y-2">
                        <img
                          src={furniturePhotoUrl}
                          alt="Furniture"
                          className="w-full h-48 object-cover rounded"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => furniturePhotoRef.current?.click()}
                          className="w-full"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Retake Photo
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => furniturePhotoRef.current?.click()}
                        className="w-full py-8 flex flex-col items-center justify-center hover:bg-accent rounded transition"
                      >
                        <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Tap to capture photo</span>
                      </button>
                    )}
                    <input
                      ref={furniturePhotoRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => e.target.files?.[0] && handlePhotoCapture(e.target.files[0], "furniture")}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* ACK Photo */}
                <div>
                  <label className="block text-sm font-medium mb-2">ACK Tag Photo</label>
                  <div className="border-2 border-dashed rounded-lg p-4">
                    {ackPhotoUrl ? (
                      <div className="space-y-2">
                        <img
                          src={ackPhotoUrl}
                          alt="ACK Tag"
                          className="w-full h-48 object-cover rounded"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => ackPhotoRef.current?.click()}
                          className="w-full"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Retake Photo
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => ackPhotoRef.current?.click()}
                        className="w-full py-8 flex flex-col items-center justify-center hover:bg-accent rounded transition"
                      >
                        <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Tap to capture ACK tag</span>
                      </button>
                    )}
                    <input
                      ref={ackPhotoRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => e.target.files?.[0] && handlePhotoCapture(e.target.files[0], "ack")}
                      className="hidden"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => setStep("details")}
                  className="w-full"
                  disabled={!furniturePhotoUrl || !ackPhotoUrl}
                >
                  Continue
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Location Details */}
        {step === "details" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Location Details</CardTitle>
                <CardDescription>Select store and location for check-in</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Store Code */}
                <div>
                  <label className="block text-sm font-medium mb-2">Store Location</label>
                  <Select value={storeCd} onValueChange={setStoreCd}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STORE_CODES.map((store) => (
                        <SelectItem key={store.code} value={store.code}>
                          {store.code} - {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Code */}
                <div>
                  <label className="block text-sm font-medium mb-2">Location Within Store</label>
                  <Select value={locCd} onValueChange={setLocCd}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOC_CODES.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* IST Checkbox */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="createIst"
                    checked={createIst}
                    onChange={(e) => setCreateIst(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="createIst" className="text-sm font-medium cursor-pointer">
                    Create IST Ticket for Transfer
                  </label>
                </div>

                {/* Destination Store (if IST) */}
                {createIst && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Destination Store</label>
                    <Select value={destStoreCd} onValueChange={setDestStoreCd}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STORE_CODES.map((store) => (
                          <SelectItem key={store.code} value={store.code}>
                            {store.code} - {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  onClick={handleCheckIn}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checking In...
                    </>
                  ) : (
                    "Complete Check-In"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === "confirm" && selectedFurniture && (
          <div className="space-y-4">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-900">Check-In Complete!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white p-4 rounded border">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Service Piece ID</span>
                      <div className="font-mono font-bold text-lg">
                        {selectedFurniture.servicePieceId}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Store</span>
                      <div className="font-semibold">{storeCd}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Location</span>
                      <div className="font-semibold">{locCd}</div>
                    </div>
                    {createIst && (
                      <div>
                        <span className="text-muted-foreground">IST Destination</span>
                        <div className="font-semibold">{destStoreCd}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Button onClick={() => window.print()} variant="outline" className="w-full">
                    Print Label
                  </Button>
                  <Button
                    onClick={() => {
                      setStep("search");
                      setSelectedFurniture(null);
                      setSearchQuery("");
                      setFurniturePhotoUrl(null);
                      setAckPhotoUrl(null);
                      setStoreCd("00");
                      setLocCd("RECEIVING");
                      setCreateIst(false);
                    }}
                    className="w-full"
                  >
                    New Check-In
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
