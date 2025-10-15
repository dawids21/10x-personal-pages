import { describe, it, expect } from "vitest";
import { checkReservedUrl, parseAndValidateYaml, convertToYaml } from "./pages.service";
import { ReservedUrlError } from "../errors/pages.errors";
import { InvalidYamlError } from "../errors/shared.errors";
import type { PageData } from "@/types";

describe("pages.service", () => {
  describe("checkReservedUrl", () => {
    describe("should accept non-reserved URLs", () => {
      it("should allow simple non-reserved URLs", () => {
        expect(() => checkReservedUrl("mypage")).not.toThrow();
        expect(() => checkReservedUrl("user123")).not.toThrow();
        expect(() => checkReservedUrl("john-doe")).not.toThrow();
      });

      it("should allow URLs with reserved words as substrings", () => {
        expect(() => checkReservedUrl("api-docs")).not.toThrow();
        expect(() => checkReservedUrl("admin-panel")).not.toThrow();
        expect(() => checkReservedUrl("my-dashboard")).not.toThrow();
        expect(() => checkReservedUrl("publicinfo")).not.toThrow();
      });

      it("should allow URLs similar but not identical to reserved words", () => {
        expect(() => checkReservedUrl("apis")).not.toThrow();
        expect(() => checkReservedUrl("authentication")).not.toThrow();
        expect(() => checkReservedUrl("helper")).not.toThrow();
      });
    });

    describe("should reject reserved URLs", () => {
      const reservedUrls = [
        "api",
        "admin",
        "auth",
        "dashboard",
        "static",
        "assets",
        "public",
        "docs",
        "help",
        "terms",
        "privacy",
      ];

      it.each(reservedUrls)("should throw ReservedUrlError for '%s'", (url) => {
        expect(() => checkReservedUrl(url)).toThrow(ReservedUrlError);
        expect(() => checkReservedUrl(url)).toThrow("This URL is reserved and cannot be used");
      });
    });

    describe("should be case-insensitive", () => {
      it("should reject uppercase reserved URLs", () => {
        expect(() => checkReservedUrl("API")).toThrow(ReservedUrlError);
        expect(() => checkReservedUrl("ADMIN")).toThrow(ReservedUrlError);
        expect(() => checkReservedUrl("DASHBOARD")).toThrow(ReservedUrlError);
      });

      it("should reject mixed-case reserved URLs", () => {
        expect(() => checkReservedUrl("Api")).toThrow(ReservedUrlError);
        expect(() => checkReservedUrl("Admin")).toThrow(ReservedUrlError);
        expect(() => checkReservedUrl("DashBoard")).toThrow(ReservedUrlError);
      });
    });
  });

  describe("parseAndValidateYaml", () => {
    describe("should parse and validate valid YAML", () => {
      it("should parse valid YAML with all fields", async () => {
        const yaml = `
name: John Doe
bio: Software Engineer with 10 years of experience
contact_info:
  - label: Email
    value: john@example.com
  - label: GitHub
    value: github.com/johndoe
experience:
  - job_title: Senior Developer
    job_description: Led development of key features
  - job_title: Junior Developer
education:
  - school_title: MIT
    school_description: Computer Science Degree
skills:
  - name: JavaScript
  - name: TypeScript
`;

        const result = await parseAndValidateYaml(yaml);

        expect(result).toMatchObject({
          name: "John Doe",
          bio: "Software Engineer with 10 years of experience",
          contact_info: [
            { label: "Email", value: "john@example.com" },
            { label: "GitHub", value: "github.com/johndoe" },
          ],
          experience: [
            { job_title: "Senior Developer", job_description: "Led development of key features" },
            { job_title: "Junior Developer" },
          ],
          education: [{ school_title: "MIT", school_description: "Computer Science Degree" }],
          skills: [{ name: "JavaScript" }, { name: "TypeScript" }],
        });
      });

      it("should parse minimal valid YAML (only required fields)", async () => {
        const yaml = `
name: Jane Smith
bio: Designer and developer
`;

        const result = await parseAndValidateYaml(yaml);

        expect(result).toEqual({
          name: "Jane Smith",
          bio: "Designer and developer",
        });
      });

      it("should handle optional fields when empty arrays", async () => {
        const yaml = `
name: Test User
bio: Test bio
contact_info: []
experience: []
education: []
skills: []
`;

        const result = await parseAndValidateYaml(yaml);

        expect(result).toMatchObject({
          name: "Test User",
          bio: "Test bio",
          contact_info: [],
          experience: [],
          education: [],
          skills: [],
        });
      });
    });

    describe("should throw InvalidYamlError for invalid YAML syntax", () => {
      it("should throw for malformed YAML", async () => {
        const yaml = `[invalid: yaml: structure:`;

        await expect(parseAndValidateYaml(yaml)).rejects.toThrow(InvalidYamlError);
        await expect(parseAndValidateYaml(yaml)).rejects.toThrow(/Failed to parse YAML/);
      });

      it("should throw for duplicate keys in YAML", async () => {
        const yaml = `
name: John
name: Jane
bio: Test
`;

        await expect(parseAndValidateYaml(yaml)).rejects.toThrow(InvalidYamlError);
        await expect(parseAndValidateYaml(yaml)).rejects.toThrow(/duplicated mapping key/);
      });
    });

    describe("should throw InvalidYamlError for missing required fields", () => {
      it("should throw for missing name field", async () => {
        const yaml = `
bio: Just a bio
`;

        const error = await parseAndValidateYaml(yaml).catch((e) => e);

        expect(error).toBeInstanceOf(InvalidYamlError);
        expect(error.message).toBe("The provided data is invalid.");
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: "name",
              issue: "Required",
            }),
          ])
        );
      });

      it("should throw for missing bio field", async () => {
        const yaml = `
name: John Doe
`;

        const error = await parseAndValidateYaml(yaml).catch((e) => e);

        expect(error).toBeInstanceOf(InvalidYamlError);
        expect(error.message).toBe("The provided data is invalid.");
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: "bio",
              issue: "Required",
            }),
          ])
        );
      });

      it("should throw for both missing required fields", async () => {
        const yaml = `
contact_info: []
`;

        const error = await parseAndValidateYaml(yaml).catch((e) => e);

        expect(error).toBeInstanceOf(InvalidYamlError);
        expect(error.details).toHaveLength(2);
      });
    });

    describe("should throw InvalidYamlError for field length violations", () => {
      it("should throw for name exceeding 100 characters", async () => {
        const longName = "a".repeat(101);
        const yaml = `
name: ${longName}
bio: Valid bio
`;

        const error = await parseAndValidateYaml(yaml).catch((e) => e);

        expect(error).toBeInstanceOf(InvalidYamlError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: "name",
              issue: "Name must not exceed 100 characters",
            }),
          ])
        );
      });

      it("should throw for bio exceeding 500 characters", async () => {
        const longBio = "a".repeat(501);
        const yaml = `
name: John Doe
bio: ${longBio}
`;

        const error = await parseAndValidateYaml(yaml).catch((e) => e);

        expect(error).toBeInstanceOf(InvalidYamlError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: "bio",
              issue: "Bio must not exceed 500 characters",
            }),
          ])
        );
      });

      it("should throw for contact label exceeding 50 characters", async () => {
        const longLabel = "a".repeat(51);
        const yaml = `
name: John Doe
bio: Valid bio
contact_info:
  - label: ${longLabel}
    value: test@example.com
`;

        const error = await parseAndValidateYaml(yaml).catch((e) => e);

        expect(error).toBeInstanceOf(InvalidYamlError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: expect.stringContaining("contact_info"),
              issue: "Label must not exceed 50 characters",
            }),
          ])
        );
      });

      it("should throw for contact value exceeding 100 characters", async () => {
        const longValue = "a".repeat(101);
        const yaml = `
name: John Doe
bio: Valid bio
contact_info:
  - label: Email
    value: ${longValue}
`;

        const error = await parseAndValidateYaml(yaml).catch((e) => e);

        expect(error).toBeInstanceOf(InvalidYamlError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: expect.stringContaining("contact_info"),
              issue: "Value must not exceed 100 characters",
            }),
          ])
        );
      });
    });

    describe("should throw InvalidYamlError for invalid array items", () => {
      it("should throw for malformed contact_info", async () => {
        const yaml = `
name: John Doe
bio: Valid bio
contact_info:
  - label: Email
`;

        const error = await parseAndValidateYaml(yaml).catch((e) => e);

        expect(error).toBeInstanceOf(InvalidYamlError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: expect.stringContaining("contact_info"),
            }),
          ])
        );
      });

      it("should throw for malformed experience", async () => {
        const yaml = `
name: John Doe
bio: Valid bio
experience:
  - job_description: Missing job_title
`;

        const error = await parseAndValidateYaml(yaml).catch((e) => e);

        expect(error).toBeInstanceOf(InvalidYamlError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: expect.stringContaining("experience"),
            }),
          ])
        );
      });

      it("should throw for malformed education", async () => {
        const yaml = `
name: John Doe
bio: Valid bio
education:
  - school_description: Missing school_title
`;

        const error = await parseAndValidateYaml(yaml).catch((e) => e);

        expect(error).toBeInstanceOf(InvalidYamlError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: expect.stringContaining("education"),
            }),
          ])
        );
      });

      it("should throw for malformed skills", async () => {
        const yaml = `
name: John Doe
bio: Valid bio
skills:
  - skill: Wrong field name
`;

        const error = await parseAndValidateYaml(yaml).catch((e) => e);

        expect(error).toBeInstanceOf(InvalidYamlError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: expect.stringContaining("skills"),
            }),
          ])
        );
      });
    });

    describe("should format Zod errors into detailed ValidationIssue array", () => {
      it("should provide detailed field paths for nested errors", async () => {
        const yaml = `
name: John Doe
bio: Valid bio
experience:
  - job_title: ${"a".repeat(101)}
`;

        const error = await parseAndValidateYaml(yaml).catch((e) => e);

        expect(error).toBeInstanceOf(InvalidYamlError);
        expect(error.details[0]).toHaveProperty("field");
        expect(error.details[0]).toHaveProperty("issue");
        expect(error.details[0].field).toContain("experience");
      });

      it("should format multiple errors correctly", async () => {
        const yaml = `
name: ${"a".repeat(101)}
bio: ${"b".repeat(501)}
`;

        const error = await parseAndValidateYaml(yaml).catch((e) => e);

        expect(error).toBeInstanceOf(InvalidYamlError);
        expect(error.details).toHaveLength(2);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: "name" }),
            expect.objectContaining({ field: "bio" }),
          ])
        );
      });
    });
  });

  describe("convertToYaml", () => {
    describe("should convert PageData to valid YAML string", () => {
      it("should convert complete PageData object", () => {
        const pageData: PageData = {
          name: "John Doe",
          bio: "Software Engineer",
          contact_info: [
            { label: "Email", value: "john@example.com" },
            { label: "GitHub", value: "github.com/johndoe" },
          ],
          experience: [
            { job_title: "Senior Developer", job_description: "Led team" },
            { job_title: "Junior Developer" },
          ],
          education: [{ school_title: "MIT", school_description: "CS Degree" }],
          skills: [{ name: "JavaScript" }, { name: "TypeScript" }],
        };

        const yaml = convertToYaml(pageData);

        expect(yaml).toContain("name: John Doe");
        expect(yaml).toContain("bio: Software Engineer");
        expect(yaml).toContain("Email");
        expect(yaml).toContain("john@example.com");
        expect(yaml).toContain("Senior Developer");
      });

      it("should convert minimal PageData object", () => {
        const pageData: PageData = {
          name: "Jane Smith",
          bio: "Designer",
        };

        const yaml = convertToYaml(pageData);

        expect(yaml).toContain("name: Jane Smith");
        expect(yaml).toContain("bio: Designer");
      });
    });

    describe("should handle special characters in strings", () => {
      it("should handle quotes in strings", () => {
        const pageData: PageData = {
          name: 'John "Johnny" Doe',
          bio: "He's a developer",
        };

        const yaml = convertToYaml(pageData);

        expect(yaml).toBeDefined();
        expect(yaml).toContain("John");
        expect(yaml).toContain("Johnny");
      });

      it("should handle newlines in strings", () => {
        const pageData: PageData = {
          name: "John Doe",
          bio: "Line 1\nLine 2\nLine 3",
        };

        const yaml = convertToYaml(pageData);

        expect(yaml).toBeDefined();
        expect(yaml).toContain("John Doe");
      });

      it("should handle special YAML characters", () => {
        const pageData: PageData = {
          name: "John: Doe & Associates",
          bio: "Expert @ development | design",
        };

        const yaml = convertToYaml(pageData);

        expect(yaml).toBeDefined();
      });
    });

    describe("should handle optional fields", () => {
      it("should handle undefined optional fields", () => {
        const pageData: PageData = {
          name: "John Doe",
          bio: "Developer",
        };

        const yaml = convertToYaml(pageData);

        expect(yaml).toContain("name: John Doe");
        expect(yaml).toContain("bio: Developer");
      });

      it("should handle empty arrays", () => {
        const pageData: PageData = {
          name: "John Doe",
          bio: "Developer",
          contact_info: [],
          experience: [],
          education: [],
          skills: [],
        };

        const yaml = convertToYaml(pageData);

        expect(yaml).toContain("name: John Doe");
        expect(yaml).toContain("contact_info: []");
      });
    });

    describe("should handle nested objects", () => {
      it("should properly format contact_info array", () => {
        const pageData: PageData = {
          name: "John Doe",
          bio: "Developer",
          contact_info: [
            { label: "Email", value: "john@example.com" },
            { label: "Phone", value: "+1234567890" },
          ],
        };

        const yaml = convertToYaml(pageData);

        expect(yaml).toContain("contact_info:");
        expect(yaml).toContain("label: Email");
        expect(yaml).toContain("value: john@example.com");
        expect(yaml).toContain("label: Phone");
      });

      it("should properly format experience array with optional descriptions", () => {
        const pageData: PageData = {
          name: "John Doe",
          bio: "Developer",
          experience: [
            { job_title: "Senior Dev", job_description: "Led projects" },
            { job_title: "Junior Dev" },
          ],
        };

        const yaml = convertToYaml(pageData);

        expect(yaml).toContain("experience:");
        expect(yaml).toContain("job_title: Senior Dev");
        expect(yaml).toContain("job_description: Led projects");
        expect(yaml).toContain("job_title: Junior Dev");
      });
    });

    describe("should produce YAML that can be parsed back", () => {
      it("should create round-trip compatible YAML for complete data", async () => {
        const originalData: PageData = {
          name: "John Doe",
          bio: "Software Engineer with 10 years of experience",
          contact_info: [{ label: "Email", value: "john@example.com" }],
          experience: [{ job_title: "Senior Developer", job_description: "Team lead" }],
          education: [{ school_title: "MIT" }],
          skills: [{ name: "JavaScript" }],
        };

        const yaml = convertToYaml(originalData);
        const parsedData = await parseAndValidateYaml(yaml);

        expect(parsedData).toEqual(originalData);
      });

      it("should create round-trip compatible YAML for minimal data", async () => {
        const originalData: PageData = {
          name: "Jane Smith",
          bio: "Designer",
        };

        const yaml = convertToYaml(originalData);
        const parsedData = await parseAndValidateYaml(yaml);

        expect(parsedData).toEqual(originalData);
      });
    });
  });
});
