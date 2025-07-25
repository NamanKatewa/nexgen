export const entityTypes = [
	"Individual",
	"SelfEmployement",
	"ProprietorshipFirm",
	"LimitedLiabilityParternship",
	"PrivateLimitedCompany",
	"PublicLimitedCompany",
	"PartnershipFirm",
];

export const paymentStatusTypes = ["Pending", "Completed", "Failed"];
export const transactionTypes = ["Credit", "Debit"];

export const DISPLAY_SHIPMENT_STATUSES = [
	"DELIVERED",
	"IN_TRANSIT",
	"UNDELIVERED",
	"RTO",
	"RTO_DELIVERED",
	"CANCELLED",
	"SHIPMENT_BOOKED",
	"PICKED_UP",
	"OUT_FOR_DELIVERY",
	"OUT_OF_DELIVERY_AREA",
	"DELIVERY_DELAYED",
];

import { SHIPMENT_STATUS } from "@prisma/client";

export const NDR_SHIPMENT_STATUSES = [
	SHIPMENT_STATUS.UNDELIVERED,
	SHIPMENT_STATUS.RTO,
	SHIPMENT_STATUS.CANCELLED,
	SHIPMENT_STATUS.ON_HOLD,
	SHIPMENT_STATUS.NETWORK_ISSUE,
	SHIPMENT_STATUS.DELIVERY_NEXT_DAY,
	SHIPMENT_STATUS.NOT_FOUND_INCORRECT,
	SHIPMENT_STATUS.OUT_OF_DELIVERY_AREA,
	SHIPMENT_STATUS.OTHERS,
	SHIPMENT_STATUS.DELIVERY_DELAYED,
	SHIPMENT_STATUS.CUSTOMER_REFUSED,
	SHIPMENT_STATUS.CONSIGNEE_UNAVAILABLE,
	SHIPMENT_STATUS.DELIVERY_EXCEPTION,
	SHIPMENT_STATUS.DELIVERY_RESCHEDULED,
	SHIPMENT_STATUS.COD_PAYMENT_NOT_READY,
	SHIPMENT_STATUS.SHIPMENT_LOST,
	SHIPMENT_STATUS.PICKUP_FAILED,
	SHIPMENT_STATUS.PICKUP_CANCELLED,
	SHIPMENT_STATUS.FUTURE_DELIVERY_REQUESTED,
	SHIPMENT_STATUS.ADDRESS_INCORRECT,
	SHIPMENT_STATUS.DELIVERY_ATTEMPTED,
	SHIPMENT_STATUS.PENDING_UNDELIVERED,
	SHIPMENT_STATUS.DELIVERY_ATTEMPTED_PREMISES_CLOSED,
	SHIPMENT_STATUS.RETURN_REQUEST_CANCELLED,
	SHIPMENT_STATUS.RETURN_REQUEST_CLOSED,
	SHIPMENT_STATUS.RETURN_DELIVERED,
	SHIPMENT_STATUS.RETURN_IN_TRANSIT,
	SHIPMENT_STATUS.RETURN_OUT_FOR_PICKUP,
	SHIPMENT_STATUS.RETURN_SHIPMENT_PICKED_UP,
	SHIPMENT_STATUS.RETURN_PICKUP_RESCHEDULED,
	SHIPMENT_STATUS.RETURN_PICKUP_DELAYED,
	SHIPMENT_STATUS.RETURN_PICKUP_SCHEDULED,
	SHIPMENT_STATUS.RETURN_OUT_FOR_DELIVERY,
	SHIPMENT_STATUS.RETURN_UNDELIVERED,
	SHIPMENT_STATUS.REVERSE_PICKUP_EXCEPTION,
];

export const SHIPMENT_STATUS_MAP = {
	DELIVERED: {
		displayName: "Delivered",
		color: "bg-green-200 text-green-800",
	},
	IN_TRANSIT: {
		displayName: "In Transit",
		color: "bg-yellow-200 text-yellow-800",
	},
	UNDELIVERED: {
		displayName: "Undelivered",
		color: "bg-yellow-200 text-yellow-800",
	},
	RTO: {
		displayName: "RTO",
		color: "bg-yellow-200 text-yellow-800",
	},
	RTO_DELIVERED: {
		displayName: "RTO Delivered",
		color: "bg-green-200 text-green-800",
	},
	CANCELLED: {
		displayName: "Cancelled",
		color: "bg-red-200 text-red-800",
	},
	SHIPMENT_BOOKED: {
		displayName: "Shipment Booked",
		color: "bg-yellow-200 text-yellow-800",
	},
	PICKED_UP: {
		displayName: "Picked Up",
		color: "bg-yellow-200 text-yellow-800",
	},
	ON_HOLD: {
		displayName: "On Hold",
		color: "bg-yellow-200 text-yellow-800",
	},
	OUT_FOR_DELIVERY: {
		displayName: "Out For Delivery",
		color: "bg-yellow-200 text-yellow-800",
	},
	NETWORK_ISSUE: {
		displayName: "Network Issue",
		color: "bg-yellow-200 text-yellow-800",
	},
	DELIVERY_NEXT_DAY: {
		displayName: "Delivery Next Day",
		color: "bg-yellow-200 text-yellow-800",
	},
	NOT_FOUND_INCORRECT: {
		displayName: "Not Found/Incorrect",
		color: "bg-yellow-200 text-yellow-800",
	},
	OUT_OF_DELIVERY_AREA: {
		displayName: "Out Of Delivery Area",
		color: "bg-yellow-200 text-yellow-800",
	},
	OTHERS: {
		displayName: "Others",
		color: "bg-yellow-200 text-yellow-800",
	},
	DELIVERY_DELAYED: {
		displayName: "Delivery Delayed",
		color: "bg-yellow-200 text-yellow-800",
	},
	CUSTOMER_REFUSED: {
		displayName: "Customer Refused",
		color: "bg-yellow-200 text-yellow-800",
	},
	CONSIGNEE_UNAVAILABLE: {
		displayName: "Consignee Unavailable",
		color: "bg-yellow-200 text-yellow-800",
	},
	DELIVERY_EXCEPTION: {
		displayName: "Delivery Exception",
		color: "bg-yellow-200 text-yellow-800",
	},
	DELIVERY_RESCHEDULED: {
		displayName: "Delivery Rescheduled",
		color: "bg-yellow-200 text-yellow-800",
	},
	COD_PAYMENT_NOT_READY: {
		displayName: "COD Payment Not Ready",
		color: "bg-yellow-200 text-yellow-800",
	},
	SHIPMENT_LOST: {
		displayName: "Shipment Lost",
		color: "bg-red-200 text-red-800",
	},
	PICKUP_FAILED: {
		displayName: "Pickup Failed",
		color: "bg-red-200 text-red-800",
	},
	PICKUP_CANCELLED: {
		displayName: "Pickup Cancelled",
		color: "bg-red-200 text-red-800",
	},
	FUTURE_DELIVERY_REQUESTED: {
		displayName: "Future Delivery Requested",
		color: "bg-yellow-200 text-yellow-800",
	},
	ADDRESS_INCORRECT: {
		displayName: "Address Incorrect",
		color: "bg-yellow-200 text-yellow-800",
	},
	DELIVERY_ATTEMPTED: {
		displayName: "Delivery Attempted",
		color: "bg-yellow-200 text-yellow-800",
	},
	PENDING_UNDELIVERED: {
		displayName: "Pending Undelivered",
		color: "bg-yellow-200 text-yellow-800",
	},
	DELIVERY_ATTEMPTED_PREMISES_CLOSED: {
		displayName: "Delivery Attempted Premises Closed",
		color: "bg-yellow-200 text-yellow-800",
	},
	OUT_FOR_PICKUP: {
		displayName: "Out For Pickup",
		color: "bg-yellow-200 text-yellow-800",
	},
	RETURN_REQUEST_CANCELLED: {
		displayName: "Return Request Cancelled",
		color: "bg-orange-200 text-orange-800",
	},
	RETURN_REQUEST_CLOSED: {
		displayName: "Return Request Closed",
		color: "bg-orange-200 text-orange-800",
	},
	RETURN_DELIVERED: {
		displayName: "Return Delivered",
		color: "bg-orange-200 text-orange-800",
	},
	RETURN_IN_TRANSIT: {
		displayName: "Return In Transit",
		color: "bg-orange-200 text-orange-800",
	},
	RETURN_OUT_FOR_PICKUP: {
		displayName: "Return Out For Pickup",
		color: "bg-orange-200 text-orange-800",
	},
	RETURN_SHIPMENT_PICKED_UP: {
		displayName: "Return Shipment Picked Up",
		color: "bg-orange-200 text-orange-800",
	},
	RETURN_PICKUP_RESCHEDULED: {
		displayName: "Return Pickup Rescheduled",
		color: "bg-orange-200 text-orange-800",
	},
	RETURN_PICKUP_DELAYED: {
		displayName: "Return Pickup Delayed",
		color: "bg-orange-200 text-orange-800",
	},
	RETURN_PICKUP_SCHEDULED: {
		displayName: "Return Pickup Scheduled",
		color: "bg-orange-200 text-orange-800",
	},
	RETURN_OUT_FOR_DELIVERY: {
		displayName: "Return Out For Delivery",
		color: "bg-orange-200 text-orange-800",
	},
	RETURN_UNDELIVERED: {
		displayName: "Return Undelivered",
		color: "bg-red-200 text-red-800",
	},
	REVERSE_PICKUP_EXCEPTION: {
		displayName: "Reverse Pickup Exception",
		color: "bg-red-200 text-red-800",
	},
};
