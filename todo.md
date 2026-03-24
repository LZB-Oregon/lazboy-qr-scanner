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


## Phase 1: Furniture Intake & QR Labels (COMPLETE)
- [x] Photo capture component (camera input)
- [x] Furniture intake form: ack#, cust_code, damage notes, photo
- [x] First Name, Last Name, Phone Number, SKU fields (required)
- [x] Make Acknowledgement Number mandatory (validation)
- [x] Store code dropdown selector
- [x] Create Ticket in HubSpot with intake data
- [x] Send form to HubSpot inbox
- [x] Service tag QR generation (server-side using qrcode package)
- [x] ZPL label formatting for Blackmark Zebra printer
- [x] All 6 tabs working (Home, Scan, Receive, Search, History, Intake)

## Phase 2: Store Inventory & Location Tracking (IN PROGRESS)

### Store Locations (COMPLETE)
- [x] Define all 9 store locations (00 Warehouse, 01-05, 07-09)
- [x] Update store code dropdown to include all 9 locations
- [x] Add store location constants to shared config
- [x] Update furniture check-in to use store_cd and loc_cd fields

### Store Inventory Feature (COMPLETE)
- [x] Build store inventory page with filterable list
- [x] Filter by store location (all 9 stores)
- [x] Display furniture details: name, SKU, location code, last scan time
- [x] Add Inventory tab to bottom navigation
- [x] Real-time inventory count per store
- [x] Add getStoreInventory tRPC query
- [x] Filter by customer name (search input with CONTAINS_TOKEN)
- [x] Filter by service order number (search input with CONTAINS_TOKEN)
- [x] Display customer name and service order in inventory list
- [x] Clear filters button
- [ ] Filter by location checkpoint (7 statuses) - TODO: implement checkpoint mapping

### Location Tracking (7 Checkpoints) (IN PROGRESS)
- [x] Define 7-checkpoint location tracking workflow with colors
- [x] Color-coded badges for each checkpoint
- [ ] Implement checkpoint mapping from loc_cd field
- [ ] Location history timeline (show previous scans with timestamps)
- [ ] Update `sol_location` field in HubSpot on each scan
- [ ] Track `sol_location_updated` timestamp
- [ ] Track `sol_location_updated_by` employee name

### QR Label Printing (NOT STARTED)
- [ ] Zebra Browser Print SDK integration
- [ ] "Print Label" button on intake success screen
- [ ] Send ZPL directly to Blackmark Zebra printer
- [ ] Label preview before printing
- [ ] Batch label printing (multiple items at once)

### Testing & Polish (COMPLETE)
- [x] Test all 9 store locations in dropdown
- [x] Verify all 10 tests pass (1 skipped)
- [x] TypeScript clean check
- [ ] Test inventory filtering by store/location/customer
- [ ] Test location checkpoint updates to HubSpot
- [ ] Test Zebra printer integration


## Phase 2.5: Inventory Search Filters (IN PROGRESS)
- [ ] Add customer name search input to Inventory page
- [ ] Add service order number search input to Inventory page
- [ ] Update getStoreInventory query to support customer_name filter
- [ ] Update getStoreInventory query to support service_order filter
- [ ] Implement real-time search filtering on frontend
- [ ] Test search with multiple filters combined
- [ ] Verify TypeScript clean
