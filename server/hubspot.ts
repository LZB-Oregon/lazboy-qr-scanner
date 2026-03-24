/**
 * HubSpot API helper for La-Z-Boy Oregon (Account #44270378)
 *
 * Custom Objects:
 *   Parts Order  → 2-57143005
 *   Parts Line   → 2-57157764
 *   Sales Order Line (Furniture) → 2-48907108
 *   Sales Order Line (native) → 0-8
 */

import axios from "axios";

const HS_BASE = "https://api.hubapi.com";
const PARTS_ORDER_OBJECT = "2-57143005";
const PARTS_LINE_OBJECT = "2-57157764";
const SALES_ORDER_LINE_OBJECT = "0-8"; // native Line Items
const FURNITURE_OBJECT = "2-48907108"; // Custom Sales Order Line (Furniture to be serviced)

function getToken(): string {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) throw new Error("HUBSPOT_ACCESS_TOKEN is not set");
  return token;
}

function headers() {
  return {
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PartsLineRecord {
  id: string;
  objectType: "parts_line";
  lineStatus: string | null;
  vendorCode: string | null;
  receivedDate: string | null;
  spotProNumber: string | null;
  partCategory: string | null;
  shipmentExceptionReason: string | null;
  leadTimeDays: string | null;
  chargeCode: string | null;
  partSource: string | null;
  partDeliveryMethod: string | null;
  binLocation: string | null;
  aliNumber: string | null;
  styleNumber: string | null;
  // associations
  partsOrderId?: string;
  poNumber?: string;
}

export interface PartsOrderRecord {
  id: string;
  objectType: "parts_order";
  poNumber: string | null;
  status: string | null;
  expectedArrival: string | null;
  partsLocked: boolean;
  orderNotes: string | null;
  partsLines?: PartsLineRecord[];
}

export interface SalesOrderLineRecord {
  id: string;
  objectType: "sales_order_line";
  name: string | null;
  quantity: string | null;
  price: string | null;
  sku: string | null;
  description: string | null;
  // custom fields from La-Z-Boy
  chargeCode: string | null;
  partSource: string | null;
  vendorCode: string | null;
  partDeliveryMethod: string | null;
  lineStatus: string | null;
  binLocation: string | null;
  storeCd: string | null;  // 2-digit store code (00-09)
  locCd: string | null;    // location code within store
  customerName: string | null;  // customer name for search/filter
  serviceOrderNumber: string | null;  // service order number for search/filter
}

// ─── Parts Line ───────────────────────────────────────────────────────────────

const PARTS_LINE_PROPS = [
  "line_status",
  "vendor_code",
  "received_date",
  "spot_pro_number",
  "part_category",
  "shipment_exception_reason",
  "lead_time_days",
  "charge_code",
  "part_source",
  "part_delivery_method",
  "bin_location",
  "ali_number",
  "style_number",
  "hs_object_id",
].join(",");

function mapPartsLine(raw: Record<string, unknown>): PartsLineRecord {
  const p = raw.properties as Record<string, string | null>;
  return {
    id: raw.id as string,
    objectType: "parts_line",
    lineStatus: p.line_status ?? null,
    vendorCode: p.vendor_code ?? null,
    receivedDate: p.received_date ?? null,
    spotProNumber: p.spot_pro_number ?? null,
    partCategory: p.part_category ?? null,
    shipmentExceptionReason: p.shipment_exception_reason ?? null,
    leadTimeDays: p.lead_time_days ?? null,
    chargeCode: p.charge_code ?? null,
    partSource: p.part_source ?? null,
    partDeliveryMethod: p.part_delivery_method ?? null,
    binLocation: p.bin_location ?? null,
    aliNumber: p.ali_number ?? null,
    styleNumber: p.style_number ?? null,
  };
}

export async function getPartsLineById(id: string): Promise<PartsLineRecord> {
  const url = `${HS_BASE}/crm/v3/objects/${PARTS_LINE_OBJECT}/${id}?properties=${PARTS_LINE_PROPS}&associations=2-57143005`;
  const { data } = await axios.get(url, { headers: headers() });
  const record = mapPartsLine(data);
  // attach PO association if present
  const assoc = data.associations?.[PARTS_ORDER_OBJECT]?.results?.[0];
  if (assoc) {
    record.partsOrderId = assoc.id;
    try {
      const po = await getPartsOrderById(assoc.id);
      record.poNumber = po.poNumber ?? undefined;
    } catch {
      // ignore
    }
  }
  return record;
}

export async function searchPartsLines(
  filterGroups: Array<{ filters: Array<{ propertyName: string; operator: string; value: string }> }>,
  limit = 20
): Promise<PartsLineRecord[]> {
  const url = `${HS_BASE}/crm/v3/objects/${PARTS_LINE_OBJECT}/search`;
  const body = {
    filterGroups,
    properties: PARTS_LINE_PROPS.split(","),
    limit,
    sorts: [{ propertyName: "hs_createdate", direction: "DESCENDING" }],
  };
  const { data } = await axios.post(url, body, { headers: headers() });
  return (data.results ?? []).map(mapPartsLine);
}

export async function updatePartsLine(
  id: string,
  props: { line_status?: string; received_date?: string; bin_location?: string }
): Promise<PartsLineRecord> {
  const url = `${HS_BASE}/crm/v3/objects/${PARTS_LINE_OBJECT}/${id}`;
  const { data } = await axios.patch(url, { properties: props }, { headers: headers() });
  return mapPartsLine(data);
}

// ─── Parts Order ──────────────────────────────────────────────────────────────

const PARTS_ORDER_PROPS = [
  "po_number",
  "parts_order_status",
  "expected_arrival",
  "parts_locked",
  "order_notes",
  "hs_object_id",
].join(",");

function mapPartsOrder(raw: Record<string, unknown>): PartsOrderRecord {
  const p = raw.properties as Record<string, string | null>;
  return {
    id: raw.id as string,
    objectType: "parts_order",
    poNumber: p.po_number ?? null,
    status: p.parts_order_status ?? null,
    expectedArrival: p.expected_arrival ?? null,
    partsLocked: p.parts_locked === "true",
    orderNotes: p.order_notes ?? null,
  };
}

export async function getPartsOrderById(id: string): Promise<PartsOrderRecord> {
  const url = `${HS_BASE}/crm/v3/objects/${PARTS_ORDER_OBJECT}/${id}?properties=${PARTS_ORDER_PROPS}&associations=${PARTS_LINE_OBJECT}`;
  const { data } = await axios.get(url, { headers: headers() });
  const record = mapPartsOrder(data);
  // fetch associated parts lines
  const lineIds: string[] = (data.associations?.[PARTS_LINE_OBJECT]?.results ?? []).map(
    (r: { id: string }) => r.id
  );
  if (lineIds.length > 0) {
    const lines = await Promise.all(lineIds.slice(0, 20).map((lid) => getPartsLineById(lid)));
    record.partsLines = lines;
  }
  return record;
}

export async function searchPartsOrders(
  filterGroups: Array<{ filters: Array<{ propertyName: string; operator: string; value: string }> }>,
  limit = 20
): Promise<PartsOrderRecord[]> {
  const url = `${HS_BASE}/crm/v3/objects/${PARTS_ORDER_OBJECT}/search`;
  const body = {
    filterGroups,
    properties: PARTS_ORDER_PROPS.split(","),
    limit,
    sorts: [{ propertyName: "hs_createdate", direction: "DESCENDING" }],
  };
  const { data } = await axios.post(url, body, { headers: headers() });
  return (data.results ?? []).map(mapPartsOrder);
}

// ─── Sales Order Line (Line Items) ────────────────────────────────────────────

const SALES_ORDER_LINE_PROPS = [
  "name",
  "quantity",
  "price",
  "hs_sku",
  "description",
  "charge_code",
  "part_source",
  "vendor_code",
  "part_delivery_method",
  "line_status",
  "bin_location",
  "hs_object_id",
].join(",");

function mapSalesOrderLine(raw: Record<string, unknown>): SalesOrderLineRecord {
  const p = raw.properties as Record<string, string | null>;
  return {
    id: raw.id as string,
    objectType: "sales_order_line",
    name: p.name ?? null,
    quantity: p.quantity ?? null,
    price: p.price ?? null,
    sku: p.hs_sku ?? null,
    description: p.description ?? null,
    chargeCode: p.charge_code ?? null,
    partSource: p.part_source ?? null,
    vendorCode: p.vendor_code ?? null,
    partDeliveryMethod: p.part_delivery_method ?? null,
    lineStatus: p.line_status ?? null,
    binLocation: p.bin_location ?? null,
    storeCd: p.store_cd ?? null,
    locCd: p.loc_cd ?? null,
    customerName: p.customer_name ?? null,
    serviceOrderNumber: p.service_order_number ?? null,
  };
}

export async function getSalesOrderLineById(id: string): Promise<SalesOrderLineRecord> {
  const url = `${HS_BASE}/crm/v3/objects/${SALES_ORDER_LINE_OBJECT}/${id}?properties=${SALES_ORDER_LINE_PROPS}`;
  const { data } = await axios.get(url, { headers: headers() });
  return mapSalesOrderLine(data);
}

export async function updateSalesOrderLine(
  id: string,
  props: { line_status?: string; bin_location?: string; received_date?: string }
): Promise<SalesOrderLineRecord> {
  const url = `${HS_BASE}/crm/v3/objects/${SALES_ORDER_LINE_OBJECT}/${id}`;
  const { data } = await axios.patch(url, { properties: props }, { headers: headers() });
  return mapSalesOrderLine(data);
}

// ─── Furniture (Custom Sales Order Line 2-48907108) ───────────────────────────────

const FURNITURE_PROPS = [
  "name",
  "quantity",
  "price",
  "hs_sku",
  "description",
  "charge_code",
  "part_source",
  "vendor_code",
  "part_delivery_method",
  "line_status",
  "bin_location",
  "store_cd",
  "loc_cd",
  "customer_name",
  "service_order_number",
  "hs_object_id",
].join(",");

function mapFurniture(raw: Record<string, unknown>): SalesOrderLineRecord {
  const p = raw.properties as Record<string, string | null>;
  return {
    id: raw.id as string,
    objectType: "sales_order_line",
    name: p.name ?? null,
    quantity: p.quantity ?? null,
    price: p.price ?? null,
    sku: p.hs_sku ?? null,
    description: p.description ?? null,
    chargeCode: p.charge_code ?? null,
    partSource: p.part_source ?? null,
    vendorCode: p.vendor_code ?? null,
    partDeliveryMethod: p.part_delivery_method ?? null,
    lineStatus: p.line_status ?? null,
    binLocation: p.bin_location ?? null,
    storeCd: p.store_cd ?? null,
    locCd: p.loc_cd ?? null,
    customerName: p.customer_name ?? null,
    serviceOrderNumber: p.service_order_number ?? null,
  };
}

export async function getFurnitureById(id: string): Promise<SalesOrderLineRecord> {
  const url = `${HS_BASE}/crm/v3/objects/${FURNITURE_OBJECT}/${id}?properties=${FURNITURE_PROPS}`;
  const { data } = await axios.get(url, { headers: headers() });
  return mapFurniture(data);
}

export async function updateFurniture(
  id: string,
  props: { line_status?: string; received_date?: string; bin_location?: string; store_cd?: string; loc_cd?: string }
): Promise<SalesOrderLineRecord> {
  const url = `${HS_BASE}/crm/v3/objects/${FURNITURE_OBJECT}/${id}`;
  const { data } = await axios.patch(url, { properties: props }, { headers: headers() });
  return mapFurniture(data);
}

// ─── Smart Lookup (parse scanned code) ───────────────────────────────────────

/**
 * Parse a scanned code and determine what HubSpot object it refers to.
 * Supported formats:
 *   - "PL:{hubspot_id}"          → Parts Line by ID
 *   - "PO:{hubspot_id}"          → Parts Order by ID
 *   - "SOL:{hubspot_id}"         → Sales Order Line by ID
 *   - "PRO:{pro_number}"         → Parts Line by SPOT PRO#
 *   - "ALI:{ali_number}"         → Parts Line by ALI#
 *   - Bare numeric string        → try Parts Line ID first, then Parts Order ID
 *   - Any other string           → search by PO number, PRO number, or name
 */
export type LookupResult =
  | { type: "parts_line"; record: PartsLineRecord }
  | { type: "parts_order"; record: PartsOrderRecord }
  | { type: "sales_order_line"; record: SalesOrderLineRecord }
  | { type: "not_found"; code: string };

/**
 * Extract HubSpot ID from a full HubSpot URL.
 * Example: https://app.hubspot.com/contacts/44270378/record/2-57157764/47526582026
 * Returns: { objectType: "2-57157764", id: "47526582026" } or null
 */
function extractHubSpotIdFromUrl(url: string): { objectType: string; id: string } | null {
  const match = url.match(/\/record\/([^/]+)\/([^/]+)$/);
  if (match) {
    return { objectType: match[1], id: match[2] };
  }
  return null;
}

export async function lookupByCode(code: string): Promise<LookupResult> {
  const trimmed = code.trim();

  // Try to extract HubSpot ID from URL (if user scanned a full HubSpot URL)
  const urlMatch = extractHubSpotIdFromUrl(trimmed);
  if (urlMatch) {
    if (urlMatch.objectType === PARTS_LINE_OBJECT) {
      try {
        const record = await getPartsLineById(urlMatch.id);
        return { type: "parts_line", record };
      } catch {
        return { type: "not_found", code: trimmed };
      }
    }
    if (urlMatch.objectType === PARTS_ORDER_OBJECT) {
      try {
        const record = await getPartsOrderById(urlMatch.id);
        return { type: "parts_order", record };
      } catch {
        return { type: "not_found", code: trimmed };
      }
    }
    if (urlMatch.objectType === SALES_ORDER_LINE_OBJECT) {
      try {
        const record = await getSalesOrderLineById(urlMatch.id);
        return { type: "sales_order_line", record };
      } catch {
        return { type: "not_found", code: trimmed };
      }
    }
    if (urlMatch.objectType === FURNITURE_OBJECT) {
      try {
        const record = await getFurnitureById(urlMatch.id);
        return { type: "sales_order_line", record };
      } catch {
        return { type: "not_found", code: trimmed };
      }
    }
    // Unknown object type in URL—return not found instead of trying to search
    return { type: "not_found", code: trimmed };
  }

  // Explicit prefix routing
  if (trimmed.startsWith("PL:")) {
    const id = trimmed.slice(3);
    try {
      const record = await getPartsLineById(id);
      return { type: "parts_line", record };
    } catch {
      return { type: "not_found", code: trimmed };
    }
  }
  if (trimmed.startsWith("PO:")) {
    const id = trimmed.slice(3);
    try {
      const record = await getPartsOrderById(id);
      return { type: "parts_order", record };
    } catch {
      return { type: "not_found", code: trimmed };
    }
  }
  if (trimmed.startsWith("SOL:")) {
    const id = trimmed.slice(4);
    try {
      const record = await getSalesOrderLineById(id);
      return { type: "sales_order_line", record };
    } catch {
      return { type: "not_found", code: trimmed };
    }
  }
  if (trimmed.startsWith("PRO:")) {
    const pro = trimmed.slice(4);
    try {
      const results = await searchPartsLines([
        { filters: [{ propertyName: "spot_pro_number", operator: "EQ", value: pro }] },
      ]);
      if (results.length > 0) return { type: "parts_line", record: results[0] };
    } catch {
      // fall through
    }
    return { type: "not_found", code: trimmed };
  }
  if (trimmed.startsWith("ALI:")) {
    const ali = trimmed.slice(4);
    try {
      const results = await searchPartsLines([
        { filters: [{ propertyName: "ali_number", operator: "EQ", value: ali }] },
      ]);
      if (results.length > 0) return { type: "parts_line", record: results[0] };
    } catch {
      // fall through
    }
    return { type: "not_found", code: trimmed };
  }

  // Bare numeric → try Parts Line ID, then Parts Order ID
  if (/^\d+$/.test(trimmed)) {
    try {
      const record = await getPartsLineById(trimmed);
      return { type: "parts_line", record };
    } catch {
      // fall through
    }
    try {
      const record = await getPartsOrderById(trimmed);
      return { type: "parts_order", record };
    } catch {
      // fall through
    }
    return { type: "not_found", code: trimmed };
  }

  // Try searching by PO number (with error handling)
  try {
    const poResults = await searchPartsOrders([
      { filters: [{ propertyName: "po_number", operator: "EQ", value: trimmed }] },
    ]);
    if (poResults.length > 0) return { type: "parts_order", record: poResults[0] };
  } catch {
    // fall through
  }

  // Try searching by PRO number (with error handling)
  try {
    const proResults = await searchPartsLines([
      { filters: [{ propertyName: "spot_pro_number", operator: "EQ", value: trimmed }] },
    ]);
    if (proResults.length > 0) return { type: "parts_line", record: proResults[0] };
  } catch {
    // fall through
  }

  // Try searching by ALI number
  const aliResults = await searchPartsLines([
    { filters: [{ propertyName: "ali_number", operator: "EQ", value: trimmed }] },
  ]);
  if (aliResults.length > 0) return { type: "parts_line", record: aliResults[0] };

  return { type: "not_found", code: trimmed };
}

// ─── Parts to Receive list ────────────────────────────────────────────────────

export async function getPartsToReceive(limit = 50): Promise<PartsLineRecord[]> {
  return searchPartsLines(
    [{ filters: [{ propertyName: "line_status", operator: "EQ", value: "Ordered" }] }],
    limit
  );
}


// ─── Store Inventory ──────────────────────────────────────────────────────────

export interface InventoryItem extends SalesOrderLineRecord {
  locationCheckpoint?: number;
  lastScanAt?: string;
}

export async function getStoreInventory(
  storeCd: string,
  customerName?: string,
  serviceOrderNumber?: string
): Promise<InventoryItem[]> {
  const url = `${HS_BASE}/crm/v3/objects/${FURNITURE_OBJECT}/search`;
  
  // Build filters: store_cd is required, customer_name and service_order_number are optional
  const filters = [
    { propertyName: "store_cd", operator: "EQ", value: storeCd },
  ];
  
  if (customerName?.trim()) {
    filters.push({
      propertyName: "customer_name",
      operator: "CONTAINS_TOKEN",
      value: customerName.trim(),
    });
  }
  
  if (serviceOrderNumber?.trim()) {
    filters.push({
      propertyName: "service_order_number",
      operator: "CONTAINS_TOKEN",
      value: serviceOrderNumber.trim(),
    });
  }
  
  const body = {
    filterGroups: [{ filters }],
    properties: FURNITURE_PROPS.split(","),
    limit: 100,
    sorts: [{ propertyName: "hs_createdate", direction: "DESCENDING" }],
  };
  const { data } = await axios.post(url, body, { headers: headers() });
  return (data.results ?? []).map((raw: Record<string, unknown>) => {
    const item = mapFurniture(raw);
    return {
      ...item,
      // TODO: Add location checkpoint mapping from loc_cd or location tracking
      locationCheckpoint: 3, // Default to "Received at Warehouse"
      lastScanAt: (raw as any).hs_lastmodifieddate,
    } as InventoryItem;
  });
}
