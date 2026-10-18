-- 001_book_copies.sql
-- Step 1 of 2: add per-copy tracking.
-- Safe to run more than once. Nothing is deleted.

BEGIN;

-- 1) One row per physical copy.
--    copy_id is typed by the librarian (same as the sticker on the book).
CREATE TABLE IF NOT EXISTS book_copy (
    copy_id    INTEGER PRIMARY KEY,
    book_id    INTEGER NOT NULL REFERENCES book(book_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS book_copy_book_id_idx ON book_copy (book_id);

-- 2) Every existing book becomes copy #1 of itself (copy_id = book_id).
INSERT INTO book_copy (copy_id, book_id)
SELECT book_id, book_id FROM book
ON CONFLICT (copy_id) DO NOTHING;

-- 3) borrow now also points to a specific copy.
--    The old book_id column stays for now so the live site keeps working
--    while we change the code. We remove it in the last step.
ALTER TABLE borrow
    ADD COLUMN IF NOT EXISTS copy_id INTEGER REFERENCES book_copy(copy_id);

-- 4) Existing borrows: point them at the copy we just created.
UPDATE borrow SET copy_id = book_id WHERE copy_id IS NULL;

CREATE INDEX IF NOT EXISTS borrow_copy_id_idx ON borrow (copy_id);

COMMIT;