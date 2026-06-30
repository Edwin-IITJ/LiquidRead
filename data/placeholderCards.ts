export interface PlaceholderCard {
    id: string;
    source: string;
    sourceColor: string;
    title: string;
    description: string;
    date: string;
    readTime: string;
    gradientFrom: string;
    gradientTo: string;
    patternOpacity: number;
}

const placeholderCards: PlaceholderCard[] = [
    {
        id: "placeholder-1",
        source: "NATURE",
        sourceColor: "#c41c1c",
        title: "Research Paper Title",
        description: "A brief overview of the key findings and implications from this research study, highlighting the most important results...",
        date: "Jun 28, 2026",
        readTime: "8 min read",
        gradientFrom: "#1a1a2e",
        gradientTo: "#16213e",
        patternOpacity: 0.15,
    },
    {
        id: "placeholder-2",
        source: "SCIENCE",
        sourceColor: "#1565c0",
        title: "Another Research Finding",
        description: "Summary of an important study exploring new frontiers in this field, with significant potential for real-world application...",
        date: "Jun 25, 2026",
        readTime: "12 min read",
        gradientFrom: "#0f3460",
        gradientTo: "#533483",
        patternOpacity: 0.12,
    },
    {
        id: "placeholder-3",
        source: "THE LANCET",
        sourceColor: "#00695c",
        title: "Key Discovery in This Domain",
        description: "Researchers present novel evidence that challenges existing assumptions about this topic, opening new avenues for further study...",
        date: "Jun 22, 2026",
        readTime: "6 min read",
        gradientFrom: "#1b262c",
        gradientTo: "#0f4c75",
        patternOpacity: 0.18,
    },
];

export default placeholderCards;
