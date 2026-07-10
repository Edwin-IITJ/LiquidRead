// API route that fetches and formats recent open-access academic papers from OpenAlex by academic field.

import { NextResponse } from "next/server";
import { fieldMap, FieldGroup, buildFieldFilter } from "@/utils/fieldMap";
import { reconstructAbstract } from "@/utils/reconstructAbstract";

const MAILTO = "edwinmeleth@gmail.com";
const BASE_FILTERS = [
    "has_abstract:true",
    "has_doi:true",
    "open_access.is_oa:true",
    "type:article",
    "from_publication_date:2021-01-01"
].join(",");

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const fieldGroupParam = searchParams.get("fieldGroup");
        const searchQuery = searchParams.get("search");       // free-text search for Relevant tab
        const perPageParam = searchParams.get("perPage");     // configurable page size
        const perPage = Math.min(Math.max(parseInt(perPageParam ?? "5", 10) || 5, 1), 15);

        if (!fieldGroupParam) {
            return NextResponse.json(
                { error: "Missing fieldGroup query parameter" },
                { status: 400 }
            );
        }

        // Build the filter string
        let filterString: string;
        let sortString: string;
        const fieldValue = fieldMap[fieldGroupParam as FieldGroup];
        const fieldFilter = buildFieldFilter(fieldValue);

        if (searchQuery) {
            // Explicit search query (e.g. Relevant tab) — combine with field filter if available
            filterString = fieldFilter ? `${BASE_FILTERS},${fieldFilter}` : BASE_FILTERS;
            sortString = "&sort=relevance_score:desc";
        } else if (fieldFilter) {
            // Known field with a valid OpenAlex ID(s)
            filterString = `${BASE_FILTERS},${fieldFilter}`;
            sortString = "&sort=cited_by_count:desc";
        } else {
            // "Other" or unknown field — use free-text search, no field filter
            filterString = BASE_FILTERS;
            sortString = "&sort=relevance_score:desc";
        }

        // Determine the search= clause
        const searchClause = searchQuery
            ? `&search=${encodeURIComponent(searchQuery)}`
            : (!fieldFilter ? `&search=${encodeURIComponent(fieldGroupParam)}` : "");

        // Build the full OpenAlex URL
        const openAlexUrl =
            `https://api.openalex.org/works` +
            `?filter=${filterString}` +
            searchClause +
            sortString +
            `&select=id,title,abstract_inverted_index,authorships,publication_year,cited_by_count,doi,primary_location,primary_topic` +
            `&per_page=${perPage}` +
            `&mailto=${MAILTO}`;

        // Log the URL for debugging
        console.log("OpenAlex URL:", openAlexUrl);

        const response = await fetch(openAlexUrl);

        if (!response.ok) {
            return NextResponse.json(
                { error: `OpenAlex API error: ${response.status} ${response.statusText}` },
                { status: 502 }
            );
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            return NextResponse.json(
                { error: "No papers found for this field" },
                { status: 404 }
            );
        }

        interface OpenAlexWork {
            title?: string;
            abstract_inverted_index?: Record<string, number[]>;
            publication_year?: number;
            cited_by_count?: number;
            doi?: string;
            primary_location?: {
                source?: { display_name?: string };
                landing_page_url?: string;
                pdf_url?: string;
            };
        }

        const papers = data.results.map((work: OpenAlexWork) => ({
            title: work.title ?? "Unknown Title",
            abstract: reconstructAbstract(work.abstract_inverted_index ?? {}),
            year: work.publication_year ?? 0,
            citationCount: work.cited_by_count ?? 0,
            doi: work.doi ?? "",
            journal: work.primary_location?.source?.display_name ?? "Unknown Journal",
            openAccessUrl:
                work.primary_location?.landing_page_url ??
                work.primary_location?.pdf_url ??
                ""
        }));

        return NextResponse.json(papers);

    } catch (error) {
        console.error("Error in fetch-papers route:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
