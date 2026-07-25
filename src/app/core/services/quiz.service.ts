import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  AnswerValue,
  Quiz,
  QuizEvaluation,
  QuizQuestion,
  QuestionResult,
} from '../models/quiz.model';

/** Loads quiz definitions and grades a set of answers. */
@Injectable({ providedIn: 'root' })
export class QuizService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, Quiz | null>();

  /** Returns the quiz for a lesson, or null if none exists. */
  async loadQuizForLesson(lessonId: string): Promise<Quiz | null> {
    if (this.cache.has(lessonId)) return this.cache.get(lessonId)!;
    try {
      const quiz = await firstValueFrom(
        this.http.get<Quiz>(`quizzes/${lessonId}.json`),
      );
      this.cache.set(lessonId, quiz);
      return quiz;
    } catch {
      this.cache.set(lessonId, null);
      return null;
    }
  }

  evaluate(quiz: Quiz, answers: Record<string, AnswerValue>): QuizEvaluation {
    const results: QuestionResult[] = quiz.questions.map((q) => ({
      questionId: q.id,
      userAnswer: answers[q.id] ?? '',
      correct: this.isCorrect(q, answers[q.id]),
    }));

    const correctCount = results.filter((r) => r.correct).length;
    const total = quiz.questions.length;
    const score = total === 0 ? 0 : Math.round((correctCount / total) * 100);

    return {
      total,
      correctCount,
      score,
      passed: score >= quiz.passingScore,
      results,
    };
  }

  private isCorrect(q: QuizQuestion, answer: AnswerValue | undefined): boolean {
    if (answer == null) return false;
    switch (q.type) {
      case 'single-choice':
        return answer === q.answer;

      case 'multiple-choice': {
        const a = this.asArray(answer);
        return (
          a.length === q.answer.length &&
          q.answer.every((id) => a.includes(id))
        );
      }

      case 'fill-blank': {
        const text = String(answer).trim().toLowerCase();
        return q.answer.some((acc) => acc.trim().toLowerCase() === text);
      }

      case 'ordering': {
        const a = this.asArray(answer);
        return (
          a.length === q.answer.length &&
          q.answer.every((id, i) => a[i] === id)
        );
      }

      case 'match-pair': {
        if (typeof answer !== 'object' || Array.isArray(answer)) return false;
        return q.pairs.every((p) => answer[p.left] === p.right);
      }
    }
  }

  private asArray(v: AnswerValue): string[] {
    return Array.isArray(v) ? v : [String(v)];
  }
}
