import { Answer, CardType } from '@/types/quiz';

const MAX_RAW_SCORE = 16;

export interface ScoringResult {
    rawScore: number;
    normalisedScore: number;
    cardShown: CardType;
}

export function calculateScore(answers: Record<string, Answer>): ScoringResult {
    let rawScore = 0;

    for (const [questionId, answer] of Object.entries(answers)) {
        if (questionId !== 'q8') {
            rawScore += answer.points;
        }
    }

    const normalisedScore = parseFloat(((rawScore / MAX_RAW_SCORE) * 10).toFixed(2));

    let cardShown: CardType;
    if (normalisedScore <= 3.75) {
        cardShown = 'A';
    } else if (normalisedScore <= 6.5) {
        cardShown = 'B';
    } else {
        cardShown = 'C';
    }

    return { rawScore, normalisedScore, cardShown };
}
