/**
 * QR Label Generation & ZPL Formatting
 * Generates QR codes and formats them as ZPL (Zebra Programming Language) for thermal printers
 */

import QRCode from "qrcode";

export interface QRLabelData {
  acknowledgementNumber: string;
  customerCode: string;
  serviceOrderNumber?: string;
  partDescription?: string;
  storeCd?: string;
}

/**
 * Generate QR code as data URL (PNG image)
 */
export async function generateQRCodeDataUrl(data: string, size: number = 200): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(data, {
      width: size,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return dataUrl;
  } catch (error) {
    console.error("[QR Generation] Error generating QR code:", error);
    throw error;
  }
}

/**
 * Generate QR code as PNG buffer
 */
export async function generateQRCodeBuffer(data: string, size: number = 200): Promise<Buffer> {
  try {
    const buffer = await QRCode.toBuffer(data, {
      width: size,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return buffer;
  } catch (error) {
    console.error("[QR Generation] Error generating QR code buffer:", error);
    throw error;
  }
}

/**
 * Format QR code as ZPL (Zebra Programming Language) for thermal printer
 * Generates a label with QR code, acknowledgement number, customer code, and optional details
 *
 * ZPL Syntax:
 * ^XA = Start of label
 * ^XZ = End of label
 * ^FO = Field Origin (x, y position)
 * ^BQN = QR Code (N = normal aspect ratio)
 * ^FD = Field Data
 * ^A = Font selection
 * ^TB = Text Block
 */
export function formatQRLabelZPL(data: QRLabelData, options: { width?: number; height?: number; qrSize?: number } = {}): string {
  const labelWidth = options.width || 400; // 4 inches in 1/8" units (typical 4x6 label)
  const labelHeight = options.height || 600; // 6 inches in 1/8" units
  const qrSize = options.qrSize || 200; // QR code size in pixels

  // QR code data: JSON format for easy parsing
  const qrData = JSON.stringify({
    ack: data.acknowledgementNumber,
    cd: data.customerCode,
    so: data.serviceOrderNumber,
    st: data.storeCd,
  });

  // Build ZPL label
  const zpl = `^XA
^MMT
^PW${labelWidth}
^PH${labelHeight}
^PON
^LH0,0
^LS0
^FT50,100^BQN,2,10^FD${qrData}^FS
^FT50,350^A0N,28,28^FDACk: ${data.acknowledgementNumber}^FS
^FT50,400^A0N,28,28^FDCust: ${data.customerCode}^FS
${data.serviceOrderNumber ? `^FT50,450^A0N,20,20^FDSO: ${data.serviceOrderNumber}^FS` : ""}
${data.partDescription ? `^FT50,500^A0N,20,20^FD${data.partDescription.substring(0, 40)}^FS` : ""}
^XZ`;

  return zpl;
}

/**
 * Format multiple QR labels as a single ZPL document (for batch printing)
 */
export function formatMultipleQRLabelsZPL(labels: QRLabelData[], options: { width?: number; height?: number } = {}): string {
  const zplLabels = labels.map((label) => formatQRLabelZPL(label, options));
  return zplLabels.join("\n");
}

/**
 * Generate a simple text-based label format for preview/debugging
 */
export function generateLabelPreview(data: QRLabelData): string {
  return `
╔════════════════════════════════╗
║      SERVICE TAG LABEL         ║
╠════════════════════════════════╣
║ Acknowledgement: ${data.acknowledgementNumber.padEnd(18)}║
║ Customer Code:   ${data.customerCode.padEnd(18)}║
${data.serviceOrderNumber ? `║ Service Order:   ${data.serviceOrderNumber.padEnd(18)}║` : ""}
${data.storeCd ? `║ Store:           ${data.storeCd.padEnd(18)}║` : ""}
${data.partDescription ? `║ Part:            ${data.partDescription.substring(0, 20).padEnd(18)}║` : ""}
║                                ║
║         [QR CODE HERE]         ║
║                                ║
╚════════════════════════════════╝
  `.trim();
}
