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

export type TrackColor = 'sky' | 'teal' | 'cyan';

export interface CurriculumTrackDef {
  track: string;
  color: TrackColor;
  domains: readonly string[];
}

export const CURRICULUM_TRACKS: readonly CurriculumTrackDef[] = [
  {
    track: TRACK_NAMES.CORE_1,
    color: 'sky',
    domains: [
      'Domain 1.0 Mobile Devices',
      'Domain 2.0 Networking',
      'Domain 3.0 Hardware',
      'Domain 4.0 Virtualization & Cloud',
      'Domain 5.0 Hardware & Network Troubleshooting',
    ],
  },
  {
    track: TRACK_NAMES.CORE_2,
    color: 'teal',
    domains: [
      'Domain 1.0 Operating Systems',
      'Domain 2.0 Security',
      'Domain 3.0 Software Troubleshooting',
      'Domain 4.0 Operational Procedures',
    ],
  },
  {
    track: TRACK_NAMES.HEALTHCARE,
    color: 'cyan',
    domains: [
      'EHR Architecture',
      'HIPAA Data Security',
      'Clinical Workflows',
    ],
  },
] as const;
