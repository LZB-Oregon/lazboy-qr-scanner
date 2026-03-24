# La-Z-Boy Parts Scanner — TODO

## V1: Complete GERS IST Workflow (Current Sprint)

### HubSpot Setup
- [x] Add `service_piece_id` field to Sales Order Line (Text, unique ID MMDDYSEQ##)
- [x] Add `ack_photo_url` field to Sales Order Line (URL to photo)
- [x] Add `furniture_photo_url` field to Sales Order Line (URL to photo)
- [x] Add `ack_value` field to Sales Order Line (Text, manually entered by CSR)
- [ ] Create IST Ticket object in HubSpot with pipeline (Request → Scheduled → Complete)
- [ ] Add fields to IST Ticket: `dest_store_cd`, `origin_store_cd`, `service_piece_id`

### Check-In Form (iPad)
- [x] Customer lookup by name or order number
- [x] Find/create Sales Order Line
- [x] Display existing furniture photo if available
- [x] Capture furniture photo (iPad camera)
- [x] Capture ACK tag photo (iPad camera)
- [ ] Store photos to S3
- [x] Form inputs:
  - [x] `St` (Store: dropdown 00-09)
  - [x] `Loc` (Location: dropdown - predefined values)
  - [x] Option to change `DEST_STORE_CD` (default 00)
- [x] Generate unique ID (MMDDYSEQ## format)
- [x] Save to Sales Order Line

### IST Ticket Auto-Creation
- [x] Ask: "Create IST ticket?" (Yes/No)
- [ ] If YES: auto-create IST Ticket with:
  - [ ] `dest_store_cd` from form
  - [ ] `origin_store_cd` from form
  - [ ] `service_piece_id` (link to furniture)
  - [ ] Status = "Request"
- [x] If NO: just check-in furniture, no IST

### Label Printing (Zebra)
- [ ] Integrate Zebra Browser Print SDK
- [ ] Design label template with:
  - [ ] Unique ID (barcode + text)
  - [ ] Customer name
  - [ ] Store code
  - [ ] Location code
  - [ ] Date/time
- [ ] Auto-print after check-in (optional)
- [ ] On-demand print button

### Inventory View
- [x] Display all furniture by store
- [x] Show: unique ID, customer name, St, Loc, check-in time
- [ ] Show furniture photo thumbnail
- [ ] Show ACK photo thumbnail
- [x] Filter by store
- [x] Search by customer name or order number

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
- [ ] No OCR for ACK value extraction
- [ ] No automatic status advancement
- [ ] No 7-checkpoint statuses yet
- [ ] No IST Ticket object in HubSpot yet (manual setup required)
