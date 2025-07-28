import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";

export const getLabelHTML = (
	shipment: inferRouterOutputs<AppRouter>["label"]["generateLabel"]["shipment"],
	courierImage: string,
	barcodeSvg: string,
	qrCodeDataUrl: string,
) => {
	const createdAt = shipment.created_at
		? new Date(shipment.created_at).toLocaleString()
		: "N/A";

	return `
  <!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8" />
</head>

<body style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #000000; background-color: #ffffff;">
  <div style="width: 794px; height: 1123px; border: 5px solid black;; box-sizing: border-box;">
    <div style="display:flex; width: 100%;">

      <div
        style="width: 1000px; height: 200px; padding: 10px; border-right: 1px solid black; display: flex; align-items: center; justify-content: center;">
        <img src="${courierImage}" alt="Company Logo"
          style="width: 100%; height: 100%; object-fit: contain;" />
      </div>
      <div
        style="font-size: 20px; display: flex; flex-direction: column; text-align: right; justify-content: space-between; align-items: end; width: 100%; padding-right: 10px; padding-top: 10px;">
        <p style="font-size: 24px;">PREPAID</p>
        <p>${createdAt}</p>
      </div>
    </div>


    <div
      style="border-top: 1px solid black; border-bottom: 1px solid black; display: flex; justify-content: space-between;">
      <div style="padding: 10px;">
        <h3 style="margin-bottom: 5mm; font-weight: bold;">RECIPIENT :</h3>
        <p style="font-weight: bold; font-size: 20px;">John Doe</p>
        <p style="font-size: 18px;">
          ${shipment.destination_address.address_line}
          ${shipment.destination_address.landmark}
          ${shipment.destination_address.city}
          ${shipment.destination_address.state}, 
          ${shipment.destination_address.zip_code}
        </p>
        <p style="font-size: 18px;">Contact: +91 ${shipment.recipient_mobile}</p>
      </div>
      <div
        style="display: flex; flex-direction: column; justify-content: space-between; border-left: 1px solid black; font-size: 24px;">
        <p style="height: 50%; padding: 10px; text-align: center; border-bottom: 1px solid black;">
         ${shipment.destination_address.state}
        </p>
        <p style="height:50%; padding: 10px; text-align: center;">
             ${shipment.destination_address.zip_code}
        </p>
      </div>
    </div>

    <div style="text-align: center; padding: 10px; border-bottom: 1px solid black; height:100px;">
      <img src="${barcodeSvg}" alt="Barcode" style="width: 100%; height:100%;" />
    </div>
    <div
      style="text-align: center; padding: 10px; border-bottom: 1px solid black; display: flex; justify-content: center; align-items: center;">
      <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 150px; height: 150px;" />
    </div>

    <div style="padding: 10px; font-size: 18px;">
      <p>If not Delivered so please Return at below address</p>
      <strong>${shipment.user.kyc?.entity_name}</strong>
      <p><strong>Contact :</strong> ${shipment.user.mobile_number}
      </p>
      <p>
        ${shipment.origin_address.address_line}
        ${shipment.origin_address.landmark}
        ${shipment.origin_address.city}
        ${shipment.origin_address.state}, 
        ${shipment.origin_address.zip_code}
      </p>
    </div>

  </div>
</body>

</html>
  `;
};
