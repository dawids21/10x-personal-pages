import { describe, it, expect } from "vitest";
import { parseAndValidateProjectYaml, convertToYaml, generateProjectSlug } from "./projects.service";
import { InvalidYamlError } from "../errors/shared.errors";
import type { ProjectData } from "@/types";

describe("projects.service", () => {
  describe("generateProjectSlug", () => {
    describe("should convert to lowercase", () => {
      it("should convert uppercase to lowercase", () => {
        expect(generateProjectSlug("MyProject")).toBe("myproject");
      });

      it("should convert mixed case to lowercase", () => {
        expect(generateProjectSlug("MyAwesomeProject")).toBe("myawesomeproject");
      });
    });

    describe("should replace spaces with hyphens", () => {
      it("should replace single spaces", () => {
        expect(generateProjectSlug("My Project")).toBe("my-project");
      });

      it("should replace multiple spaces", () => {
        expect(generateProjectSlug("My Awesome Project")).toBe("my-awesome-project");
      });
    });

    describe("should remove special characters", () => {
      it("should remove common special characters", () => {
        expect(generateProjectSlug("My @Project!")).toBe("my-project");
      });

      it("should remove punctuation", () => {
        expect(generateProjectSlug("My, Project.")).toBe("my-project");
      });

      it("should remove symbols", () => {
        expect(generateProjectSlug("Project #2024")).toBe("project-2024");
      });
    });

    describe("should replace consecutive hyphens with single hyphen", () => {
      it("should replace double hyphens", () => {
        expect(generateProjectSlug("My--Project")).toBe("my-project");
      });

      it("should replace multiple consecutive hyphens", () => {
        expect(generateProjectSlug("My---Project")).toBe("my-project");
      });

      it("should handle hyphens from special character removal", () => {
        expect(generateProjectSlug("My @@ Project")).toBe("my-project");
      });
    });

    describe("should remove leading/trailing hyphens", () => {
      it("should remove leading hyphen", () => {
        expect(generateProjectSlug("-MyProject")).toBe("myproject");
      });

      it("should remove trailing hyphen", () => {
        expect(generateProjectSlug("MyProject-")).toBe("myproject");
      });

      it("should remove both leading and trailing hyphens", () => {
        expect(generateProjectSlug("-MyProject-")).toBe("myproject");
      });
    });

    describe("should preserve numbers", () => {
      it("should keep numbers in the slug", () => {
        expect(generateProjectSlug("Project 2024")).toBe("project-2024");
      });

      it("should keep numbers at the start", () => {
        expect(generateProjectSlug("2024 Project")).toBe("2024-project");
      });
    });

    describe("should handle edge cases", () => {
      it("should handle strings with only special characters resulting in empty slug", () => {
        expect(generateProjectSlug("!@#$% ^&*()")).toBe("");
      });

      it("should handle trimming whitespace", () => {
        expect(generateProjectSlug("  MyProject  ")).toBe("myproject");
      });

      it("should handle underscores (preserve them)", () => {
        expect(generateProjectSlug("my_project")).toBe("my_project");
      });

      it("should handle combination of all transformations", () => {
        expect(generateProjectSlug("  My @#Awesome---Project!! 2024  ")).toBe("my-awesome-project-2024");
      });
    });
  });

  describe("parseAndValidateProjectYaml", () => {
    describe("should parse and validate valid YAML", () => {
      it("should parse valid YAML with all fields", async () => {
        const yaml = `
name: My Awesome Project
description: A comprehensive web application for managing tasks
tech_stack: React, Node.js, PostgreSQL
prod_link: https://myproject.com
start_date: 2024-01-15T00:00:00.000Z
end_date: 2024-12-31T00:00:00.000Z
`;

        const result = await parseAndValidateProjectYaml(yaml);

        expect(result).toMatchObject({
          name: "My Awesome Project",
          description: "A comprehensive web application for managing tasks",
          tech_stack: "React, Node.js, PostgreSQL",
          prod_link: "https://myproject.com",
        });
        expect(result.start_date).toBeInstanceOf(Date);
        expect(result.end_date).toBeInstanceOf(Date);
      });

      it("should parse minimal valid YAML (only required fields)", async () => {
        const yaml = `
name: Simple Project
description: A simple project description
`;

        const result = await parseAndValidateProjectYaml(yaml);

        expect(result).toEqual({
          name: "Simple Project",
          description: "A simple project description",
        });
      });

      it("should handle optional fields when provided individually", async () => {
        const yaml1 = `
name: Project A
description: Test description
tech_stack: JavaScript
`;

        const result1 = await parseAndValidateProjectYaml(yaml1);
        expect(result1.tech_stack).toBe("JavaScript");

        const yaml2 = `
name: Project B
description: Test description
prod_link: https://example.com
`;

        const result2 = await parseAndValidateProjectYaml(yaml2);
        expect(result2.prod_link).toBe("https://example.com");
      });
    });

    describe("should throw InvalidYamlError for invalid YAML syntax", () => {
      it("should throw for invalid YAML structure", async () => {
        const yaml = `[invalid: yaml: structure:`;

        await expect(parseAndValidateProjectYaml(yaml)).rejects.toThrow(InvalidYamlError);
        await expect(parseAndValidateProjectYaml(yaml)).rejects.toThrow(/Failed to parse YAML/);
      });

      it("should throw for unclosed brackets in YAML", async () => {
        const yaml = `
name: Test [unclosed
description: Valid
`;

        const result = await parseAndValidateProjectYaml(yaml);
        expect(result.name).toBe("Test [unclosed");
      });
    });

    describe("should throw InvalidYamlError for missing required fields", () => {
      it("should throw for missing name field", async () => {
        const yaml = `
description: Just a description
`;

        const error = await parseAndValidateProjectYaml(yaml).catch((e) => e);

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

      it("should throw for missing description field", async () => {
        const yaml = `
name: Project Name
`;

        const error = await parseAndValidateProjectYaml(yaml).catch((e) => e);

        expect(error).toBeInstanceOf(InvalidYamlError);
        expect(error.message).toBe("The provided data is invalid.");
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: "description",
              issue: "Required",
            }),
          ])
        );
      });

      it("should throw for both missing required fields", async () => {
        const yaml = `
tech_stack: React
`;

        const error = await parseAndValidateProjectYaml(yaml).catch((e) => e);

        expect(error).toBeInstanceOf(InvalidYamlError);
        expect(error.details).toHaveLength(2);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: "name" }),
            expect.objectContaining({ field: "description" }),
          ])
        );
      });
    });

    describe("should throw InvalidYamlError for field length violations", () => {
      it("should throw for name exceeding 100 characters", async () => {
        const longName = "a".repeat(101);
        const yaml = `
name: ${longName}
description: Valid description
`;

        const error = await parseAndValidateProjectYaml(yaml).catch((e) => e);

        expect(error).toBeInstanceOf(InvalidYamlError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: "name",
              issue: "Project name must not exceed 100 characters",
            }),
          ])
        );
      });

      it("should throw for description exceeding 500 characters", async () => {
        const longDescription = "a".repeat(501);
        const yaml = `
name: Valid Name
description: ${longDescription}
`;

        const error = await parseAndValidateProjectYaml(yaml).catch((e) => e);

        expect(error).toBeInstanceOf(InvalidYamlError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: "description",
              issue: "Description must not exceed 500 characters",
            }),
          ])
        );
      });

      it("should throw for tech_stack exceeding 500 characters", async () => {
        const longTechStack = "a".repeat(501);
        const yaml = `
name: Valid Name
description: Valid description
tech_stack: ${longTechStack}
`;

        const error = await parseAndValidateProjectYaml(yaml).catch((e) => e);

        expect(error).toBeInstanceOf(InvalidYamlError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: "tech_stack",
              issue: "Tech stack must not exceed 500 characters",
            }),
          ])
        );
      });

      it("should throw for prod_link exceeding 100 characters", async () => {
        const longLink = "https://" + "a".repeat(100);
        const yaml = `
name: Valid Name
description: Valid description
prod_link: ${longLink}
`;

        const error = await parseAndValidateProjectYaml(yaml).catch((e) => e);

        expect(error).toBeInstanceOf(InvalidYamlError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: "prod_link",
              issue: "Production link must not exceed 100 characters",
            }),
          ])
        );
      });
    });

    describe("should validate date objects", () => {
      it("should accept valid date objects", async () => {
        const yaml = `
name: Project
description: Test project
start_date: 2024-01-01T00:00:00.000Z
end_date: 2024-12-31T00:00:00.000Z
`;

        const result = await parseAndValidateProjectYaml(yaml);

        expect(result.start_date).toBeInstanceOf(Date);
        expect(result.end_date).toBeInstanceOf(Date);
      });

      it("should accept only start_date", async () => {
        const yaml = `
name: Project
description: Test project
start_date: 2024-01-01T00:00:00.000Z
`;

        const result = await parseAndValidateProjectYaml(yaml);

        expect(result.start_date).toBeInstanceOf(Date);
        expect(result.end_date).toBeUndefined();
      });

      it("should accept only end_date", async () => {
        const yaml = `
name: Project
description: Test project
end_date: 2024-12-31T00:00:00.000Z
`;

        const result = await parseAndValidateProjectYaml(yaml);

        expect(result.start_date).toBeUndefined();
        expect(result.end_date).toBeInstanceOf(Date);
      });
    });

    describe("should throw InvalidYamlError when end_date < start_date", () => {
      it("should throw when end_date is before start_date", async () => {
        const yaml = `
name: Project
description: Test project
start_date: 2024-12-31T00:00:00.000Z
end_date: 2024-01-01T00:00:00.000Z
`;

        const error = await parseAndValidateProjectYaml(yaml).catch((e) => e);

        expect(error).toBeInstanceOf(InvalidYamlError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: "end_date",
              issue: "End date must be after or equal to start date",
            }),
          ])
        );
      });

      it("should accept when end_date equals start_date", async () => {
        const yaml = `
name: Project
description: Test project
start_date: 2024-06-15T00:00:00.000Z
end_date: 2024-06-15T00:00:00.000Z
`;

        const result = await parseAndValidateProjectYaml(yaml);

        expect(result.start_date).toBeInstanceOf(Date);
        expect(result.end_date).toBeInstanceOf(Date);
        expect(result.start_date?.getTime()).toBe(result.end_date?.getTime());
      });
    });

    describe("should format Zod errors into detailed ValidationIssue array", () => {
      it("should provide detailed field paths for errors", async () => {
        const yaml = `
name: ${"a".repeat(101)}
description: Valid description
`;

        const error = await parseAndValidateProjectYaml(yaml).catch((e) => e);

        expect(error).toBeInstanceOf(InvalidYamlError);
        expect(error.details[0]).toHaveProperty("field");
        expect(error.details[0]).toHaveProperty("issue");
        expect(error.details[0].field).toBe("name");
      });

      it("should format multiple errors correctly", async () => {
        const yaml = `
name: ${"a".repeat(101)}
description: ${"b".repeat(501)}
`;

        const error = await parseAndValidateProjectYaml(yaml).catch((e) => e);

        expect(error).toBeInstanceOf(InvalidYamlError);
        expect(error.details).toHaveLength(2);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: "name" }),
            expect.objectContaining({ field: "description" }),
          ])
        );
      });
    });
  });

  describe("convertToYaml", () => {
    describe("should convert ProjectData to valid YAML string", () => {
      it("should convert complete ProjectData object", () => {
        const projectData: ProjectData = {
          name: "My Awesome Project",
          description: "A comprehensive web application",
          tech_stack: "React, Node.js, PostgreSQL",
          prod_link: "https://myproject.com",
          start_date: new Date("2024-01-15"),
          end_date: new Date("2024-12-31"),
        };

        const yaml = convertToYaml(projectData);

        expect(yaml).toContain("name: My Awesome Project");
        expect(yaml).toContain("description: A comprehensive web application");
        expect(yaml).toContain("tech_stack: React, Node.js, PostgreSQL");
        expect(yaml).toContain("prod_link: https://myproject.com");
        expect(yaml).toContain("start_date:");
        expect(yaml).toContain("end_date:");
      });

      it("should convert minimal ProjectData object", () => {
        const projectData: ProjectData = {
          name: "Simple Project",
          description: "A simple description",
        };

        const yaml = convertToYaml(projectData);

        expect(yaml).toContain("name: Simple Project");
        expect(yaml).toContain("description: A simple description");
      });
    });

    describe("should handle special characters in strings", () => {
      it("should handle quotes in strings", () => {
        const projectData: ProjectData = {
          name: 'Project "Alpha"',
          description: "It's a great project",
        };

        const yaml = convertToYaml(projectData);

        expect(yaml).toBeDefined();
        expect(yaml).toContain("Alpha");
      });

      it("should handle newlines in strings", () => {
        const projectData: ProjectData = {
          name: "Multi-line Project",
          description: "Line 1\nLine 2\nLine 3",
        };

        const yaml = convertToYaml(projectData);

        expect(yaml).toBeDefined();
        expect(yaml).toContain("Multi-line Project");
      });

      it("should handle special YAML characters", () => {
        const projectData: ProjectData = {
          name: "Project: Advanced",
          description: "Using @ and | symbols",
        };

        const yaml = convertToYaml(projectData);

        expect(yaml).toBeDefined();
      });
    });

    describe("should handle optional fields", () => {
      it("should handle undefined optional fields", () => {
        const projectData: ProjectData = {
          name: "Basic Project",
          description: "Basic description",
        };

        const yaml = convertToYaml(projectData);

        expect(yaml).toContain("name: Basic Project");
        expect(yaml).toContain("description: Basic description");
        expect(yaml).not.toContain("tech_stack");
        expect(yaml).not.toContain("prod_link");
      });

      it("should include optional fields when provided", () => {
        const projectData: ProjectData = {
          name: "Project",
          description: "Description",
          tech_stack: "TypeScript",
        };

        const yaml = convertToYaml(projectData);

        expect(yaml).toContain("tech_stack: TypeScript");
      });
    });

    describe("should handle Date objects correctly", () => {
      it("should format Date objects in YAML", () => {
        const projectData: ProjectData = {
          name: "Project",
          description: "Description",
          start_date: new Date("2024-01-15T00:00:00.000Z"),
          end_date: new Date("2024-12-31T00:00:00.000Z"),
        };

        const yaml = convertToYaml(projectData);

        expect(yaml).toContain("start_date:");
        expect(yaml).toContain("end_date:");
        expect(yaml).toContain("2024");
      });

      it("should handle only start_date", () => {
        const projectData: ProjectData = {
          name: "Project",
          description: "Description",
          start_date: new Date("2024-01-15"),
        };

        const yaml = convertToYaml(projectData);

        expect(yaml).toContain("start_date:");
        expect(yaml).not.toContain("end_date:");
      });

      it("should handle only end_date", () => {
        const projectData: ProjectData = {
          name: "Project",
          description: "Description",
          end_date: new Date("2024-12-31"),
        };

        const yaml = convertToYaml(projectData);

        expect(yaml).toContain("end_date:");
        expect(yaml).not.toContain("start_date:");
      });
    });

    describe("should produce YAML that can be parsed back", () => {
      it("should create round-trip compatible YAML for complete data", async () => {
        const originalData: ProjectData = {
          name: "My Project",
          description: "A comprehensive description",
          tech_stack: "React, TypeScript",
          prod_link: "https://example.com",
          start_date: new Date("2024-01-15T00:00:00.000Z"),
          end_date: new Date("2024-12-31T00:00:00.000Z"),
        };

        const yaml = convertToYaml(originalData);
        const parsedData = await parseAndValidateProjectYaml(yaml);

        expect(parsedData.name).toBe(originalData.name);
        expect(parsedData.description).toBe(originalData.description);
        expect(parsedData.tech_stack).toBe(originalData.tech_stack);
        expect(parsedData.prod_link).toBe(originalData.prod_link);
        expect(parsedData.start_date?.toISOString()).toBe(originalData.start_date?.toISOString());
        expect(parsedData.end_date?.toISOString()).toBe(originalData.end_date?.toISOString());
      });

      it("should create round-trip compatible YAML for minimal data", async () => {
        const originalData: ProjectData = {
          name: "Simple Project",
          description: "Simple description",
        };

        const yaml = convertToYaml(originalData);
        const parsedData = await parseAndValidateProjectYaml(yaml);

        expect(parsedData).toEqual(originalData);
      });
    });
  });
});
