export function slugifyCourseCode(code: string) {
    return (code ?? "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s/g, "-");
}


export function normalizeAttributes(attributes: unknown): string[] {
    if (Array.isArray(attributes)) {
        return attributes.map(String).map((s) => s.trim()).filter(Boolean);
    }
    if (typeof attributes === "string") {
        return attributes
        .split(/[,;|]/g)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
}

// Lab boolean is not in database.
export function inferHasLab(attrs: string[], raw: string) {// Stryker disable next-line StringLiteral
    const text = `${attrs.join(" ")} ${raw ?? ""}`.toLowerCase();
    return /\blab\b|\blaboratory\b/.test(text);
}