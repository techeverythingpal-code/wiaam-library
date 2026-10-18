-- schema.sql
-- Reference copy of the tables added/changed after the first version.
-- The real database lives in Neon; run migrations/ files there.

-- book        = one row per TITLE (book_id, book_name, auther, age_group, book_cover)
-- book_copy   = one row per PHYSICAL COPY (this file, below)
-- borrow      = one row per loan, pointing to a specific COPY

-- book_copy: every physical copy has its own id (the sticker/barcode number,
-- typed by the librarian).
CREATE TABLE IF NOT EXISTS book_copy (
    copy_id    INTEGER PRIMARY KEY,
    book_id    INTEGER NOT NULL REFERENCES book(book_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS book_copy_book_id_idx ON book_copy (book_id);

-- borrow now points to a copy (see migrations/001_book_copies.sql)
ALTER TABLE borrow
    ADD COLUMN IF NOT EXISTS copy_id INTEGER REFERENCES book_copy(copy_id);

CREATE INDEX IF NOT EXISTS borrow_copy_id_idx ON borrow (copy_id);

-- borrow_request: requests sent by visitors from the public home page.
-- A request is for a TITLE (book_id), not a specific copy.
-- NOTE: reconstructed from the code (INSERT/SELECT/UPDATE queries); compare with your real table.
CREATE TABLE IF NOT EXISTS borrow_request (
    request_id     SERIAL PRIMARY KEY,
    book_id        INTEGER NOT NULL REFERENCES book(book_id) ON DELETE CASCADE,
    requester_name VARCHAR(100) NOT NULL,
    phone          VARCHAR(20)  NOT NULL,
    note           VARCHAR(500),
    status         VARCHAR(10)  NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS borrow_request_status_idx ON borrow_request (status);