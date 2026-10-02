export function parseQuestionCondition(value: unknown): { questionId: string; equals: string } | null {
  if (value && typeof value === "object" && "questionId" in value && "equals" in value &&
      typeof value.questionId === "string" && typeof value.equals === "string") {
    return { questionId: value.questionId, equals: value.equals }
  }
  return null
}

export function asAnswerRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
