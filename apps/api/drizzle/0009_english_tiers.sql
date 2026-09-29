-- The Tiers take their English ids: same TP, same shield, and a frozen Ornament follows its Tier.
UPDATE "ranked_rating" SET "tier" = CASE "tier"
  WHEN 'fer' THEN 'iron'
  WHEN 'argent' THEN 'silver'
  WHEN 'or' THEN 'gold'
  WHEN 'platine' THEN 'platinum'
  WHEN 'diamant' THEN 'diamond'
  ELSE "tier"
END
WHERE "tier" IN ('fer', 'argent', 'or', 'platine', 'diamant');--> statement-breakpoint
UPDATE "ranked_rating" SET "ornament" = CASE "ornament"
  WHEN 'fer' THEN 'iron'
  WHEN 'argent' THEN 'silver'
  WHEN 'or' THEN 'gold'
  WHEN 'platine' THEN 'platinum'
  WHEN 'diamant' THEN 'diamond'
  ELSE "ornament"
END
WHERE "ornament" IN ('fer', 'argent', 'or', 'platine', 'diamant');
