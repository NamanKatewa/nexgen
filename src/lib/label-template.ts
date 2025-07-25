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
            font-size: 8px; /* Reduced base font size */
            line-height: 1.2;
            color: #000000;
            background-color: #ffffff;
          }
          .label-container {
            width: 80mm;
            min-height: 100mm;
            border: 1px solid black;
            padding: 0.5rem; /* Reduced padding */
            box-sizing: border-box; /* Include padding in width/height */
          }
          .header {
            width: 100%;
            margin-bottom: 0.2rem; /* Reduced margin */
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
            margin-bottom: 0.2rem; /* Reduced margin */
          }
          .awb-section img {
            max-width: 100%;
            height: auto; /* Ensure image scales */
          }
          .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0.2rem; /* Reduced margin */
          }
          .details-table td {
            padding: 0;
            width: 50%; /* Two columns */
          }
          .address-section {
            border-top: 1px solid black;
            border-bottom: 1px solid black;
            padding: 0.2rem 0; /* Reduced padding */
            margin-bottom: 0.2rem; /* Reduced margin */
          }
          .seller-section {
            border-bottom: 1px solid black;
            padding-bottom: 0.2rem; /* Reduced padding */
            margin-bottom: 0.2rem; /* Reduced margin */
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
            height: auto; /* Ensure image scales */
          }
          .font-bold {
            font-weight: bold;
          }
          .text-lg {
            font-size: 10px; /* Adjusted from 1.125rem */
          }
          .text-xl {
            font-size: 12px; /* Adjusted from 1.25rem */
          }
          .text-sm {
            font-size: 8px; /* Adjusted from 0.875rem */
          }
          .text-xs {
            font-size: 7px; /* Adjusted from 0.75rem */
          }
          .h-8 {
            height: 50px; /* Fixed height for courier image */
            width: 100px; /* Fixed width for courier image */
            object-fit: contain;
          }
          .mb-1 {
            margin-bottom: 0.1rem;
          }
          .mb-2 {
            margin-bottom: 0.2rem;
          }
          .mt-1 {
            margin-top: 0.1rem;
          }
          .p-4 {
            padding: 0.5rem;
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
