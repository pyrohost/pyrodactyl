import { capitalize } from "@/lib/strings";

describe("@/lib/strings.ts", () => {
	describe("capitalize()", () => {
		it("should capitalize a string", () => {
			expect(capitalize("foo bar")).toBe("Foo bar");
			expect(capitalize("FOOBAR")).toBe("Foobar");
		});

		it("should handle empty strings", () => {
			expect(capitalize("")).toBe("");
		});
	});
});
