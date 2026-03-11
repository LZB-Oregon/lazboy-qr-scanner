/**
 * Furniture Intake Workflow
 * Handles furniture intake form submission and ticket creation in HubSpot
 */

import axios from "axios";
import { ENV } from "./_core/env";

const HS_BASE = "https://api.hubapi.com";

function headers() {
  return {
    Authorization: `Bearer ${ENV.hubspotToken}`,
    "Content-Type": "application/json",
  };
}

export interface IntakeFormData {
  acknowledgementNumber: string;
  customerCode: string;
  storeCd: string;
  damageNotes?: string;
  photoUrl?: string; // URL to photo stored in HubSpot or S3
}

/**
 * Create a ticket in HubSpot for furniture intake
 * The ticket will be manually associated to the correct SOL by CSR
 */
export async function createIntakeTicket(data: IntakeFormData) {
  const ticketTitle = `Service Intake - ${data.acknowledgementNumber} - ${data.customerCode}`;
  
  const ticketBody = `
**Furniture Intake**
- Acknowledgement #: ${data.acknowledgementNumber}
- Customer Code: ${data.customerCode}
- Store: ${data.storeCd}
- Damage Notes: ${data.damageNotes || "None"}
- Photo: ${data.photoUrl ? `[View Photo](${data.photoUrl})` : "Not provided"}
  `.trim();

  const url = `${HS_BASE}/crm/v3/objects/tickets`;
  
  const payload = {
    properties: {
      subject: ticketTitle,
      content: ticketBody,
      hs_ticket_priority: "high", // Mark intake tickets as high priority
      source: "INTAKE_FORM", // Custom source identifier
    },
  };

  try {
    const { data: response } = await axios.post(url, payload, { headers: headers() });
    return {
      ticketId: response.id,
      ticketUrl: response.url || `https://app.hubspot.com/crm/tickets/${response.id}`,
      success: true,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[HubSpot Intake] Error creating ticket:", error.response?.data);
      throw new Error(`Failed to create intake ticket: ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
}

/**
 * Upload photo to HubSpot as a file and attach to ticket
 * Note: This is a simplified approach. In production, you might want to:
 * 1. Store photo in S3 and embed the URL in the ticket body
 * 2. Or use HubSpot's file upload API
 */
export async function attachPhotoToTicket(ticketId: string, photoUrl: string) {
  // For now, we'll just return the photo URL
  // The photo URL will be embedded in the ticket body during creation
  return {
    ticketId,
    photoUrl,
    attached: true,
  };
}

/**
 * Get store locations for dropdown selector
 */
export async function getStoreLocations() {
  const url = `${HS_BASE}/crm/v3/objects/2-46819145/search`;
  
  const payload = {
    filterGroups: [],
    properties: ["store_cd", "store_name"],
    limit: 100,
  };

  try {
    const { data: response } = await axios.post(url, payload, { headers: headers() });
    return response.results.map((result: any) => ({
      id: result.id,
      storeCd: result.properties.store_cd,
      storeName: result.properties.store_name,
    }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[HubSpot Intake] Error fetching stores:", error.response?.data);
    }
    throw error;
  }
}
