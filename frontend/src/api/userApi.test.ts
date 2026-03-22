import { describe, it, expect, vi, beforeEach } from "vitest";
import { createUser, loginUser, getCurrentUser, logoutUser, updateUser, getUserById } from "./userApi";

// mock the backend and test valid input and the possible errors received
describe("createUser", () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });

    const validPayload = {
        name: "John",
        email: "john@umanitoba.ca",
        password: "password123"
    };

    // valid
    it("returns body when response is ok", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            status: 201,
            json: async () => ({ id: "123", name: "John" })
        } as unknown as Response);

        const result = await createUser(validPayload);

        expect(result).toEqual({ id: "123", name: "John" });
    });

    // user exists error
    it("throws 409 conflict error message", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 409,
        json: async () => ({ error: "User already exists" })
        } as unknown as Response);

        await expect(createUser(validPayload)).rejects.toThrow("User already exists");
    });

    // incorrect domain error
    it("throws 403 forbidden error message", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 403,
        json: async () => ({ error: "Email domain is not allowed" })
        } as unknown as Response);

        await expect(createUser(validPayload)).rejects.toThrow("Email domain is not allowed");
    });

    // incomplete data error
    it("throws 422 validation error message", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 422,
        json: async () => ({ error: "User data is incomplete" })
        } as unknown as Response);

        await expect(createUser(validPayload)).rejects.toThrow("User data is incomplete");
    });

    // other 400-level error
    it("throws generic error for unexpected status (404)", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 404,
        json: async () => ({ error: "Not Found" })
        } as unknown as Response);

        await expect(createUser(validPayload)).rejects.toThrow("Something went wrong. Please try again.");
    });
    
    // server error
    it("throws generic error for unexpected status (500)", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 500,
        json: async () => ({ error: "Internal server error" })
        } as unknown as Response);

        await expect(createUser(validPayload)).rejects.toThrow("Something went wrong. Please try again.");
    });
});

// mock the backend and test valid input and the possible errors received
describe("loginUser", () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });

    const validPayload = {
        email: "john@umanitoba.ca",
        password: "password123"
    };

    // valid
    it("returns body when response is ok", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ message: "Login successful" })
        } as unknown as Response);

        const result = await loginUser(validPayload);

        expect(result).toEqual({ message: "Login successful" });
    });

    // invalid credentials (403)
    it("throws 403 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 403,
            json: async () => ({ error: "Invalid email or password" })
        } as unknown as Response);

        await expect(loginUser(validPayload)).rejects.toThrow("Invalid email or password");
    });

    // other 400-level error
    it("throws generic error for unexpected status (404)", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => ({ error: "Not Found" })
        } as unknown as Response);

        await expect(loginUser(validPayload)).rejects.toThrow("Something went wrong. Please try again.");
    });

    // server error
    it("throws generic error for unexpected status (500)", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ error: "Internal server error" })
        } as unknown as Response);

        await expect(loginUser(validPayload)).rejects.toThrow("Something went wrong. Please try again.");
    });
});

// mock the backend and test valid session and unauthorized state
describe("getCurrentUser", () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });

    const mockUser = {
        id: "123",
        email: "john@umanitoba.ca",
        username: "johnny",
        role: "student"
    };

    // valid session
    it("returns user object when response is ok", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockUser
        } as unknown as Response);

        const result = await getCurrentUser();

        expect(result).toEqual(mockUser);
        expect(fetch).toHaveBeenCalledWith("/api/v1/user/me", {
            credentials: "include",
        });
    });

    // unauthorized (no valid session)
    it("throws 'Not authenticated' when response is not ok", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({ error: "Unauthorized" })
        } as unknown as Response);

        await expect(getCurrentUser()).rejects.toThrow("Not authenticated");
    });
});

// mock the backend and ensure logout does not throw even on failure
describe("logoutUser", () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });

    // successful logout
    it("calls logout endpoint with correct options", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            status: 200
        } as unknown as Response);

        await expect(logoutUser()).resolves.not.toThrow();

        expect(fetch).toHaveBeenCalledWith("/api/v1/user/logout", {
            method: "POST",
            credentials: "include",
        });
    });

    // backend error response
    it("does not throw if backend responds with error", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 500
        } as unknown as Response);

        await expect(logoutUser()).resolves.not.toThrow();
    });

    // network failure
    it("does not throw if fetch rejects (network error)", async () => {
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

        await expect(logoutUser()).resolves.not.toThrow();
    });
    
    // 400 error response
    it("does not throw if backend responds with error", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 400
        } as unknown as Response);

        await expect(logoutUser()).resolves.not.toThrow();
    });
});

// mock the backend and test valid input and the possible errors received
describe("updateUser", () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });

    const validId = "123";
    const validPayload = { profilePic: "avatar3" };

    // valid
    it("returns body when response is ok", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ id: "123", profilePic: "avatar3" })
        } as unknown as Response);

        const result = await updateUser(validId, validPayload);

        expect(result).toEqual({ id: "123", profilePic: "avatar3" });
    });

    // unauthenticated error
    it("throws 401 error message", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({ error: "Unauthorized" })
        } as unknown as Response);

        await expect(updateUser(validId, validPayload)).rejects.toThrow("You must be signed-in to make changes to your account");
    });

    // forbidden error (updating another user's account)
    it("throws 403 forbidden error message", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 403,
            json: async () => ({ error: "Forbidden" })
        } as unknown as Response);

        await expect(updateUser(validId, validPayload)).rejects.toThrow("A user may only make changes to their account");
    });

    // user not found error
    it("throws 404 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => ({ error: "User not found" })
        } as unknown as Response);

        await expect(updateUser(validId, validPayload)).rejects.toThrow("User not found");
    });

    // server error
    it("throws generic error for unexpected status (500)", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ error: "Internal server error" })
        } as unknown as Response);

        await expect(updateUser(validId, validPayload)).rejects.toThrow("Something went wrong. Please try again.");
    });
});

// mock the backend and test user lookup by id with field mapping
describe("getUserById", () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });

    const validId = "123";

    // valid - verify snake_case to camelCase mapping
    it("returns mapped user object when response is ok", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                _id: "123",
                user_name: "johnny",
                email: "john@umanitoba.ca",
                role: "student",
                profile_pic: "avatar3"
            })
        } as unknown as Response);

        const result = await getUserById(validId);

        expect(result).toEqual({
            id: "123",
            username: "johnny",
            email: "john@umanitoba.ca",
            role: "Student",
            profilePic: "avatar3"
        });
    });

    // user not found error
    it("throws 404 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => ({ error: "User not found" })
        } as unknown as Response);

        await expect(getUserById(validId)).rejects.toThrow("User not found");
    });

    // server error
    it("throws generic error for unexpected status (500)", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ error: "Internal server error" })
        } as unknown as Response);

        await expect(getUserById(validId)).rejects.toThrow("Something went wrong. Please try again.");
    });
});