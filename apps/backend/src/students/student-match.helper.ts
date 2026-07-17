export const STUDENT_MATCH_FIELDS = [
  'startSession',
  'endSession',
  'dateOfApplication',
  'studentName',
  'fatherName',
  'dob',
  'mobileNumbers',
  'email',
  'motherName',
  'category',
  'fatherOccupation',
  'defenceService',
  'jobDescription',
  'class',
  'presentSchool'
];

export const STUDENT_MATCH_STRONG_FIELDS = [
  'studentName',
  'fatherName',
  'mobileNumbers',
  'dob',
  'email'
];

export const DB_DUPLICATE_MATCH_FIELDS = [
  'studentName',
  'fatherName',
  'dob',
  'mobileNumbers',
  'email',
  'motherName',
  'category',
  'fatherOccupation',
  'defenceService',
  'jobDescription',
  'class',
  'presentSchool'
];

export function normalizeStudentId(value: any): string {
  if (value === null || value === undefined) return '';
  return value.toString().trim().replace(/\s+/g, '').toUpperCase();
}

export function normalizeStudentIdComparable(value: any): string {
  const normalized = normalizeStudentId(value);
  if (!normalized) return '';
  const numericLike = normalized.match(/^(\d+)(?:\.0+)?$/);
  if (numericLike) {
    return numericLike[1];
  }
  return normalized.replace(/[^A-Z0-9]/g, '');
}

export function normalizeDateValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return '';
    return value.toISOString().split('T')[0];
  }
  const raw = value.toString().trim();
  if (!raw) return '';

  let match = raw.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (match) {
    const y = match[1];
    const m = match[2].padStart(2, '0');
    const d = match[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  match = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (match) {
    const d = match[1].padStart(2, '0');
    const m = match[2].padStart(2, '0');
    const y = match[3];
    return `${y}-${m}-${d}`;
  }

  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return raw.toLowerCase();
}

export function normalizeMatchField(field: string, value: any): string {
  if (value === null || value === undefined) return '';
  if (['dob', 'dateOfApplication', 'startSession', 'endSession'].includes(field)) {
    return normalizeDateValue(value);
  }
  const str = value.toString().trim();
  if (!str) return '';
  if (field === 'mobileNumbers') {
    return str.replace(/\D+/g, '');
  }
  if (field === 'email') {
    return str.replace(/\s+/g, '').toLowerCase();
  }
  const cleaned = str.replace(/[^a-zA-Z0-9\s]/g, ' ');
  return cleaned.replace(/\s+/g, ' ').trim().toLowerCase();
}

export function buildStudentMatchKey(row: any): string {
  const values = STUDENT_MATCH_FIELDS.map(field => normalizeMatchField(field, row ? row[field] : ''));
  const hasData = values.some(value => value !== '');
  if (!hasData) return '';
  return values.join('||');
}

export function buildDatabaseDuplicateKey(row: any): string {
  const values = DB_DUPLICATE_MATCH_FIELDS.map(field => normalizeMatchField(field, row ? row[field] : ''));
  const hasData = values.some(value => value !== '');
  if (!hasData) return '';
  return values.join('||');
}

export function getMatchScore(left: any, right: any) {
  let score = 0;
  let compared = 0;
  let strongMatched = false;
  let strongFieldPresent = false;
  let hasConflict = false;

  for (const field of STUDENT_MATCH_FIELDS) {
    const leftVal = normalizeMatchField(field, left[field]);
    const rightVal = normalizeMatchField(field, right[field]);

    if (!leftVal && !rightVal) continue;

    if (STUDENT_MATCH_STRONG_FIELDS.includes(field) && (leftVal || rightVal)) {
      strongFieldPresent = true;
    }

    if (!leftVal || !rightVal) continue;

    compared += 1;
    if (leftVal === rightVal) {
      score += 1;
      if (STUDENT_MATCH_STRONG_FIELDS.includes(field)) {
        strongMatched = true;
      }
    } else {
      hasConflict = true;
    }
  }

  return { score, compared, strongMatched, strongFieldPresent, conflict: hasConflict };
}

export function findNonConflictingBestMatches(admission: any, dbStudents: any[], minCompared = 3) {
  const matches: { row: any; score: number; compared: number; matchType: 'strict' | 'relaxed' }[] = [];

  for (const row of dbStudents) {
    const result = getMatchScore(admission, row);
    if (result.conflict) continue;
    if (result.strongFieldPresent && !result.strongMatched) continue;
    if (result.compared < minCompared) continue;
    matches.push({ row, score: result.score, compared: result.compared, matchType: 'relaxed' });
  }

  if (matches.length === 0) return [];
  matches.sort((a, b) => b.score - a.score);
  const maxScore = matches[0].score;
  return matches.filter(m => m.score === maxScore);
}
