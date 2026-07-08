// Maps survey fieldGroup strings to OpenAlex field IDs for paper discovery.
// A single string means one field; an array means multiple fields OR'd together.

export type FieldGroup =
    | "Design"
    | "Engineering"
    | "Sciences"
    | "Social Sciences"
    | "Humanities"
    | "Medicine"
    | "Business"
    | "Other";

export const fieldMap: Record<FieldGroup, string | string[] | null> = {
    Design: "17", // Computer Science — contains HCI and design research subfields
    Engineering: "22",
    Sciences: [    // Multiple OpenAlex fields represent the natural sciences umbrella
        "31",      // Physics and Astronomy
        "16",      // Chemistry
        "13",      // Biochemistry, Genetics and Molecular Biology
        "11",      // Agricultural and Biological Sciences
        "26",      // Mathematics
        "23",      // Environmental Science
        "19",      // Earth and Planetary Sciences
        "25",      // Materials Science
    ],
    "Social Sciences": "33",
    Humanities: "12",
    Medicine: "27",
    Business: "14",
    Other: null, // "Other" uses free-text search fallback instead of a specific field ID
};

/**
 * Builds the OpenAlex `topics.field.id` filter fragment for a given fieldMap value.
 * - Single ID: `topics.field.id:31`
 * - Multiple IDs: `topics.field.id:31|16|13|11|26|23|19|25`
 * - null/undefined: returns null (caller should omit the field filter)
 */
export function buildFieldFilter(fieldValue: string | string[] | null | undefined): string | null {
    if (fieldValue === null || fieldValue === undefined) return null;
    if (Array.isArray(fieldValue)) {
        return `topics.field.id:${fieldValue.join("|")}`;
    }
    return `topics.field.id:${fieldValue}`;
}
