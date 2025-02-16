CREATE TABLE
    users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    sqlite_sequence (name, seq);

CREATE TABLE
    items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        min_price REAL NOT NULL,
        duration INTEGER NOT NULL CHECK (duration BETWEEN 1 AND 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP NOT NULL,
        authenticated BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (user_id) REFERENCES users (id)
    );

CREATE TABLE
    bids (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        bid_amount REAL NOT NULL,
        bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (item_id) REFERENCES items (id)
    );

CREATE TABLE
    authentication_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        status TEXT CHECK (status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
        expert_id INTEGER,
        request_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (item_id) REFERENCES items (id),
        FOREIGN KEY (expert_id) REFERENCES users (id)
    );

CREATE TABLE
    payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        status TEXT CHECK (status IN ('Pending', 'Completed', 'Failed')) DEFAULT 'Pending',
        payment_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (item_id) REFERENCES items (id)
    );

CREATE TABLE
    watchlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (item_id) REFERENCES items (id)
    );

CREATE TABLE
    notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    );

CREATE TABLE
    item_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
    );

CREATE INDEX idx_item_images_item_id ON item_images (item_id);

CREATE VIEW
    item_current_bids AS
SELECT
    i.id AS item_id,
    i.title,
    i.description,
    i.min_price,
    i.end_time,
    i.authenticated,
    COALESCE(MAX(b.bid_amount), i.min_price) AS current_bid
FROM
    items i
    LEFT JOIN bids b ON i.id = b.item_id
GROUP BY
    i.id;