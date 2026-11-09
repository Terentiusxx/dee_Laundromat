"""Create one administrator when DEMO_MODE=false. Read password from environment."""
import os
from .main import init_db,connection,password_hash,utcnow

def main():
 email=os.getenv('ADMIN_EMAIL','').lower().strip()
 password=os.getenv('ADMIN_PASSWORD','')
 name=os.getenv('ADMIN_NAME','Dee Administrator')
 if not email or '@' not in email or len(password)<14:
  raise SystemExit('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 14 characters) before bootstrap.')
 init_db()
 with connection() as c:
  if c.execute('SELECT 1 FROM users WHERE email=?',(email,)).fetchone():
   raise SystemExit('Account already exists; admin bootstrap will not change its role.')
  c.execute('INSERT INTO users(name,email,phone,password_hash,role,created_at) VALUES(?,?,?,?,?,?)',(name,email,'+233 000000000',password_hash(password),'admin',utcnow()))
 print('Administrator account created. Clear ADMIN_PASSWORD from your environment.')
if __name__=='__main__':main()
