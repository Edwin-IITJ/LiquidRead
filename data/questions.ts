import { Question } from '@/types/quiz';

export const questions: Question[] = [
    {
        id: 'q1',
        text: 'You open an article about a topic you don\'t know well. After two paragraphs, it gets complicated. What do you usually do?',
        type: 'single',
        options: [
            { id: 'A', label: 'Keep reading, figuring it out is the point', points: 2 },
            { id: 'B', label: 'Re-read the paragraph more slowly until it clicks', points: 2 },
            { id: 'C', label: 'Skim ahead to see if it gets clearer', points: 1 },
            { id: 'D', label: 'Look for a simpler explanation elsewhere', points: 0 },
        ],
    },
    {
        id: 'q2',
        text: 'You have 20 minutes to spend on research. Which feels more satisfying?',
        type: 'single',
        options: [
            { id: 'A', label: 'Going deep on one paper that\'s highly relevant to what I\'m working on', points: 2 },
            { id: 'B', label: 'Scanning 6–8 headlines to get a broad picture of what\'s happening in my field', points: 0 },
        ],
    },
    {
        id: 'q3',
        text: 'How do you usually come across research that turns out to be important to you?',
        type: 'single',
        options: [
            { id: 'A', label: 'I actively search for it when I need it', points: 2 },
            { id: 'B', label: 'It finds me through people I follow, newsletters, or recommendations', points: 1 },
            { id: 'C', label: 'A mix of both, depending on what I\'m working on', points: 1 },
            { id: 'D', label: 'Honestly, I mostly miss it and find out later', points: 0 },
        ],
    },
    {
        id: 'q4',
        text: 'Right now, reading research for you is mostly about…',
        type: 'single',
        options: [
            { id: 'A', label: 'Staying current in my field generally', points: 1 },
            { id: 'B', label: 'Going deep on something specific I\'m building or writing', points: 2 },
            { id: 'C', label: 'Satisfying curiosity, no particular agenda', points: 1 },
            { id: 'D', label: 'Preparing for something specific - a presentation, a thesis, a meeting', points: 1 },
        ],
    },
    {
        id: 'q5',
        text: 'Which of these headlines makes you want to read more?',
        type: 'single',
        layout: 'visual-cards',
        options: [
            {
                id: 'A',
                label: '"Doctors who sleep less make more diagnostic errors, new study finds" (Plain Language)',
                points: 0,
            },
            {
                id: 'B',
                label: '"Sleep deprivation correlates with increased Type II error rates in differential diagnosis — meta-analysis of 14 studies" (Technical)',
                points: 3,
            },
            {
                id: 'C',
                label: 'chart', // special: render SVG inline
                points: 2,
            },
        ],
    },
    {
        id: 'q6',
        text: 'When you open something to read, you typically have…',
        type: 'single',
        options: [
            { id: 'A', label: '5 minutes or less', points: 0 },
            { id: 'B', label: '10–15 minutes', points: 2 },
            { id: 'C', label: '30+ minutes — I settle in when I read', points: 3 },
        ],
    },
    {
        id: 'q7',
        text: 'When you get a recommendation that turns out to be irrelevant to you, you…',
        type: 'single',
        options: [
            { id: 'A', label: 'Get annoyed, it wastes my time', points: 2 },
            { id: 'B', label: 'Don\'t mind, unexpected discoveries happen this way', points: 0 },
            { id: 'C', label: 'Depends on how often it happens', points: 1 },
        ],
    },
    {
        id: 'q9',
        text: 'When you hear about an interesting research finding, what do you want to know first?',
        type: 'single',
        options: [
            { id: 'A', label: 'Where it came from, who did this and where was it published?', points: 0 },
            { id: 'B', label: 'What exactly they found, the numbers and specifics', points: 0 },
            { id: 'C', label: 'Why it matters, what does this change or mean?', points: 0 },
            { id: 'D', label: 'How it fits with things I already know', points: 0 },
        ],
    },
    {
        id: 'q8',
        text: 'What field or topic are you most interested in right now? (1–3 words is fine)',
        type: 'text',
    },
];
