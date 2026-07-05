export const TRACK_NAMES = {
  CORE_1: 'CompTIA A+ Core 1',
  CORE_2: 'CompTIA A+ Core 2',
  HEALTHCARE: 'Advanced Healthcare IT',
  LEARNER_EXPERIENCE: 'Learner Experience',
} as const;

export const TRACK_ORDER = [
  TRACK_NAMES.CORE_1,
  TRACK_NAMES.CORE_2,
  TRACK_NAMES.HEALTHCARE,
  TRACK_NAMES.LEARNER_EXPERIENCE,
] as const;
