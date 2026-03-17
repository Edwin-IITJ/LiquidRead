// Reconstructs an abstract text block from an OpenAlex abstract_inverted_index object.

export function reconstructAbstract(invertedIndex: Record<string, number[]> | null | undefined): string {
    if (!invertedIndex) return "";

    // Find the maximum position to determine the size of the array
    let maxPos = -1;
    for (const positions of Object.values(invertedIndex)) {
        for (const pos of positions) {
            if (pos > maxPos) {
                maxPos = pos;
            }
        }
    }

    if (maxPos === -1) return "";

    // Create an array to hold the words in order
    const words: string[] = new Array(maxPos + 1).fill("");

    // Populate the array using the inverted index
    for (const [word, positions] of Object.entries(invertedIndex)) {
        for (const pos of positions) {
            words[pos] = word;
        }
    }

    // Join with spaces, filtering out any empty slots just in case
    return words.filter(word => word !== "").join(" ");
}
