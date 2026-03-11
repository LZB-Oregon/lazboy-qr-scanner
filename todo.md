# La-Z-Boy Parts Scanner — TODO

## Backend
- [x] HubSpot API integration (Parts Line object 2-57157764, Parts Order 2-57143005, Sales Order Line)
- [x] tRPC router: lookup part by scanned code (QR / barcode)
- [x] tRPC router: search parts by PO#, PRO#, ALI#
- [x] tRPC router: update Parts Line (line_status=Received, received_date, bin_location)
- [x] tRPC router: fetch Parts to Receive list (line_status=Ordered)
- [x] tRPC router: save scan history entry to DB
- [x] tRPC router: get scan history list
- [x] tRPC router: furniture check-in (Sales Order Line)
- [x] DB schema: scan_history table

## Frontend
- [x] Global mobile-first layout with bottom tab navigation
- [x] Scanner page with QR + multi-barcode support (html5-qrcode)
- [x] Part detail modal/page with all fields displayed
- [x] Receiving workflow: bin location input + confirm receive button
- [x] Search page with PO#, PRO#, ALI# search
- [x] Parts to Receive list page (filtered line_status=Ordered)
- [x] Scan history page with audit log
- [x] Furniture check-in flow (Sales Order Line)
- [x] Elegant dark warehouse-optimized UI with large touch targets
- [x] Loading, error, and empty states throughout

## Tests
- [x] Vitest: HubSpot lookup procedure
- [x] Vitest: receive parts procedure
- [x] Vitest: scan history procedure


## Bug Fixes
- [x] Fixed 400 error on scanner lookup: Added URL parsing to extract HubSpot IDs from full HubSpot URLs (e.g., https://app.hubspot.com/contacts/.../record/2-57157764/47526582026)
- [x] Added comprehensive error handling to all search/lookup operations to prevent invalid API calls


## Phase 1: Enhanced Workflows

### Workflow A: Furniture Intake Form
- [x] Photo capture component (camera input)
- [x] Furniture intake form: ack#, cust_code, damage notes, photo
- [x] Store code dropdown selector
- [x] Create Ticket in HubSpot with intake data
- [x] Send form to HubSpot inbox

### Workflow B: Location Tracking & Service Tag Printing
- [x] Simplified furniture location tracking (update store_cd only)
- [x] Service tag QR generation (server-side using qrcode package)
- [x] ZPL label formatting for Blackmark Zebra printer
- [ ] Zebra Browser Print SDK integration
- [ ] Service tag printing from app (pull service_tag_id from HubSpot)

### Workflow C: Parts Receiving Enhancement
- [x] Display remaining parts count after marking part as received
- [x] Show "X of Y parts received on this PO" message

### Testing & Polish
- [ ] Vitest: furniture intake form submission
- [ ] Vitest: service tag QR generation
- [ ] Vitest: parts remaining count calculation
- [ ] UI polish and mobile responsiveness
- [ ] Error handling and loading states
