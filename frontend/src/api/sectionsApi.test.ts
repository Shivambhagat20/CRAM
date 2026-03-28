import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    createSection,
    getCoursePage,
    updateSection,
    deleteSection,
    createDefinition,
    updateDefinition,
    deleteDefinition,
    getBackendMessage,
    isErrorBody,
} from "./sectionsApi";
/* ============================================================
    createSection
   ============================================================ */
describe("createSection", () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });

    const validPayload = {
        courseCode: "COMP 1010",
        title: "Unit 1: Intro",
        description: "An intro unit",
        body: "Body content here",
    };

    const mockSection = { _id: "s1", ...validPayload };

    // valid
    it("returns section when response is ok", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            status: 201,
            json: async () => mockSection,
        } as unknown as Response);

        const result = await createSection(validPayload);
        expect(result).toStrictEqual(mockSection)
    });

    // unauthenticated
    it("throws 401 error message", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({ error: "Unauthorized" }),
        } as unknown as Response);

        await expect(createSection(validPayload)).rejects.toThrow(
            "Only logged-in users may create sections."
        );
    });

    // conflict
    it("throws 409 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 409,
            json: async () => ({ error: "Section already exists" }),
        } as unknown as Response);

        await expect(createSection(validPayload)).rejects.toThrow("Section already exists");
    });

    // validation error
    it("throws 422 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 422,
            json: async () => ({ error: "Section data is incomplete" }),
        } as unknown as Response);

        await expect(createSection(validPayload)).rejects.toThrow("Section data is incomplete");
    });

    // server error
    it("throws generic error for unexpected status (500)", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ error: "Internal server error" }),
        } as unknown as Response);

        await expect(createSection(validPayload)).rejects.toThrow(
            "Internal server error"
        );
    });
    it("falls back to default message when backend provides none", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 422,
            json: async () => ({}),
        } as unknown as Response);

        await expect(createSection(validPayload)).rejects.toThrow("Invalid request.");
    });

    it("uses message field if error is absent", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 409,
            json: async () => ({ message: "Conflict happened" }),
        } as unknown as Response);

        await expect(createSection(validPayload)).rejects.toThrow("Conflict happened");
    });
    it("falls back when backend gives no message", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 422,
            json: async () => ({}),
        } as unknown as Response);

        await expect(createSection(validPayload))
            .rejects.toThrow("Invalid request.");
    });

    it("handles invalid JSON response gracefully", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => { throw new Error("bad json"); },
        } as unknown as Response);

        await expect(createSection(validPayload)).rejects.toThrow(
            "Something went wrong. Please try again."
        );
    });
    it("calls fetch with correct config", async () => {
        const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => mockSection,
        } as unknown as Response);

        await createSection(validPayload);

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/v1/sections/create",
            expect.objectContaining({
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            })
        );
    });
    it("handles invalid JSON response gracefully", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => { throw new Error("bad json"); }, // force the catch
        } as unknown as Response);

        const result = await createSection(validPayload);
        // If you just want to ensure it doesn't throw, maybe check the fallback shape:
        expect(result).toEqual({}); // because your catch returns {}
    });
});

/* ============================================================
    getCoursePage
   ============================================================ */
describe("getCoursePage", () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });

    const mockSections = [
        { _id: "s1", courseCode: "COMP 1010", title: "Unit 1", description: "Intro", body: "Body" },
    ];

    const mockDefinitions = [
        { _id: "d1", courseCode: "COMP 1010", term: "Algorithm", definition: "A set of rules", example: "Sorting" },
    ];

    // valid
    it("returns sections and definitions when both responses are ok", async () => {
        vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockSections,
            } as unknown as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockDefinitions,
            } as unknown as Response);

        const result = await getCoursePage("COMP 1010");

        expect(result.courseCode).toBe("COMP 1010");
        expect(result.sections).toStrictEqual(mockSections);
        expect(result.definitions).toStrictEqual(mockDefinitions);
    });

    // sections fetch fails
    it("throws error when sections response is not ok", async () => {
        vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({ error: "Failed to load sections." }),
            } as unknown as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockDefinitions,
            } as unknown as Response);

        await expect(getCoursePage("COMP 1010")).rejects.toThrow("Failed to load sections.");
    });
    it("throws error when definitions response is not ok and no msg", async () => {
        vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce({
                ok: false,
                status:500 ,
                json: async () => ({}),
            } as unknown as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ([]),
            } as unknown as Response);

        await expect(getCoursePage("COMP 1010")).rejects.toThrow("Failed to load sections.");
    });

    // definitions fetch fails
    it("throws error when definitions response is not ok", async () => {
        vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockSections,
            } as unknown as Response)
            .mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({ error: "Failed to load definitions." }),
            } as unknown as Response);

        await expect(getCoursePage("COMP 1010")).rejects.toThrow("Failed to load definitions.");
    });
    it("throws error when definitions response is not ok and no msg", async () => {
        vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ([]),
            } as unknown as Response)
            .mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({}),
            } as unknown as Response);

        await expect(getCoursePage("COMP 1010")).rejects.toThrow("Failed to load definitions.");
    });
    // empty course
    it("returns empty arrays when course has no sections or definitions", async () => {
        vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [],
            } as unknown as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [],
            } as unknown as Response);

        const result = await getCoursePage("COMP 1010");

        expect(result.sections).toStrictEqual([]);
        expect(result.definitions).toStrictEqual([]);
    });
    it("returns invalid  when course has no sections or definitions", async () => {
        vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce({
                ok: true,
                json: async () =>  { throw new Error("bad array"); },
            } as unknown as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () =>  { throw new Error("bad array"); },
            } as unknown as Response);

        const result = await getCoursePage("COMP 1010");

        expect(result.sections).toStrictEqual([]);
        expect(result.definitions).toStrictEqual([]);
    });
    it("handles invalid JSON in sections", async () => {
        vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce({
                ok: true,
                json: async () => { throw new Error(); },
            } as unknown as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [],
            } as unknown as Response);

        const result = await getCoursePage("COMP 1010");

        expect(result.sections).toEqual([]);
    });
    it("calls fetch with correct URLs for sections and definitions", async () => {
        const fetchMock = vi.spyOn(globalThis, "fetch")
            .mockResolvedValue({
            ok: true,
            json: async () => ([]),
            } as unknown as Response);

        await getCoursePage("COMP 1010");

        expect(fetchMock).toHaveBeenNthCalledWith(
            1,
            "/api/v1/sections/COMP%201010"
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
            2,
            "/api/v1/definitions/COMP%201010"
        );
    });

    

});

/* ============================================================
    updateSection
   ============================================================ */
describe("updateSection", () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });

    const validPayload = { sectionId: "s1", title: "Updated Title" };
    const mockUpdated = { _id: "s1", courseCode: "COMP 1010", title: "Updated Title", description: "", body: "" };

    // valid
    it("returns updated section when response is ok", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockUpdated,
        } as unknown as Response);

        const result = await updateSection(validPayload);
        expect(result).toStrictEqual(mockUpdated)
    });

    // unauthenticated
    it("throws 401 error message", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({ error: "Unauthorized" }),
        } as unknown as Response);

        await expect(updateSection(validPayload)).rejects.toThrow(
            "Only logged-in users may update sections."
        );
    });

    // not found
    it("throws 404 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => ({ error: "Section not found." }),
        } as unknown as Response);

        await expect(updateSection(validPayload)).rejects.toThrow("Section not found.");
    });

    // validation error
    it("throws 422 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 422,
            json: async () => ({ error: "Invalid request." }),
        } as unknown as Response);

        await expect(updateSection(validPayload)).rejects.toThrow("Invalid request.");
    });

    // server error
    it("throws generic error for unexpected status (500)", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ error: "Internal server error" }),
        } as unknown as Response);

        await expect(updateSection(validPayload)).rejects.toThrow(
            "Internal server error"
        );
    });
    it("falls back to default 404 message when backend provides none", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => ({}), // <-- msg will be undefined here
        } as unknown as Response);

        await expect(updateSection(validPayload))
            .rejects.toThrow("Section not found");
    });
    it("falls back to default message when backend provides none", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 422,
            json: async () => ({}),
        } as unknown as Response);

        await expect(updateSection(validPayload))
            .rejects.toThrow("Invalid request.");
    });
    it("uses message field if error is absent", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => ({ message: "Section not found" }),
        } as unknown as Response);

        await expect(updateSection(validPayload))
            .rejects.toThrow("Section not found");
    });
    it("uses message field if error is absent", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 409,
            json: async () => ({ message: "Conflict happened" }),
        } as unknown as Response);

        await expect(updateSection(validPayload))
            .rejects.toThrow("Conflict happened");
    });

    it("handles invalid JSON response gracefully", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => { throw new Error("bad json"); },
        } as unknown as Response);

        await expect(updateSection(validPayload))
            .rejects.toThrow("Something went wrong. Please try again.");
    });

    it("calls fetch with correct config", async () => {
        const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => mockUpdated,
        } as unknown as Response);

        await updateSection(validPayload);

        expect(fetchMock).toHaveBeenCalledWith(
            `/api/v1/sections/update/${validPayload.sectionId}`,
            expect.objectContaining({
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(validPayload),
            })
        );
    });
    it("uses message when error is undefined", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 422,
            json: async () => ({ error: undefined, message: "fallback msg" }),
        } as unknown as Response);

        await expect(updateSection(validPayload))
            .rejects.toThrow("fallback msg");
    });
    it("handles invalid JSON response gracefully", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => { throw new Error("bad json"); }, // force the catch
        } as unknown as Response);

        const result = await updateSection(validPayload);
        // If you just want to ensure it doesn't throw, maybe check the fallback shape:
        expect(result).toEqual({}); // because your catch returns {}
    });
});

/* ============================================================
    deleteSection
   ============================================================ */
describe("deleteSection", () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });

    const validPayload = { sectionId: "s1" };

    // valid
    it("returns acknowledgement when response is ok", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ acknowledged: true, deletedCount: 1 }),
        } as unknown as Response);

        const result = await deleteSection(validPayload);
        expect(result).toStrictEqual({ acknowledged: true, deletedCount: 1 });
    });

    // unauthenticated
    it("throws 401 error message", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({ error: "Unauthorized" }),
        } as unknown as Response);

        await expect(deleteSection(validPayload)).rejects.toThrow(
            "Only logged-in users may delete sections."
        );
    });

    // not found
    it("throws 404 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => ({ error: "Section not found." }),
        } as unknown as Response);

        await expect(deleteSection(validPayload)).rejects.toThrow("Section not found.");
    });

    // server error
    it("throws generic error for unexpected status (500)", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ error: "Internal server error" }),
        } as unknown as Response);

        await expect(deleteSection(validPayload)).rejects.toThrow(
            "Internal server error"
        );
    });
    it("falls back to default 404 message when backend provides none", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => ({}), // <-- msg will be undefined here
        } as unknown as Response);

        await expect(deleteSection(validPayload))
            .rejects.toThrow("Section not found");
    });
    it("falls back to default message when backend provides none", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({}),
    } as unknown as Response);

    await expect(deleteSection(validPayload))
        .rejects.toThrow("Invalid request.");
    });

    it("uses message field if error is absent", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 409,
            json: async () => ({ message: "Conflict happened" }),
        } as unknown as Response);

        await expect(deleteSection(validPayload))
            .rejects.toThrow("Conflict happened");
    });
    it("uses message field if error is absent", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => ({ message: "Section not found" }),
        } as unknown as Response);

        await expect(deleteSection(validPayload))
            .rejects.toThrow("Section not found");
    });

    it("handles invalid JSON response gracefully", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => { throw new Error("bad json"); },
        } as unknown as Response);

        await expect(deleteSection(validPayload))
            .rejects.toThrow("Something went wrong. Please try again.");
    });

    it("calls fetch with correct config", async () => {
        const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => ({ acknowledged: true, deletedCount: 1 }),
        } as unknown as Response);

        await deleteSection(validPayload);

        expect(fetchMock).toHaveBeenCalledWith(
            `/api/v1/sections/delete/${validPayload.sectionId}`,
            expect.objectContaining({
                method: "DELETE",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(validPayload),
            })
        );
    });
    it("handles invalid JSON response gracefully", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => { throw new Error("bad json"); }, // force the catch
        } as unknown as Response);

        const result = await deleteSection(validPayload);
        // If you just want to ensure it doesn't throw, maybe check the fallback shape:
        expect(result).toEqual({}); // because your catch returns {}
    });
});

/* ============================================================
    createDefinition
   ============================================================ */
describe("createDefinition", () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });

    const validPayload = {
        courseCode: "COMP 1010",
        term: "Algorithm",
        definition: "A set of rules",
        example: "Sorting",
    };

    const mockDefinition = { _id: "d1", ...validPayload };

    // valid
    it("returns definition when response is ok", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            status: 201,
            json: async () => mockDefinition,
        } as unknown as Response);

        const result = await createDefinition(validPayload);
        expect(result).toStrictEqual(mockDefinition);
    });

    // unauthenticated
    it("throws 401 error message", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({ error: "Unauthorized" }),
        } as unknown as Response);

        await expect(createDefinition(validPayload)).rejects.toThrow(
            "Only logged-in users may create definitions."
        );
    });

    // conflict
    it("throws 409 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 409,
            json: async () => ({ error: "Definition already exists" }),
        } as unknown as Response);

        await expect(createDefinition(validPayload)).rejects.toThrow("Definition already exists");
    });

    // validation error
    it("throws 422 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 422,
            json: async () => ({ error: "Definition data is incomplete" }),
        } as unknown as Response);

        await expect(createDefinition(validPayload)).rejects.toThrow("Definition data is incomplete");
    });

    // server error
    it("throws generic error for unexpected status (500)", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ error: "Internal server error" }),
        } as unknown as Response);

        await expect(createDefinition(validPayload)).rejects.toThrow(
            "Internal server error"
        );
    });
    it("createDefinition falls back to default message when backend provides none", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 422,
            json: async () => ({}),
        } as unknown as Response);

        await expect(createDefinition(validPayload))
            .rejects.toThrow("Invalid request.");
    });

    it("createDefinition uses message field if error is absent", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 409,
            json: async () => ({ message: "Conflict happened" }),
        } as unknown as Response);

        await expect(createDefinition(validPayload))
            .rejects.toThrow("Conflict happened");
    });

    it("createDefinition handles invalid JSON response gracefully", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => { throw new Error("bad json"); },
        } as unknown as Response);

        await expect(createDefinition(validPayload))
            .rejects.toThrow("Something went wrong. Please try again.");
    });

    it("createDefinition calls fetch with correct config", async () => {
        const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => mockDefinition,
        } as unknown as Response);

        await createDefinition(validPayload);

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/v1/definitions/create",
            expect.objectContaining({
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(validPayload),
            })
        );
    });
    it("handles invalid JSON response gracefully", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => { throw new Error("bad json"); }, // force the catch
        } as unknown as Response);

        const result = await createDefinition(validPayload);
        // If you just want to ensure it doesn't throw, maybe check the fallback shape:
        expect(result).toEqual({}); // because your catch returns {}
        });
});

/* ============================================================
    updateDefinition
   ============================================================ */
describe("updateDefinition", () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });

    const validPayload = { definitionId: "d1", term: "Updated Term" };
    const mockUpdated = { _id: "d1", courseCode: "COMP 1010", term: "Updated Term", definition: "A set of rules", example: "Sorting" };

    // valid
    it("returns updated definition when response is ok", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockUpdated,
        } as unknown as Response);

        const result = await updateDefinition(validPayload);
        expect(result).toStrictEqual(mockUpdated);
    });

    // unauthenticated
    it("throws 401 error message", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({ error: "Unauthorized" }),
        } as unknown as Response);

        await expect(updateDefinition(validPayload)).rejects.toThrow(
            "Only logged-in users may update definitions."
        );
    });

    // not found
    it("throws 404 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => ({ error: "Definition not found." }),
        } as unknown as Response);

        await expect(updateDefinition(validPayload)).rejects.toThrow("Definition not found.");
    });

    // validation error
    it("throws 422 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 422,
            json: async () => ({ error: "Invalid request." }),
        } as unknown as Response);

        await expect(updateDefinition(validPayload)).rejects.toThrow("Invalid request.");
    });

    // server error
    it("throws generic error for unexpected status (500)", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ error: "Internal server error" }),
        } as unknown as Response);

        await expect(updateDefinition(validPayload)).rejects.toThrow(
            "Internal server error"
        );
    });
    it("falls back to default 404 message when backend provides none", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => ({}), // <-- msg will be undefined here
        } as unknown as Response);

        await expect(updateDefinition(validPayload))
            .rejects.toThrow("Definition not found");
    });
    it("updateDefinition falls back to default message when backend provides none", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 422,
            json: async () => ({}),
        } as unknown as Response);

        await expect(updateDefinition(validPayload))
            .rejects.toThrow("Invalid request.");
    });

    it("updateDefinition uses message field if error is absent", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 409,
            json: async () => ({ message: "Conflict happened" }),
        } as unknown as Response);

        await expect(updateDefinition(validPayload))
            .rejects.toThrow("Conflict happened");
    });

    it("updateDefinition handles invalid JSON response gracefully", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => { throw new Error("bad json"); },
        } as unknown as Response);

        await expect(updateDefinition(validPayload))
            .rejects.toThrow("Something went wrong. Please try again.");
    });

    it("updateDefinition calls fetch with correct config", async () => {
        const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => mockUpdated,
        } as unknown as Response);

        await updateDefinition(validPayload);

        expect(fetchMock).toHaveBeenCalledWith(
            `/api/v1/definitions/update/${validPayload.definitionId}`,
            expect.objectContaining({
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(validPayload),
            })
        );
    });
    it("handles invalid JSON response gracefully", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => { throw new Error("bad json"); }, // force the catch
        } as unknown as Response);

        const result = await updateDefinition(validPayload);
        // If you just want to ensure it doesn't throw, maybe check the fallback shape:
        expect(result).toEqual({}); // because your catch returns {}
    });
});

/* ============================================================
    deleteDefinition
   ============================================================ */
describe("deleteDefinition", () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });

    const validPayload = { definitionId: "d1" };

    // valid
    it("returns acknowledgement when response is ok", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ acknowledged: true, deletedCount: 1 }),
        } as unknown as Response);

        const result = await deleteDefinition(validPayload);
        expect(result).toStrictEqual({ acknowledged: true, deletedCount: 1 });
    });

    // unauthenticated
    it("throws 401 error message", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({ error: "Unauthorized" }),
        } as unknown as Response);

        await expect(deleteDefinition(validPayload)).rejects.toThrow(
            "Only logged-in users may delete definitions."
        );
    });

    // not found
    it("throws 404 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => ({ error: "Definition not found." }),
        } as unknown as Response);

        await expect(deleteDefinition(validPayload)).rejects.toThrow("Definition not found.");
    });

    // server error
    it("throws generic error for unexpected status (500)", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ error: "Internal server error" }),
        } as unknown as Response);

        await expect(deleteDefinition(validPayload)).rejects.toThrow(
            "Internal server error"
        );
    });
    it("deleteDefinition falls back to default message when backend provides none", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 422,
            json: async () => ({}),
        } as unknown as Response);

        await expect(deleteDefinition(validPayload))
            .rejects.toThrow("Invalid request.");
    });
    it("falls back to default 404 message when backend provides none", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => ({}), // <-- msg will be undefined here
        } as unknown as Response);

        await expect(deleteDefinition(validPayload))
            .rejects.toThrow("Definition not found");
    });

    it("deleteDefinition uses message field if error is absent", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 409,
            json: async () => ({ message: "Conflict happened" }),
        } as unknown as Response);

        await expect(deleteDefinition(validPayload))
            .rejects.toThrow("Conflict happened");
    });

    it("deleteDefinition handles invalid JSON response gracefully", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => { throw new Error("bad json"); },
        } as unknown as Response);

        await expect(deleteDefinition(validPayload))
            .rejects.toThrow("Something went wrong. Please try again.");
    });

    it("deleteDefinition calls fetch with correct config", async () => {
        const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => ({ acknowledged: true, deletedCount: 1 }),
        } as unknown as Response);

        await deleteDefinition(validPayload);

        expect(fetchMock).toHaveBeenCalledWith(
            `/api/v1/definitions/delete/${validPayload.definitionId}`,
            expect.objectContaining({
                method: "DELETE",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(validPayload),
            })
        );
    });
    it("handles invalid JSON response gracefully", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => { throw new Error("bad json"); }, // force the catch
        } as unknown as Response);

        const result = await deleteDefinition(validPayload);
        // If you just want to ensure it doesn't throw, maybe check the fallback shape:
        expect(result).toEqual({}); // because your catch returns {}
    });
    
});
describe("helper functions", () => {
    describe("getBackendMessage", () => {
        it("returns error if present", () => {
            expect(getBackendMessage({ error: "err" })).toBe("err");
        });

        it("returns message if error missing", () => {
            expect(getBackendMessage({ message: "msg" })).toBe("msg");
        });

        it("returns undefined for invalid bodies", () => {
            expect(getBackendMessage({})).toBeUndefined();
            expect(getBackendMessage(null)).toBeUndefined();
            expect(getBackendMessage("string")).toBeUndefined();
        });

        it("prefers error over message", () => {
            expect(getBackendMessage({ error: "err", message: "msg" })).toBe("err");
        });
    });
    describe("isErrorBody", () => {
        it("returns true for error field", () => {
            expect(isErrorBody({ error: "err" })).toBe(true);
        });

        it("returns true for message field", () => {
            expect(isErrorBody({ message: "msg" })).toBe(true);
        });

        it("returns true if both exist", () => {
            expect(isErrorBody({ error: "e", message: "m" })).toBe(true);
        });

        it("returns false for empty object", () => {
            expect(isErrorBody({})).toBe(false);
        });

        it("returns false for null", () => {
            expect(isErrorBody(null)).toBe(false);
        });

        it("returns false for non-object", () => {
            expect(isErrorBody("string")).toBe(false);
        });
    });
});
