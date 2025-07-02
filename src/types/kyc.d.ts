import type { ADDRESS_TYPE, ENTITY_TYPE, KYC_STATUS } from "@prisma/client";

export interface KycItem {
	kyc_id: string;
	user_id: string;
	user: {
		email: string;
	};
	entity_name: string | null;
	entity_type: ENTITY_TYPE | null;
	website_url: string | null;
	address_id: string | null;
	aadhar_number: string;
	aadhar_image_front: string;
	aadhar_image_back: string;
	pan_number: string;
	pan_image_front: string;
	pan_image_back: string;
	gst: boolean;
	kyc_status: KYC_STATUS;
	submission_date: Date | null;
	verification_date: Date | null;
	verified_by_user_id: string | null;
	rejection_reason: string | null;
	address: PrismaAddress | null;
}

export interface PrismaAddress {
	address_id: string;
	user_id: string;
	name: string;
	address_line: string;
	city: string;
	state: string;
	zip_code: number;
	type: ADDRESS_TYPE;
}
