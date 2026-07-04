-- The ArticlePage.tsx rendering checks expect these slugs under core1-networking/
-- but the original seed migration placed them under learner-experience/diagrams-*.
-- Realign so the specialized React diagram renderers fire correctly.

UPDATE articles
SET slug = 'core1-networking/network-topology-architecture'
WHERE id = '9cad3e93-53cc-4e55-b848-7ba668b4499b'
  AND slug = 'learner-experience/diagrams-network-topology-architecture';

UPDATE articles
SET slug = 'core1-networking/osi-pdu-flow'
WHERE id = 'c02b3573-1937-4b63-9642-01371f476bbb'
  AND slug = 'learner-experience/diagrams-osi-pdu-flow';