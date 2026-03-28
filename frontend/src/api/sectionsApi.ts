import { ApiError } from "@/lib/errors/ApiError";

/* TYPES */
export type Contributor = {
    userId: string;
    date: string;
    role: string;
    username: string;
    profilePic: string;
};

export type Section = {
    _id: string;
    courseCode: string;
    title: string;
    description: string;
    body: string;
    contributors: Contributor[];
    timestamp?: string; // We can add this in the backend.
};

export type Definition = {
    _id: string;
    courseCode: string,
    term: string;
    definition: string;
    example: string;
    contributors: Contributor[];
    timestamp?: string;
}

export type CoursePage = {
    courseCode: string;
    title?: string;
    subtitle?: string;
    description?: string;
    sections: Section[];
    definitions: Definition[];
}

type ErrorBody = {
    error?: string;
    message?: string;
}

/* HELPERS */

export function isErrorBody(body: unknown): body is ErrorBody {
    return (
        typeof body === "object" &&
        body !== null &&
        ("error" in body || "message" in body)
    );
}

 export function getBackendMessage(body: unknown): string | undefined {
    return isErrorBody(body) ? body.error ?? body.message : undefined;
}

/* SECTIONS */

// CREATE: Take in section data and send it to the endpoint.
export async function createSection(data: {
    courseCode: string;
    title: string;
    description: string;
    body: string;
    // Timestamp added in the backend (time of storage).
}) {
    const response = await fetch("/api/v1/sections/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    const body = (await response.json().catch(() => ({})));

    if (!response.ok) {
        const msg = getBackendMessage(body);

        switch (response.status) {
            case 401:
                throw new ApiError(401,"Only logged-in users may create sections.");
            case 409:
            case 422:
                throw new ApiError(response.status, msg ?? "Invalid request.");
            default:
                throw new ApiError(response.status, msg ?? "Something went wrong. Please try again.");
        }
    }

    return body as Section;
}

// READ: Course page (course + ALL sections + full text).
// Public endpoint, so no credentials needed.
export async function getCoursePage(courseCode: string) {
    const [sectionsRes, definitionsRes] = await Promise.all([
        fetch(`/api/v1/sections/${encodeURIComponent(courseCode)}`),
        fetch(`/api/v1/definitions/${encodeURIComponent(courseCode)}`)
    ]);

    const sectionsBody: unknown = await sectionsRes.json().catch(() => ([]));
    const definitionsBody: unknown = await definitionsRes.json().catch(() => ([]));

    if (!sectionsRes.ok) {
        const msg = getBackendMessage(sectionsBody);
        throw new Error(msg ?? "Failed to load sections.");
    }

    if (!definitionsRes.ok) {
        const msg = getBackendMessage(definitionsBody);
        throw new Error(msg ?? "Failed to load definitions.");
    }
    
    const sections = sectionsBody as Section[];
    const definitions = definitionsBody as Definition[];

    return {
        courseCode,
        sections,
        definitions
    } as CoursePage;
}

// UPDATE: Section (partial update).
export async function updateSection(data: {
    sectionId: string; // Mongo _id as string.
    title?: string;
    description?: string;
    body?: string;
}) {
    const response = await fetch(`/api/v1/sections/update/${data.sectionId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    const body = (await response.json().catch(() => ({})));

    if (!response.ok) {
        const msg = getBackendMessage(body);

        switch (response.status) {
            case 401:
                throw new ApiError(response.status, "Only logged-in users may update sections.");
            case 404:
                throw new ApiError(response.status, msg ?? "Section not found.");
            case 409:
            case 422:
                throw new ApiError(response.status, msg ?? "Invalid request.");
            default:
                throw new ApiError(response.status, msg ?? "Something went wrong. Please try again.");
        }
    }

    // This could be the updated section or an update result object.
    return body as Section;
}

// DELETE: a section.
export async function deleteSection(data: { sectionId: string }) {
    const response = await fetch(`/api/v1/sections/delete/${data.sectionId}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    const body = (await response.json().catch(() => ({})));

    if (!response.ok) {
        const msg = getBackendMessage(body);

        switch (response.status) {
            case 401:
                throw new ApiError(response.status, "Only logged-in users may delete sections.");
            case 404:
                throw new ApiError(response.status, msg ?? "Section not found.");
            case 409:
            case 422:
                throw new ApiError(response.status, msg ?? "Invalid request.");
            default:
                throw new ApiError(response.status, msg ?? "Something went wrong. Please try again.");
        }
    }

    // Could be { ACK: true, deletedCount: 1 } or the deleted section.
    return body as { acknowledged?: boolean; deletedCount?: number } | Section;
}

/* DEFINITIONS */

export async function createDefinition(data: {
  courseCode: string;
  term: string;
  definition: string;
  example: string;
}) {
  const response = await fetch("/api/v1/definitions/create", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const body = (await response.json().catch(() => ({})));

  if (!response.ok) {
    const msg = getBackendMessage(body);

    switch (response.status) {
      case 401:
        throw new ApiError(response.status, "Only logged-in users may create definitions.");
      case 409:
      case 422:
        throw new ApiError(response.status, msg ?? "Invalid request.");
      default:
        throw new ApiError(response.status, msg ?? "Something went wrong. Please try again.");
    }
  }

  return body as Definition;
}

export async function updateDefinition(data: {
  definitionId: string;
  term?: string;
  definition?: string;
  example?: string;
}) {
  const response = await fetch(`/api/v1/definitions/update/${data.definitionId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const body = (await response.json().catch(() => ({})));

  if (!response.ok) {
    const msg = getBackendMessage(body);

    switch (response.status) {
      case 401:
        throw new ApiError(response.status, "Only logged-in users may update definitions.");
      case 404:
        throw new ApiError(response.status, msg ?? "Definition not found.");
      case 409:
      case 422:
        throw new ApiError(response.status, msg ?? "Invalid request.");
      default:
        throw new ApiError(response.status, msg ?? "Something went wrong. Please try again.");
    }
  }

  return body as Definition;
}

export async function deleteDefinition(data: { definitionId: string }) {
  const response = await fetch(`/api/v1/definitions/delete/${data.definitionId}`, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const body = (await response.json().catch(() => ({})));

  if (!response.ok) {
    const msg = getBackendMessage(body);

    switch (response.status) {
      case 401:
        throw new ApiError(response.status, "Only logged-in users may delete definitions.");
      case 404:
        throw new ApiError(response.status, msg ?? "Definition not found.");
      case 409:
      case 422:
        throw new ApiError(response.status, msg ?? "Invalid request.");
      default:
        throw new ApiError(response.status, msg ?? "Something went wrong. Please try again.");
    }
  }

  return body as { acknowledged?: boolean; deletedCount?: number } | Definition;
}
