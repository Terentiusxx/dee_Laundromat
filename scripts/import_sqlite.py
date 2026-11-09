"""One-off migration of existing SQLite records into a NEW PostgreSQL database.

Run with DATABASE_URL and SQLITE_SOURCE set. Does not overwrite existing records.
Take a backup first. Avoid running this twice.
"""
import os, sqlite3, sys
from pathlib import Path
import psycopg

TABLES = ['users','services','addresses','payment_methods','sessions','orders',
          'order_items','order_events','chat_messages','password_resets',
          'email_verifications','inquiries']
IDENTITY = ['users','addresses','payment_methods','orders','order_items',
            'order_events','chat_messages','inquiries']

def main():
 src=Path(os.environ.get('SQLITE_SOURCE',''))
 url=os.environ.get('DATABASE_URL','')
 if not src.is_file() or not url:
  sys.exit('Set SQLITE_SOURCE to an existing SQLite file and DATABASE_URL to PostgreSQL.')
 sqlite=sqlite3.connect(f'file:{src}?mode=ro',uri=True)
 sqlite.row_factory=sqlite3.Row
 with psycopg.connect(url) as target:
  with target.cursor() as cur:
   for table in TABLES:
    rows=sqlite.execute(f'SELECT * FROM {table}').fetchall()
    if not rows:continue
    existing=cur.execute(f'SELECT COUNT(*) FROM {table}').fetchone()[0]
    if existing:sys.exit(f'Refusing import: PostgreSQL table {table} is not empty.')
    columns=list(rows[0].keys())
    names=','.join('"'+name+'"' for name in columns)
    params=','.join(['%s']*len(columns))
    for row in rows:
     cur.execute(f'INSERT INTO {table} ({names}) VALUES ({params})',tuple(row))
    print(f'{table}: {len(rows)} rows')
   for table in IDENTITY:
    cur.execute(f"SELECT setval(pg_get_serial_sequence('{table}','id'), COALESCE((SELECT MAX(id) FROM {table}), 1), EXISTS(SELECT 1 FROM {table}))")
 print('Import committed.')
if __name__=='__main__':main()
