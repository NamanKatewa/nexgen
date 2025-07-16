/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
	preset: "ts-jest",
	testEnvironment: "node",
	moduleNameMapper: {
		"^~/(.*)$": "<rootDir>/src/$1",
	},
	testMatch: ["<rootDir>/src/**/*.test.ts"],
};
