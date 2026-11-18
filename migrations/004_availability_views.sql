-- 004_availability_views.sql
-- One place for the rule "is this book available / which copies are free".
-- The pages read these views instead of repeating the same SQL.
-- A view is a saved query: it holds no data of its own, so it is always up to date.
-- Safe to run more than once (CREATE OR REPLACE). Nothing is deleted.

BEGIN;

-- 1) Copies that are on the shelf right now (no active borrow).
CREATE OR REPLACE VIEW free_copy AS
SELECT c.copy_id, c.book_id, c.copy_number
FROM book_copy c
WHERE NOT EXISTS (
    SELECT 1 FROM borrow b
    WHERE b.copy_id = c.copy_id AND b.flag = true
);

-- 2) One row per book with its availability.
--    total_copies     = how many copies the book has
--    available_copies = how many of them are free
--    is_available     = can it be lent right now?
--      - book with copies:    at least one copy is free
--      - book without copies: the book itself is not borrowed
CREATE OR REPLACE VIEW book_availability AS
SELECT
    bk.book_id,
    COALESCE(tc.total, 0)::int AS total_copies,
    COALESCE(fc.free, 0)::int  AS available_copies,
    CASE
        WHEN COALESCE(tc.total, 0) > 0 THEN COALESCE(fc.free, 0) > 0
        ELSE NOT EXISTS (
            SELECT 1 FROM borrow b
            WHERE b.book_id = bk.book_id AND b.flag = true
        )
    END AS is_available
FROM book bk
LEFT JOIN (
    SELECT book_id, COUNT(*) AS total FROM book_copy GROUP BY book_id
) tc ON tc.book_id = bk.book_id
LEFT JOIN (
    SELECT book_id, COUNT(*) AS free FROM free_copy GROUP BY book_id
) fc ON fc.book_id = bk.book_id;

COMMIT;