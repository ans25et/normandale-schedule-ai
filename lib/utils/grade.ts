const gradeOrder = [
  "F",
  "D",
  "D+",
  "C-",
  "C",
  "C+",
  "B-",
  "B",
  "B+",
  "A-",
  "A"
];

export function normalizeGrade(input: string): string {
  return input.trim().toUpperCase();
}

export function isPassingGrade(grade: string): boolean {
  const normalized = normalizeGrade(grade);
  if (normalized === "P") {
    return true;
  }
  if (["F", "W", "NP", "Z"].includes(normalized)) {
    return false;
  }
  return gradeOrder.includes(normalized);
}

export function gradeMeetsMinimum(actual: string, minimum?: string): boolean {
  if (!minimum) {
    return isPassingGrade(actual);
  }

  const normalizedActual = normalizeGrade(actual);
  const normalizedMinimum = normalizeGrade(minimum);

  if (normalizedActual === "P") {
    return true;
  }

  const actualIndex = gradeOrder.indexOf(normalizedActual);
  const minimumIndex = gradeOrder.indexOf(normalizedMinimum);

  if (actualIndex === -1 || minimumIndex === -1) {
    return false;
  }

  return actualIndex >= minimumIndex;
}
