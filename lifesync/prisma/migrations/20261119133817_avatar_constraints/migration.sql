ALTER TABLE "UserAvatar" ADD CONSTRAINT "UserAvatar_size" CHECK (octet_length("data") <= 524288 AND "mimeType" IN ('image/jpeg','image/png','image/webp'));
