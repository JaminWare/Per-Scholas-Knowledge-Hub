-- Seed two Diagrams founder articles authored by Jamin Ware
INSERT INTO articles (slug, title, excerpt, content, tags, is_featured, is_sample, section_id, contributor_id)
VALUES
  (
    'diagrams/network-topology-architecture',
    'Enterprise Three-Tier Network Topology Architecture',
    'An interactive, scalable infrastructure map detailing Core, Distribution, and Access layer switch isolation matrices.',
    '',
    ARRAY['diagrams','networking','topology','core1','architecture'],
    false,
    false,
    (SELECT id FROM sections WHERE slug = 'diagrams' LIMIT 1),
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  ),
  (
    'diagrams/osi-pdu-flow',
    'OSI Model Data Encapsulation & Protocol Data Unit (PDU) Flow',
    'A structural visual alignment mapping headers, trailers, and encapsulation data shifts down to physical bits.',
    '',
    ARRAY['diagrams','OSI','PDU','networking','encapsulation'],
    false,
    false,
    (SELECT id FROM sections WHERE slug = 'diagrams' LIMIT 1),
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  )
ON CONFLICT (slug) DO NOTHING;
