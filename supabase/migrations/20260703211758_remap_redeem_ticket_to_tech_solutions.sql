/*
# Remap Redeem's ticket to Learner Experience Tech Solutions

1. Purpose
- Redeem Grimm's "Zoom mic not picking up audio in class" ticket was incorrectly
  categorized under CompTIA A+ Core 1 Domain 3.0 (Hardware).
- This migration re-routes it to the Learner Experience - Tech Solutions section
  under the "Hardware & AV Setup" focus area.

2. Modified Rows
- `submissions` row (id: b27119b6-e163-49e7-b2eb-2b4180a26930):
  - track → 'Learner Experience - Tech Solutions'
  - lx_stage → 'labs'
  - lx_topic → 'Hardware & AV Setup'
  - type → 'deskolas'
- `articles` row (id: 1f36345b-78f6-4966-a4d3-a0755860f765):
  - study_category → 'Learner Experience - Tech Solutions'
  - slug → 'learner-experience/zoom-mic-not-picking-up-audio-in-class'
  - lx_stage → 'labs'
  - lx_topic → 'Hardware & AV Setup'

3. Important Notes
- Safe to re-run (idempotent - updates by primary key).
- No schema changes.
*/

UPDATE submissions
SET
  track = 'Learner Experience - Tech Solutions',
  lx_stage = 'labs',
  lx_topic = 'Hardware & AV Setup',
  type = 'deskolas'
WHERE id = 'b27119b6-e163-49e7-b2eb-2b4180a26930';

UPDATE articles
SET
  study_category = 'Learner Experience - Tech Solutions',
  slug = 'learner-experience/zoom-mic-not-picking-up-audio-in-class',
  lx_stage = 'labs',
  lx_topic = 'Hardware & AV Setup'
WHERE id = '1f36345b-78f6-4966-a4d3-a0755860f765';
