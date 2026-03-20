// Take in data of the user and send it to the endpoint.
// Robustly throw errors based on backend response.
export async function createUser(data: {
    name: string;
    email: string;
    password: string;
    }) {

    // build the request
    const response = await fetch("/api/v1/user/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    // send the request
    const body = await response.json();

    // robustly throw errors
    if (!response.ok) {
        switch (response.status) {
            case 409:
            case 403:
            case 422:
                throw new Error(body.error); // known errors
            default:
                throw new Error("Something went wrong. Please try again.");
        }
    }

    return body;
}

// Take in credentials of the user and send it to the endpoint.
// Robustly throw errors.
export async function loginUser(data: {
    email: string;
    password: string;
}) {

    // build the request
    const response = await fetch("/api/v1/user/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    const body = await response.json();

    // robustly throw errors
    if (!response.ok) {
        if (response.status === 403) {
            throw new Error(body.error);
        }
        throw new Error("Something went wrong. Please try again.");
    }

    return body;
}

// run the /me endpoint to get current logged in user details.
export async function getCurrentUser() {
    const response = await fetch("/api/v1/user/me", {
        credentials: "include",
    });

    if (!response.ok) throw new Error("Not authenticated");

    return response.json();
}

// Logout the user by relying on sessions in the cookie.
// Failure means session expired so ignore errors and clear local auth state where called.
export async function logoutUser() {
    try {
        await fetch("/api/v1/user/logout", {
            method: "POST",
            credentials: "include",
        });
    } catch (err) {
        // ignore errors intentionally
        console.warn("Logout request failed, clearing client state anyway.", err);
    }
}

// Update user fields. Accepts any combination of username, email, and profilePic.
export async function updateUser(id: string, data: {
    username?: string;
    email?: string;
    profilePic?: string;
}) {

    // build the request
    const response = await fetch(`/api/v1/user/update/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    const body = await response.json();

    // robustly throw errors
    if (!response.ok) {
        switch (response.status) {
            case 401:
                throw new Error("You must be signed-in to make changes to your account");
            case 403:
                throw new Error("A user may only make changes to their account");
            case 404:
                throw new Error(body.error);
            default:
                throw new Error("Something went wrong. Please try again.");
        }
    }

    return body;
}

// Search for a user by the id. Return their full details.
export async function getUserById(id: string) {
    const response = await fetch(`/api/v1/user/${id}`, {
        credentials: "include",
    });

    const body = await response.json();

    if (!response.ok) {
        switch(response.status) {
            case 404:
                throw new Error(body.error);
            default:
                throw new Error("Something went wrong. Please try again.");
        } 
    }

    return {
        id: body._id,
        username: body.user_name,
        email: body.email,
        role: body.role.charAt(0).toUpperCase() + body.role.slice(1), // student --> Student
        profilePic: body.profile_pic,
    };
}