// Maps survey fieldGroup strings to OpenAlex field IDs for paper discovery.

export type FieldGroup =
    | "Design"
    | "Engineering"
    | "Sciences"
    | "Social Sciences"
    | "Humanities"
    | "Medicine"
    | "Business"
    | "Other";

export const fieldMap: Record<FieldGroup, string | null> = {
    Design: "17", // Computer Science — contains HCI and design research subfield
    Engineering: "22",
    Sciences: "17", // Note: Sciences is not a single OpenAlex field. Using Computer Science as representative.
    "Social Sciences": "33",
    Humanities: "12",
    Medicine: "27",
    Business: "14",
    Other: null, // "Other" uses free-text search fallback instead of a specific field ID
};
