-- Initial schema for Dee's Laundromat PostgreSQL.
CREATE TABLE IF NOT EXISTS users (
 id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
 phone TEXT NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'customer',
 verified_email INTEGER NOT NULL DEFAULT 0, verified_phone INTEGER NOT NULL DEFAULT 0,
 preferences TEXT NOT NULL DEFAULT '{"emailUpdates":true,"smsUpdates":true,"marketing":false}',
 created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash TEXT PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS addresses (
 id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 label TEXT NOT NULL, street TEXT NOT NULL, area TEXT NOT NULL, region TEXT NOT NULL,
 phone TEXT NOT NULL, instructions TEXT NOT NULL DEFAULT '', is_default INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS payment_methods (
 id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 kind TEXT NOT NULL, last4 TEXT NOT NULL, expiry TEXT, provider TEXT,
 is_default INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS services (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, rate REAL NOT NULL,
 unit TEXT NOT NULL, image TEXT NOT NULL, is_active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS orders (
 id BIGSERIAL PRIMARY KEY, reference TEXT NOT NULL UNIQUE,
 user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 method TEXT NOT NULL, status TEXT NOT NULL, pickup_date TEXT NOT NULL,
 pickup_slot TEXT NOT NULL, pickup_address_id BIGINT REFERENCES addresses(id) ON DELETE SET NULL,
 delivery_address_id BIGINT REFERENCES addresses(id) ON DELETE SET NULL,
 pickup_snapshot TEXT, delivery_snapshot TEXT,
 contact_phone TEXT NOT NULL, speed TEXT NOT NULL, instructions TEXT NOT NULL DEFAULT '',
 subtotal REAL NOT NULL, express_fee REAL NOT NULL DEFAULT 0, total REAL NOT NULL,
 estimated INTEGER NOT NULL DEFAULT 1, payment_choice TEXT NOT NULL,
 payment_status TEXT NOT NULL, payment_method_id BIGINT REFERENCES payment_methods(id) ON DELETE SET NULL,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS order_items (
 id BIGSERIAL PRIMARY KEY, order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
 service_id TEXT NOT NULL REFERENCES services(id), title TEXT NOT NULL, qty REAL NOT NULL,
 unit TEXT NOT NULL, unit_rate REAL NOT NULL, total REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS order_events (
 id BIGSERIAL PRIMARY KEY, order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
 status TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS chat_messages (
 id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 sender TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL, read_by_admin INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_messages(user_id);
CREATE TABLE IF NOT EXISTS password_resets(token_hash TEXT PRIMARY KEY,user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS email_verifications(token_hash TEXT PRIMARY KEY,user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS inquiries(id BIGSERIAL PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL,category TEXT NOT NULL,message TEXT NOT NULL,created_at TEXT NOT NULL);
