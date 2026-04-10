-- Rename effect_id 'punch' → 'fighter' in effect_progress table
UPDATE "effect_progress" SET "effect_id" = 'fighter' WHERE "effect_id" = 'punch';
