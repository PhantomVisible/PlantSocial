-- PlantSocial: Clean Break Migration
-- Run this ONCE when upgrading to the new JWT structure (with userId + fullName claims).
-- After running, all users must re-register.

-- Order matters: delete child rows before parent rows
TRUNCATE TABLE post_likes CASCADE;
TRUNCATE TABLE comments CASCADE;
TRUNCATE TABLE posts CASCADE;
TRUNCATE TABLE users CASCADE;
