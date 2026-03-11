import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock HubSpot module ──────────────────────────────────────────────────────

vi.mock("./hubspot", () => ({
  lookupByCode: vi.fn(),
  getPartsLineById: vi.fn(),
  getPartsOrderById: vi.fn(),
  getSalesOrderLineById: vi.fn(),
  getFurnitureById: vi.fn(),
  searchPartsLines: vi.fn(),
  searchPartsOrders: vi.fn(),
  updatePartsLine: vi.fn(),
  updateSalesOrderLine: vi.fn(),
  updateFurniture: vi.fn(),
  getPartsToReceive: vi.fn(),
}));

vi.mock("./db", () => ({
  insertScanHistory: vi.fn().mockResolvedValue(undefined),
  getScanHistory: vi.fn().mockResolvedValue([]),
  getScanHistoryByUser: vi.fn().mockResolvedValue([]),
}));

import {
  lookupByCode,
  updatePartsLine,
  updateSalesOrderLine,
  updateFurniture,
  getPartsToReceive,
} from "./hubspot";
import { getScanHistory } from "./db";

// ─── Test context ─────────────────────────────────────────────────────────────

function makeCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const mockPartsLine = {
  id: "123",
  objectType: "parts_line" as const,
  lineStatus: "Ordered",
  vendorCode: "SPOT",
  receivedDate: null,
  spotProNumber: "PRO-001",
  partCategory: "Mechanism",
  shipmentExceptionReason: null,
  leadTimeDays: "5",
  chargeCode: "Warranty",
  partSource: "LZB Warranty",
  partDeliveryMethod: "Standard",
  binLocation: null,
  aliNumber: "ALI-001",
  styleNumber: "010.0563",
  partsOrderId: "456",
  poNumber: "PO-2024-001",
};

const mockPartsOrder = {
  id: "456",
  objectType: "parts_order" as const,
  poNumber: "PO-2024-001",
  status: "Ordered",
  expectedArrival: "2026-03-15",
  partsLocked: false,
  orderNotes: null,
  partsLines: [mockPartsLine],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("scanner.lookup", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns parts_line result for a PL: prefixed code", async () => {
    vi.mocked(lookupByCode).mockResolvedValue({ type: "parts_line", record: mockPartsLine });
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.scanner.lookup({ code: "PL:123" });
    expect(result.type).toBe("parts_line");
    if (result.type === "parts_line") {
      expect(result.record.id).toBe("123");
      expect(result.record.spotProNumber).toBe("PRO-001");
    }
  });

  it("returns parts_order result for a PO: prefixed code", async () => {
    vi.mocked(lookupByCode).mockResolvedValue({ type: "parts_order", record: mockPartsOrder });
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.scanner.lookup({ code: "PO:456" });
    expect(result.type).toBe("parts_order");
    if (result.type === "parts_order") {
      expect(result.record.poNumber).toBe("PO-2024-001");
    }
  });

  it("returns not_found for unknown code", async () => {
    vi.mocked(lookupByCode).mockResolvedValue({ type: "not_found", code: "UNKNOWN-999" });
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.scanner.lookup({ code: "UNKNOWN-999" });
    expect(result.type).toBe("not_found");
  });

  it("rejects empty code", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.scanner.lookup({ code: "" })).rejects.toThrow();
  });
});

describe("scanner.receivePart", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls updatePartsLine with Received status and bin location", async () => {
    const receivedLine = { ...mockPartsLine, lineStatus: "Received", binLocation: "R3-S5", receivedDate: "2026-03-09" };
    vi.mocked(updatePartsLine).mockResolvedValue(receivedLine);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.scanner.receivePart({ partsLineId: "123", binLocation: "R3-S5" });
    expect(updatePartsLine).toHaveBeenCalledWith("123", {
      line_status: "Received",
      received_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      bin_location: "R3-S5",
    });
    expect(result.lineStatus).toBe("Received");
    expect(result.binLocation).toBe("R3-S5");
  });

  it("rejects empty bin location", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.scanner.receivePart({ partsLineId: "123", binLocation: "" })).rejects.toThrow();
  });
});

describe("scanner.checkinFurniture", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls updateFurniture with Received status", async () => {
    const mockSOL = {
      id: "789",
      objectType: "sales_order_line" as const,
      name: "La-Z-Boy Recliner",
      quantity: "1",
      price: "999.00",
      sku: "LZB-001",
      description: "Power recliner",
      chargeCode: "Customer",
      partSource: null,
      vendorCode: null,
      partDeliveryMethod: "Standard",
      lineStatus: "Received",
      binLocation: "FLOOR-A",
    };
    vi.mocked(updateFurniture).mockResolvedValue(mockSOL);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.scanner.checkinFurniture({ salesOrderLineId: "789", binLocation: "FLOOR-A" });
    expect(updateFurniture).toHaveBeenCalledWith("789", expect.objectContaining({
      line_status: "Received",
      bin_location: "FLOOR-A",
    }));
    expect(result.lineStatus).toBe("Received");
  });
});

describe("scanner.partsToReceive", () => {
  it("returns list of parts with Ordered status", async () => {
    vi.mocked(getPartsToReceive).mockResolvedValue([mockPartsLine]);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.scanner.partsToReceive({ limit: 50 });
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].lineStatus).toBe("Ordered");
  });
});

describe("scanner.scanHistory", () => {
  it("returns scan history list", async () => {
    vi.mocked(getScanHistory).mockResolvedValue([]);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.scanner.scanHistory({ limit: 50 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("HubSpot token validation", () => {
  it("HUBSPOT_ACCESS_TOKEN environment variable is set", () => {
    const token = process.env.HUBSPOT_ACCESS_TOKEN;
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token!.length).toBeGreaterThan(10);
  });
});
