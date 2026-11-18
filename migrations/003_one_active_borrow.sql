-- 003_one_active_borrow.sql
-- The database itself makes sure an item can only be borrowed once at a time:
--   - a copy can have only one active borrow
--   - a book WITHOUT copies can have only one active borrow (of the book itself)
-- Safe to run more than once. Nothing is deleted.

BEGIN;

-- 1) Stop with a clear message if the data already breaks the rule.
--    (Then we fix those rows first and run this file again.)
DO $$
BEGIN
    IF EXISTS (
        SELECT copy_id FROM borrow
        WHERE flag = true AND copy_id IS NOT NULL
        GROUP BY copy_id HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'A copy has more than one active borrow. Fix those rows first.';
    END IF;

    IF EXISTS (
        SELECT book_id FROM borrow
        WHERE flag = true AND copy_id IS NULL
        GROUP BY book_id HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'A book has more than one active borrow without a copy. Fix those rows first.';
    END IF;
END $$;

-- 2) A copy: at most one active borrow.
CREATE UNIQUE INDEX IF NOT EXISTS borrow_one_active_per_copy
    ON borrow (copy_id)
    WHERE flag = true AND copy_id IS NOT NULL;

-- 3) A book without copies: at most one active borrow.
CREATE UNIQUE INDEX IF NOT EXISTS borrow_one_active_per_book_without_copy
    ON borrow (book_id)
    WHERE flag = true AND copy_id IS NULL;

COMMIT;