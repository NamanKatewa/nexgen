import type { Address, Shipment } from "@prisma/client";

export const getLabelHTML = (
	shipment: Shipment & {
		destination_address: Address | null;
		origin_address: Address | null;
	},
	companyName: string,
	courierImage: string,
	barcodeSvg: string,
	qrCodeDataUrl: string,
) => {
	const declaredValue = shipment.declared_value
		? `INR ${shipment.declared_value.toFixed(2)}`
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
            font-size: 10px;
            line-height: 1.2;
            color: #000000;
            background-color: #ffffff;
          }
          .label-container {
            width: 80mm;
            min-height: 100mm;
            border: 1px solid black;
            padding: 1rem;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
          }
          .awb-section {
            text-align: center;
            margin-bottom: 0.5rem;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-bottom: 0.5rem;
          }
          .address-section {
            border-top: 1px solid black;
            border-bottom: 1px solid black;
            padding: 0.5rem 0;
            margin-bottom: 0.5rem;
          }
          .seller-section {
            border-bottom: 1px solid black;
            padding-bottom: 0.5rem;
            margin-bottom: 0.5rem;
          }
          .return-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .font-bold {
            font-weight: bold;
          }
          .text-lg {
            font-size: 1.125rem;
          }
          .text-xl {
            font-size: 1.25rem;
          }
          .text-sm {
            font-size: 0.875rem;
          }
          .text-xs {
            font-size: 0.75rem;
          }
          .h-8 {
            height: 2rem;
          }
          .mb-1 {
            margin-bottom: 0.25rem;
          }
          .mb-2 {
            margin-bottom: 0.5rem;
          }
          .mt-1 {
            margin-top: 0.25rem;
          }
          .p-4 {
            padding: 1rem;
          }
          .text-right {
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="label-container">
          <div class="header">
            <h2 class="font-bold text-lg">SHIPMENT LABEL</h2>
            <img src="${courierImage}" alt="Company Logo" class="h-8" />
          </div>

          <div class="awb-section">
            <img src="${barcodeSvg}" alt="Barcode" style="width: 100%; height: 50px;" />
            <p class="font-bold text-xl">${shipment.awb_number || "N/A"}</p>
          </div>

          <div class="details-grid">
            <div>
              <strong>Shipment ID:</strong> ${
								shipment.human_readable_shipment_id
							}
            </div>
            <div>
              <strong>Declared Value:</strong>
              <span class="font-bold" style="color: #dc2626">
                ${declaredValue}
              </span>
            </div>
          </div>

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
            <p class="font-bold">${companyName}</p>
            <p>Shipment Date: ${createdAt}</p>
          </div>

          <div class="return-section">
            <div class="qr-barcode-section text-center">
              <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 60px; height: 60px;" />
              <p class="mt-1 text-xs">AWB: ${shipment.awb_number || "N/A"}</p>
            </div>
            <div class="return-address text-right">
              <h3 class="mb-1 font-bold">RETURN ADDRESS:</h3>
              <p>
                ${shipment.origin_address?.address_line},
                ${shipment.origin_address?.landmark ? `${shipment.origin_address.landmark},` : ""}
                ${shipment.origin_address?.city},${shipment.origin_address?.state},
                ${shipment.origin_address?.zip_code}
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};
