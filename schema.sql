-- borrow_request: requests sent by visitors from the public home page.
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