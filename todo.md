# La-Z-Boy Parts Scanner — TODO

## V1: Complete GERS IST Workflow (Current Sprint)

### HubSpot Setup
- [x] Add `service_piece_id` field to Sales Order Line (Text, unique ID MMDDYSEQ##)
- [x] Add `furniture_photo_url` field to Sales Order Line (URL to photo)
- [ ] Create IST Ticket object in HubSpot with pipeline (Request → Scheduled → Complete)
- [ ] Add fields to IST Ticket: `dest_store_cd`, `origin_store_cd`, `service_piece_id`

### Check-In Form (iPad) - SIMPLIFIED WORKFLOW
- [x] Capture furniture photo (iPad camera)
- [x] Ask for location info:
  - [x] `St` (Store: dropdown 00-09)
  - [x] `Loc` (Location: dropdown - predefined values)
- [x] Ask: "Create IST transfer?" (Yes/No)
  - [x] If YES: ask for `DEST_STORE_CD` (default 00)
  - [x] If NO: skip IST creation
- [x] Generate unique ID (MMDDYSEQ## format)
- [ ] Create/update Sales Order Line in HubSpot
- [x] Prompt: "Print tag now?" (Yes/No)
  - [ ] If YES: send to Zebra printer
  - [x] If NO: done

### Label Printing (Zebra)
- [ ] Integrate Zebra Browser Print SDK
- [ ] Design label template with:
  - [ ] Unique ID (barcode + text)
  - [ ] Store code
  - [ ] Location code
  - [ ] Date/time
- [ ] Print on-demand when employee confirms

### IST Ticket Auto-Creation
- [ ] If "Create IST transfer" selected:
  - [ ] Auto-create IST Ticket with:
    - [ ] `dest_store_cd` from form
    - [ ] `origin_store_cd` from form
    - [ ] `service_piece_id` (link to furniture)
    - [ ] Status = "Request"

### Inventory View
- [x] Display all furniture by store
- [x] Show: unique ID, St, Loc, check-in time
- [ ] Show furniture photo thumbnail
- [x] Filter by store
- [x] Search by customer name or order number

### Parts Display
- [x] Display parts_line_name instead of ALI numbers
- [x] Show SKU as fallback
- [x] Display cust_code
- [x] Add live data dashboard to home page (Parts Orders & Parts Lines counts)

### Testing & Validation
- [ ] Test check-in workflow end-to-end
- [ ] Test photo capture on iPad
- [x] Test unique ID generation
- [ ] Test IST ticket creation
- [ ] Test label printing to Zebra
- [ ] Verify GERS workflow alignment
- [x] TypeScript clean

### Known Limitations (V2)
- [ ] No DispatchTrack webhook integration yet
- [ ] No automatic status advancement
- [ ] No 7-checkpoint statuses yet
- [ ] No IST Ticket object in HubSpot yet (manual setup required)
