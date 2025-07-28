import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";

export const getLabelHTML = (
	shipment: inferRouterOutputs<AppRouter>["label"]["generateLabel"]["shipment"],
	courierImage: string,
	barcodeSvg: string,
	qrCodeDataUrl: string,
) => {
	const declaredValue = shipment.declared_value
		? `INR ${Number(shipment.declared_value).toFixed(2)}`
		: "N/A";

	const createdAt = shipment.created_at
		? new Date(shipment.created_at).toLocaleString()
		: "N/A";

	return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: sans-serif;
            font-size: 12px; /* Base font size for A4 */
            line-height: 1.4;
            color: #000000;
            background-color: #ffffff;
          }
          .label-container {
            width: 794px; /* A4 width */
            height: 1123px; /* A4 height */
            border: 1px solid black;
            padding: 15mm; /* A4 appropriate padding */
            box-sizing: border-box;
          }
          .header {
            width: 100%;
            margin-bottom: 10mm;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
          }
          .header-table td {
            padding: 0;
            vertical-align: middle;
          }
          .header-table .text-right {
            text-align: right;
          }
          .awb-section {
            text-align: center;
            margin-bottom: 10mm;
          }
          .awb-section img {
            max-width: 100%;
            height: auto;
          }
          .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10mm;
          }
          .details-table td {
            padding: 0;
            width: 50%;
          }
          .address-section {
            border-top: 1px solid black;
            border-bottom: 1px solid black;
            padding: 5mm 0;
            margin-bottom: 10mm;
          }
          .seller-section {
            border-bottom: 1px solid black;
            padding-bottom: 5mm;
            margin-bottom: 10mm;
          }
          .return-section-table {
            width: 100%;
            border-collapse: collapse;
          }
          .return-section-table td {
            padding: 0;
            vertical-align: bottom;
          }
          .return-section-table .text-right {
            text-align: right;
          }
          .qr-barcode-section img {
            max-width: 100%;
            height: auto;
          }
          .font-bold {
            font-weight: bold;
          }
          .text-lg {
            font-size: 18px; /* Adjusted for A4 */
          }
          .text-xl {
            font-size: 24px; /* Adjusted for A4 */
          }
          .text-sm {
            font-size: 14px; /* Adjusted for A4 */
          }
          .text-xs {
            font-size: 10px; /* Adjusted for A4 */
          }
          .h-8 {
            height: 80px; /* Adjusted for A4 */
            width: 160px; /* Adjusted for A4 */
            object-fit: contain;
          }
          .mb-1 {
            margin-bottom: 5mm;
          }
          .mb-2 {
            margin-bottom: 10mm;
          }
          .mt-1 {
            margin-top: 5mm;
          }
          .p-4 {
            padding: 10mm;
          }
          .text-right {
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="label-container">
          <div class="header">
            <table class="header-table">
              <tr>
                <td><h2 class="font-bold text-lg">SHIPMENT LABEL</h2></td>
                <td class="text-right"><img src="${courierImage}" alt="Company Logo" class="h-8" /></td>
              </tr>
            </table>
          </div>

          <div class="awb-section">
            <img src="${barcodeSvg}" alt="Barcode" style="width: 100%; height: 50px;" />
          </div>

          <table class="details-table">
            <tr>
              <td>
                <strong>Shipment ID:</strong> ${
									shipment.human_readable_shipment_id
								}
              </td>
              <td>
                <strong>Declared Value:</strong>
                <span class="font-bold" style="color: #dc2626">
                  ${declaredValue}
                </span>
              </td>
            </tr>
          </table>

          <div class="address-section">
            <h3 class="mb-1 font-bold">RECIPIENT:</h3>
            <p class="font-bold text-sm">${shipment.recipient_name}</p>
            <p>
              ${shipment.destination_address?.address_line},
              ${shipment.destination_address?.landmark ? `${shipment.destination_address.landmark},` : ""}
              ${shipment.destination_address?.city},
              ${shipment.destination_address?.state}, PIN: 
              ${shipment.destination_address?.zip_code}
            </p>
            <p>Mobile: ${shipment.recipient_mobile}</p>
          </div>

          <div class="seller-section">
            <h3 class="mb-1 font-bold">SELLER:</h3>
            <p class="font-bold">${shipment.user.kyc?.entity_name}</p>
            <p>Shipment Date: ${createdAt}</p>
          </div>

          <table class="return-section-table">
            <tr>
              <td>
                <div class="qr-barcode-section text-center">
                  <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 60px; height: 60px;" />
                  <p class="mt-1 text-xs">AWB: ${shipment.awb_number || "N/A"}</p>
                </div>
              </td>
              <td class="text-right">
                <div class="return-address">
                  <h3 class="mb-1 font-bold">RETURN ADDRESS:</h3>
                  <p>
                    ${shipment.origin_address?.address_line},
                    ${shipment.origin_address?.landmark ? `${shipment.origin_address.landmark},` : ""}
                    ${shipment.origin_address?.city},${shipment.origin_address?.state},
                    ${shipment.origin_address?.zip_code}
                  </p>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `;
};
