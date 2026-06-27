-- Elevate the TCP/IP Protocol Suite article to a live Jamin Ware founder article.
-- Jamin Ware contributor UUID: a1b2c3d4-e5f6-7890-abcd-ef1234567890

UPDATE articles
SET
  title          = 'TCP/IP Protocol Suite — Four-Layer Model, IPv4 vs. IPv6 & Packet Transmission',
  excerpt        = 'A production-grade breakdown of the four-layer TCP/IP model, IPv4 vs. IPv6 header architecture, and stateful vs. stateless packet transmission workflows for CompTIA A+ Core 1 Domain 2.0.',
  is_sample      = false,
  is_featured    = true,
  contributor_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  tags           = ARRAY['TCP/IP', 'Networking', 'IPv4', 'IPv6', 'Core1', 'Domain2']
WHERE slug = 'core1-networking/sample-protocols';
