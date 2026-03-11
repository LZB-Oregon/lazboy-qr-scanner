import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  lookupByCode,
  getPartsLineById,
  getPartsOrderById,
  getSalesOrderLineById,
  getFurnitureById,
  searchPartsLines,
  searchPartsOrders,
  updatePartsLine,
  updateSalesOrderLine,
  updateFurniture,
  getPartsToReceive,
} from "./hubspot";
import { insertScanHistory, getScanHistory, getScanHistoryByUser } from "./db";

// ─── Scanner Router ─────────────────────────────────────────────────────────────

const scannerRouter = router({
  lookup: publicProcedure
    .input(z.object({ code: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const result = await lookupByCode(input.code);
      const entry = {
        scannedCode: input.code,
        resolvedType: result.type === "not_found" ? "unknown" : result.type,
        hubspotId: result.type !== "not_found" ? result.record.id : null,
        displayName:
          result.type === "parts_order" ? result.record.poNumber
          : result.type === "parts_line" ? (result.record.spotProNumber ?? result.record.aliNumber)
          : result.type === "sales_order_line" ? result.record.name
          : null,
        action: "view" as const,
        success: result.type !== "not_found" ? 1 : 0,
        userId: ctx.user?.id ?? null,
      };
      await insertScanHistory(entry).catch(() => {});
      return result;
    }),

  receivePart: publicProcedure
    .input(z.object({ partsLineId: z.string().min(1), binLocation: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const today = new Date().toISOString().split("T")[0];
      const updated = await updatePartsLine(input.partsLineId, {
        line_status: "Received",
        received_date: today,
        bin_location: input.binLocation,
      });
      await insertScanHistory({
        scannedCode: `PL:${input.partsLineId}`,
        resolvedType: "parts_line",
        hubspotId: input.partsLineId,
        displayName: updated.spotProNumber ?? updated.aliNumber ?? input.partsLineId,
        action: "receive",
        success: 1,
        note: `Bin: ${input.binLocation}`,
        userId: ctx.user?.id ?? null,
      }).catch(() => {});
      return updated;
    }),

  checkinFurniture: publicProcedure
    .input(z.object({ salesOrderLineId: z.string().min(1), binLocation: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const today = new Date().toISOString().split("T")[0];
      const props: Record<string, string> = { line_status: "Received", received_date: today };
      if (input.binLocation) props.bin_location = input.binLocation;
      const updated = await updateFurniture(input.salesOrderLineId, props);
      await insertScanHistory({
        scannedCode: `SOL:${input.salesOrderLineId}`,
        resolvedType: "sales_order_line",
        hubspotId: input.salesOrderLineId,
        displayName: updated.name ?? input.salesOrderLineId,
        action: "checkin",
        success: 1,
        note: input.binLocation ? `Bin: ${input.binLocation}` : undefined,
        userId: ctx.user?.id ?? null,
      }).catch(() => {});
      return updated;
    }),

  search: publicProcedure
    .input(z.object({ query: z.string().min(1), type: z.enum(["po", "pro", "ali", "auto"]).default("auto") }))
    .query(async ({ input }) => {
      const q = input.query.trim();
      if (input.type === "po") {
        const orders = await searchPartsOrders([{ filters: [{ propertyName: "po_number", operator: "CONTAINS_TOKEN", value: q }] }]);
        return { orders, lines: [] };
      }
      if (input.type === "pro") {
        const lines = await searchPartsLines([{ filters: [{ propertyName: "spot_pro_number", operator: "CONTAINS_TOKEN", value: q }] }]);
        return { orders: [], lines };
      }
      if (input.type === "ali") {
        const lines = await searchPartsLines([{ filters: [{ propertyName: "ali_number", operator: "CONTAINS_TOKEN", value: q }] }]);
        return { orders: [], lines };
      }
      const [orders, proLines, aliLines] = await Promise.all([
        searchPartsOrders([{ filters: [{ propertyName: "po_number", operator: "CONTAINS_TOKEN", value: q }] }]).catch(() => []),
        searchPartsLines([{ filters: [{ propertyName: "spot_pro_number", operator: "CONTAINS_TOKEN", value: q }] }]).catch(() => []),
        searchPartsLines([{ filters: [{ propertyName: "ali_number", operator: "CONTAINS_TOKEN", value: q }] }]).catch(() => []),
      ]);
      const lineMap = new Map([...proLines, ...aliLines].map((l) => [l.id, l]));
      return { orders, lines: Array.from(lineMap.values()) };
    }),

  partsToReceive: publicProcedure
    .input(z.object({ limit: z.number().default(50) }).optional())
    .query(async ({ input }) => getPartsToReceive(input?.limit ?? 50)),

  scanHistory: publicProcedure
    .input(z.object({ limit: z.number().default(50) }).optional())
    .query(async ({ input, ctx }) => {
      if (ctx.user) return getScanHistoryByUser(ctx.user.id, input?.limit ?? 50);
      return getScanHistory(input?.limit ?? 50);
    }),

  getPartsLine: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => getPartsLineById(input.id)),

  getPartsOrder: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => getPartsOrderById(input.id)),

  getSalesOrderLine: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => getSalesOrderLineById(input.id)),
});

// ─── App Router ─────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  scanner: scannerRouter,
});

export type AppRouter = typeof appRouter;
