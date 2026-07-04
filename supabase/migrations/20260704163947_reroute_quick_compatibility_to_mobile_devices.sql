-- Reroute "Quick compatibility checks" from Networking to Mobile Devices (Domain 1.0)
-- Content is about M.2 NVMe vs SATA laptop storage upgrades (1.1 Laptop Hardware)
UPDATE articles
SET slug = 'core1-mobile/quick-compatibility-checks',
    section_id = '747c6f2c-fbea-4a49-851d-fbc06b8e0637',
    study_category = 'CompTIA A+ Core 1 Domain 1.0 (Mobile Devices)'
WHERE id = '628e12d3-fcfe-4a60-86b4-e36a3c9e7d5b';

-- Update source submission track
UPDATE submissions
SET track = 'CompTIA A+ Core 1 Domain 1.0 (Mobile Devices)'
WHERE id = '7fc3bcdf-d19e-4d97-88d2-724a915be33c';
