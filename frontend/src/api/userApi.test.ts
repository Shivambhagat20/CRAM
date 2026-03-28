import { describe, it, expect, vi, beforeEach } from "vitest";
import { createUser, loginUser, getCurrentUser, logoutUser, updateUser, getUserById, changeEmail, confirmEmailChange, resetPassword, verifyEmail, requestVerificationCode } from "./userApi";

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
    it("verify fetch call", async () =>{
        const fetchMock = vi.spyOn(globalThis, "fetch")
            .mockResolvedValue({
            ok: true,
            json: async () => ([]),
            } as unknown as Response);

        await createUser(validPayload);

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/v1/user/create",
            expect.objectContaining({
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            })
        );
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
    it("verify fetch call", async () =>{
        const fetchMock = vi.spyOn(globalThis, "fetch")
            .mockResolvedValue({
            ok: true,
            json: async () => ([]),
            } as unknown as Response);

        await loginUser(validPayload);

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/v1/user/login",
            expect.objectContaining({
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            })
        );
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

// mock the backend and ensure logout does not throw even on failure WARN MUTANT ++============================================================
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
    it("logs warning when logout request fails", async () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network error"));

        await logoutUser(); // or whatever function this is in

        expect(warnSpy).toHaveBeenCalledWith(
            "Logout request failed, clearing client state anyway.",
            expect.any(Error)
        );
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
            json: async () => ({ error: "A user may only make changes to their account" })
        } as unknown as Response);

        await expect(updateUser(validId, validPayload)).rejects.toThrow("A user may only make changes to their account");
    });
    it("throws 403 forbidden error message", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 403,
            json: async () => ({})
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
    it("verify fetch call", async () =>{
        const fetchMock = vi.spyOn(globalThis, "fetch")
            .mockResolvedValue({
            ok: true,
            json: async () => ([]),
            } as unknown as Response);

        await updateUser(validId,validPayload);

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/v1/user/update/123",
            expect.objectContaining({
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            })
        );
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
    it("verify fetch call", async () =>{
        const fetchMock = vi.spyOn(globalThis, "fetch")
            .mockResolvedValue({
            ok: true,
            json: async () => ({_id: "123",
                user_name: "johnny",
                email: "john@umanitoba.ca",
                role: "student",
                profile_pic: "avatar3"}),
            } as unknown as Response);

        await getUserById(validId);

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/v1/user/123",
            expect.objectContaining({
                credentials: "include",
            })
        );
    });
});

// mock the backend and test email change request and possible errors
describe("changeEmail", () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });

    const validId = "123";
    const validEmail = "newemail@myumanitoba.ca";

    // valid - verification code sent to new email
    it("returns success message when response is ok", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ message: "Verification code sent to new email" })
        } as unknown as Response);

        const result = await changeEmail(validId, validEmail);

        expect(result).toEqual({ message: "Verification code sent to new email" });
    });

    // unauthenticated error
    it("throws 401 error message", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({ error: "Unauthorized" })
        } as unknown as Response);

        await expect(changeEmail(validId, validEmail)).rejects.toThrow("You must be signed-in to make changes to your account");
    });

    // forbidden error - invalid domain
    it("throws 403 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 403,
            json: async () => ({ error: "Email domain is not allowed" })
        } as unknown as Response);

        await expect(changeEmail(validId, validEmail)).rejects.toThrow("Email domain is not allowed");
    });

    // conflict error - email already in use
    it("throws 409 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 409,
            json: async () => ({ error: "An account with this email already exists" })
        } as unknown as Response);

        await expect(changeEmail(validId, validEmail)).rejects.toThrow("An account with this email already exists");
    });

    // unprocessable - same email as current
    it("throws 422 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 422,
            json: async () => ({ error: "Email is already associated with your account" })
        } as unknown as Response);

        await expect(changeEmail(validId, validEmail)).rejects.toThrow("Email is already associated with your account");
    });

    // server error
    it("throws generic error for unexpected status (500)", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ error: "Internal server error" })
        } as unknown as Response);

        await expect(changeEmail(validId, validEmail)).rejects.toThrow("Something went wrong. Please try again.");
    });
    it("verify fetch call", async () =>{
        const fetchMock = vi.spyOn(globalThis, "fetch")
            .mockResolvedValue({
            ok: true,
            json: async () => ([]),
            } as unknown as Response);

        await changeEmail(validId,validEmail);

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/v1/user/changeEmail/123",
            expect.objectContaining({
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body:"{\"email\":\"newemail@myumanitoba.ca\"}",
            })
        );
    });
});

// mock the backend and test email change confirmation with verification code
describe("confirmEmailChange", () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });

    const validId = "123";
    const validCode = "123456";

    // valid - email change confirmed
    it("resolves without throwing when response is ok", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ message: "Email change successful" })
        } as unknown as Response);

        await expect(confirmEmailChange(validId, validCode)).resolves.not.toThrow();
    });

    // unauthenticated error
    it("throws 401 error message", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({ error: "Unauthorized" })
        } as unknown as Response);

        await expect(confirmEmailChange(validId, validCode)).rejects.toThrow("You must be signed-in to make changes to your account");
    });

    // invalid verification code
    it("throws 400 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 400,
            json: async () => ({ error: "Invalid verification code" })
        } as unknown as Response);

        await expect(confirmEmailChange(validId, validCode)).rejects.toThrow("Invalid verification code");
    });

    // forbidden error
    it("throws 403 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 403,
            json: async () => ({ error: "A user may only make changes to their account" })
        } as unknown as Response);

        await expect(confirmEmailChange(validId, validCode)).rejects.toThrow("A user may only make changes to their account");
    });

    // user not found error
    it("throws 404 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => ({ error: "Invalid user" })
        } as unknown as Response);

        await expect(confirmEmailChange(validId, validCode)).rejects.toThrow("Invalid user");
    });

    // server error
    it("throws generic error for unexpected status (500)", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ error: "Internal server error" })
        } as unknown as Response);

        await expect(confirmEmailChange(validId, validCode)).rejects.toThrow("Something went wrong. Please try again.");
    });
    it("verify fetch call", async () =>{
        const fetchMock = vi.spyOn(globalThis, "fetch")
            .mockResolvedValue({
            ok: true,
            json: async () => ([]),
            } as unknown as Response);

        await confirmEmailChange(validId,validCode);

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/v1/user/confirmEmailChange/123",
            expect.objectContaining({
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: "{\"verificationCode\":\"123456\"}",
            })
        );
    });
});

// mock the backend and test password reset with current and new password
describe("resetPassword", () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });

    const validId = "123";
    const validPayload = {
        currentPassword: "oldpassword123",
        newPassword: "newpassword123",
        confirmPassword: "newpassword123"
    };

    // valid - password changed successfully
    it("returns body when response is ok", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ message: "Password changed successfully" })
        } as unknown as Response);

        const result = await resetPassword(validId, validPayload);

        expect(result).toEqual({ message: "Password changed successfully" });
    });

    // unauthenticated error
    it("throws 401 error message", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({ error: "Unauthorized" })
        } as unknown as Response);

        await expect(resetPassword(validId, validPayload)).rejects.toThrow("You must be signed-in to make changes to your account");
    });

    // invalid current password
    it("throws 403 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 403,
            json: async () => ({ error: "Invalid current password" })
        } as unknown as Response);

        await expect(resetPassword(validId, validPayload)).rejects.toThrow("Invalid current password");
    });

    // incomplete data error
    it("throws 422 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 422,
            json: async () => ({ error: "User data is incomplete" })
        } as unknown as Response);

        await expect(resetPassword(validId, validPayload)).rejects.toThrow("User data is incomplete");
    });

    // server error
    it("throws generic error for unexpected status (500)", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ error: "Internal server error" })
        } as unknown as Response);

        await expect(resetPassword(validId, validPayload)).rejects.toThrow("Something went wrong. Please try again.");
    });
    it("verify fetch call", async () =>{
        const fetchMock = vi.spyOn(globalThis, "fetch")
            .mockResolvedValue({
            ok: true,
            json: async () => ([]),
            } as unknown as Response);

        await resetPassword(validId,validPayload);

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/v1/user/resetPassword/123",
            expect.objectContaining({
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            })
        );
    });
});

// mock the backend and test verification code request and possible errors
describe("requestVerificationCode", () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });

    const validId = "123";

    // valid - verification code sent to current email
    it("resolves without throwing when response is ok", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ message: "Verification code sent to email" })
        } as unknown as Response);

        await expect(requestVerificationCode(validId)).resolves.not.toThrow();
    });

    // unauthenticated error
    it("throws 401 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({ error: "Unauthorized" })
        } as unknown as Response);

        await expect(requestVerificationCode(validId)).rejects.toThrow("Unauthorized");
    });

    // forbidden error
    it("throws 403 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 403,
            json: async () => ({ error: "A user may only make changes to their account" })
        } as unknown as Response);

        await expect(requestVerificationCode(validId)).rejects.toThrow("A user may only make changes to their account");
    });

    // user not found error
    it("throws 404 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => ({ error: "User not found" })
        } as unknown as Response);

        await expect(requestVerificationCode(validId)).rejects.toThrow("User not found");
    });

    // conflict error - user already verified
    it("throws 409 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 409,
            json: async () => ({ error: "User is already verified" })
        } as unknown as Response);

        await expect(requestVerificationCode(validId)).rejects.toThrow("User is already verified");
    });

    // server error
    it("throws generic error for unexpected status (500)", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ error: "Internal server error" })
        } as unknown as Response);

        await expect(requestVerificationCode(validId)).rejects.toThrow("Something went wrong. Please try again.");
    });
    it("verify fetch call", async () =>{
        const fetchMock = vi.spyOn(globalThis, "fetch")
            .mockResolvedValue({
            ok: true,
            json: async () => ([]),
            } as unknown as Response);

        await requestVerificationCode(validId);

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/v1/user/123/request-verification-code",
            expect.objectContaining({
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            })
        );
    });
});

// mock the backend and test email verification with 6-digit code
describe("verifyEmail", () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });

    const validPayload = {
        email: "john@umanitoba.ca",
        code: "123456"
    };

    // valid - email verified successfully
    it("resolves without throwing when response is ok", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ message: "Email verified successfully" })
        } as unknown as Response);

        await expect(verifyEmail(validPayload)).resolves.not.toThrow();
    });

    // invalid verification code
    it("throws 400 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 400,
            json: async () => ({ error: "Invalid verification code" })
        } as unknown as Response);

        await expect(verifyEmail(validPayload)).rejects.toThrow("Invalid verification code");
    });

    // user not found error
    it("throws 404 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => ({ error: "User not found" })
        } as unknown as Response);

        await expect(verifyEmail(validPayload)).rejects.toThrow("User not found");
    });

    // conflict error - already verified
    it("throws 409 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 409,
            json: async () => ({ error: "User is already verified" })
        } as unknown as Response);

        await expect(verifyEmail(validPayload)).rejects.toThrow("User is already verified");
    });

    // incomplete data error
    it("throws 422 error message from backend", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 422,
            json: async () => ({ error: "User data is incomplete" })
        } as unknown as Response);

        await expect(verifyEmail(validPayload)).rejects.toThrow("User data is incomplete");
    });

    // server error
    it("throws generic error for unexpected status (500)", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ error: "Internal server error" })
        } as unknown as Response);

        await expect(verifyEmail(validPayload)).rejects.toThrow("Something went wrong. Please try again.");
    });
    it("verify fetch call", async () =>{
        const fetchMock = vi.spyOn(globalThis, "fetch")
            .mockResolvedValue({
            ok: true,
            json: async () => ([]),
            } as unknown as Response);

        await verifyEmail(validPayload);

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/v1/user/verify-email",
            expect.objectContaining({
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            })
        );
    });
});