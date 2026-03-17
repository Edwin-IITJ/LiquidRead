import { Answer, CardType } from '@/types/quiz';

const MAX_RAW_SCORE = 18; // Q1=2, Q2=2, Q3=2, Q4=2, Q5=3, Q6=3, Q7=2 = 18 total

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
    } else if (normalisedScore <= 7.5) {
        cardShown = 'B';
    } else {
        cardShown = 'C';
    }

    return { rawScore, normalisedScore, cardShown };
}
