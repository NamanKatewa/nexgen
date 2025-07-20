import { TRPCError } from "@trpc/server";
import { calculateInsurancePremium } from "~/lib/insurance";

describe("calculateInsurancePremium", () => {
	// Test cases for mandatory insurance conditions
	it("should throw TRPCError if declaredValue > 49999", () => {
		expect(() => calculateInsurancePremium(50000, true)).toThrow(
			new TRPCError({
				code: "BAD_REQUEST",
				message: "Shipments over ₹49,999 are not accepted.",
			}),
		);
	});

	it("should throw TRPCError if declaredValue > 25000 and insurance not selected", () => {
		expect(() => calculateInsurancePremium(25001, false)).toThrow(
			new TRPCError({
				code: "BAD_REQUEST",
				message:
					"Insurance is mandatory for shipments with actual rate above ₹25,000.",
			}),
		);
	});

	it("should not throw TRPCError if declaredValue is between 5001 and 25000 and insurance not selected", () => {
		const result = calculateInsurancePremium(15000, false);
		expect(result.insurancePremium).toBe(0);
		expect(result.compensationAmount).toBe(0);
	});

	// Test cases for Declared Value Tiers (if isInsuranceSelected is true)
	it("should calculate premium and compensation for declared value ₹1-₹2,499", () => {
		const result = calculateInsurancePremium(2000, true);
		expect(result.insurancePremium).toBe(100);
		expect(result.compensationAmount).toBe(2000); // 100% of declared value
	});

	it("should calculate premium and compensation for declared value ₹2,500-₹5,000", () => {
		const result = calculateInsurancePremium(3000, true);
		expect(result.insurancePremium).toBe(100);
		expect(result.compensationAmount).toBe(2400); // 80% of 3000
	});

	// Test cases for Actual Rate Tiers (if isInsuranceSelected is true and declaredValue > ₹5,000 or not provided)
	it("should calculate premium and compensation for declared value ₹5,001-₹12,999", () => {
		const result = calculateInsurancePremium(6000, true);
		expect(result.insurancePremium).toBeCloseTo(120); // 2% of 6000
		expect(result.compensationAmount).toBeCloseTo(4800); // 80% of 6000
	});

	it("should calculate premium and compensation for declared value ₹13,000-₹21,999", () => {
		// Test at lower bound
		let result = calculateInsurancePremium(13000, true);
		expect(result.insurancePremium).toBeCloseTo(13000 * 0.021);
		expect(result.compensationAmount).toBeCloseTo(13000 * 0.58);

		// Test at upper bound
		result = calculateInsurancePremium(21999, true);
		expect(result.insurancePremium).toBeCloseTo(21999 * 0.029);
		expect(result.compensationAmount).toBeCloseTo(21999 * 0.78);
	});

	it("should calculate premium and compensation for declared value ₹22,000-₹26,999", () => {
		// Test at lower bound
		let result = calculateInsurancePremium(22000, true);
		expect(result.insurancePremium).toBeCloseTo(22000 * 0.03);
		expect(result.compensationAmount).toBeCloseTo(22000 * 0.51);

		// Test at upper bound
		result = calculateInsurancePremium(26999, true);
		expect(result.insurancePremium).toBeCloseTo(26999 * 0.03);
		expect(result.compensationAmount).toBeCloseTo(26999 * 0.55);
	});

	it("should calculate premium and compensation for declared value ₹27,000-₹49,999", () => {
		const result = calculateInsurancePremium(30000, true);
		expect(result.insurancePremium).toBeCloseTo(900); // 3% of 30000
		expect(result.compensationAmount).toBeCloseTo(15000); // 50% of 30000
	});

	it("should return 0 premium and compensation if insurance not selected and not mandatory", () => {
		const result = calculateInsurancePremium(1000, false);
		expect(result.insurancePremium).toBe(0);
		expect(result.compensationAmount).toBe(0);
	});

	it("should handle declaredValue not provided when insurance is selected", () => {
		const result = calculateInsurancePremium(6000, true);
		expect(result.insurancePremium).toBeCloseTo(120);
		expect(result.compensationAmount).toBeCloseTo(4800);
	});
});
