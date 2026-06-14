-- ───────────────────────────────────────────────────────────────────────────
-- Swap the loremflickr placeholders for real Unsplash product photos.
-- ───────────────────────────────────────────────────────────────────────────
-- loremflickr.com started returning 403 Forbidden in mid-2026 (hotlink block),
-- so every image in the previous seed renders as a broken placeholder. This
-- migration UPDATEs each (listingId, position) row with a verified Unsplash
-- direct-CDN URL. Each photo was hand-curated to match the product:
-- PlayStation IDs show a PS5, MacBook IDs show a MacBook, etc.
--
-- Idempotent — UPDATEs are scoped to the seeded listing IDs only. Safe to
-- re-run against any DB.
-- ───────────────────────────────────────────────────────────────────────────

UPDATE tenant_soukelkanto.listing_photos AS lp
SET url = u.new_url
FROM (VALUES
  -- 1. Sony PlayStation 5 (2 photos)
  ('aaaa0001-0000-0000-0000-000000000001', 0, 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=640&h=480&q=80'),
  ('aaaa0001-0000-0000-0000-000000000001', 1, 'https://images.unsplash.com/photo-1592890288564-76628a30a657?auto=format&fit=crop&w=640&h=480&q=80'),

  -- 2. MacBook Air M2 (3 photos)
  ('aaaa0002-0000-0000-0000-000000000002', 0, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=640&h=480&q=80'),
  ('aaaa0002-0000-0000-0000-000000000002', 1, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=640&h=480&q=80'),
  ('aaaa0002-0000-0000-0000-000000000002', 2, 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=640&h=480&q=80'),

  -- 3. IKEA MALM dresser (2 photos)
  ('aaaa0003-0000-0000-0000-000000000003', 0, 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=640&h=480&q=80'),
  ('aaaa0003-0000-0000-0000-000000000003', 1, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=640&h=480&q=80'),

  -- 4. Cosatto stroller (1 photo)
  ('aaaa0004-0000-0000-0000-000000000004', 0, 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=640&h=480&q=80'),

  -- 5. Samsung TV (2 photos)
  ('aaaa0005-0000-0000-0000-000000000005', 0, 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=640&h=480&q=80'),
  ('aaaa0005-0000-0000-0000-000000000005', 1, 'https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?auto=format&fit=crop&w=640&h=480&q=80'),

  -- 6. Nike sneakers (1 photo)
  ('aaaa0006-0000-0000-0000-000000000006', 0, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=640&h=480&q=80'),

  -- 7. Brio wooden train (2 photos)
  ('aaaa0007-0000-0000-0000-000000000007', 0, 'https://images.unsplash.com/photo-1558877385-81a1c7e67d72?auto=format&fit=crop&w=640&h=480&q=80'),
  ('aaaa0007-0000-0000-0000-000000000007', 1, 'https://images.unsplash.com/photo-1572635148818-ef6fd45eb394?auto=format&fit=crop&w=640&h=480&q=80'),

  -- 8. iPhone 14 Pro Max (3 photos)
  ('aaaa0008-0000-0000-0000-000000000008', 0, 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=640&h=480&q=80'),
  ('aaaa0008-0000-0000-0000-000000000008', 1, 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=640&h=480&q=80'),
  ('aaaa0008-0000-0000-0000-000000000008', 2, 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=640&h=480&q=80'),

  -- 9. Dining table + chairs (2 photos)
  ('aaaa0009-0000-0000-0000-000000000009', 0, 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=640&h=480&q=80'),
  ('aaaa0009-0000-0000-0000-000000000009', 1, 'https://images.unsplash.com/photo-1606889464198-fcb18894cf50?auto=format&fit=crop&w=640&h=480&q=80'),

  -- 10. Bosch washing machine (1 photo)
  ('aaaa0010-0000-0000-0000-000000000010', 0, 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=640&h=480&q=80'),

  -- 11. Yoga + dumbbells (1 photo)
  ('aaaa0011-0000-0000-0000-000000000011', 0, 'https://images.unsplash.com/photo-1591291621164-2c6367723315?auto=format&fit=crop&w=640&h=480&q=80'),

  -- 12. Kindle Paperwhite (2 photos)
  ('aaaa0012-0000-0000-0000-000000000012', 0, 'https://images.unsplash.com/photo-1592496001020-d31bd830651f?auto=format&fit=crop&w=640&h=480&q=80'),
  ('aaaa0012-0000-0000-0000-000000000012', 1, 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=640&h=480&q=80'),

  -- 13. Toddler bicycle (1 photo)
  ('aaaa0013-0000-0000-0000-000000000013', 0, 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=640&h=480&q=80'),

  -- 14. Leica M3 + Summicron lens (3 photos)
  ('aaaa0014-0000-0000-0000-000000000014', 0, 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=640&h=480&q=80'),
  ('aaaa0014-0000-0000-0000-000000000014', 1, 'https://images.unsplash.com/photo-1495707902641-75cac588d2e9?auto=format&fit=crop&w=640&h=480&q=80'),
  ('aaaa0014-0000-0000-0000-000000000014', 2, 'https://images.unsplash.com/photo-1606918801925-e2c914c4b503?auto=format&fit=crop&w=640&h=480&q=80')
) AS u(listing_id, "position", new_url)
WHERE lp."listingId" = u.listing_id AND lp.position = u.position;
