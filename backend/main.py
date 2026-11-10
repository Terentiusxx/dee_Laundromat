"""Dee's Laundromat API. PostgreSQL-ready auth, bookings, and staff inbox.

Payment accounts in this demo are display-only test aliases, NOT payment credentials.
"""
from __future__ import annotations

import os, re, json, hmac, hashlib, secrets, sqlite3, time, threading
from contextlib import contextmanager,asynccontextmanager
from datetime import datetime, timedelta, timezone, date
from pathlib import Path
from typing import Any, Literal
from fastapi import FastAPI, HTTPException, Request, Response, Depends
from pydantic import BaseModel, Field, EmailStr, field_validator

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = Path(os.getenv('DATABASE_PATH', str(ROOT / 'backend' / 'data' / 'dees.sqlite3')))
DATABASE_URL = os.getenv('DATABASE_URL','').strip()
USING_POSTGRES = bool(DATABASE_URL)
DEMO = os.getenv('DEMO_MODE', 'true').lower() == 'true'
SECURE_COOKIES = os.getenv('COOKIE_SECURE', 'false').lower() == 'true'
SESSION_MAX_AGE = 7 * 24 * 3600
ALLOWED_ORIGINS = {
    s.strip().strip('"').strip("'").rstrip('/')
    for s in os.getenv('ALLOWED_ORIGINS', '').split(',')
    if s.strip()
}
SERVICE_SEED = [
 ('wash','Wash & Fold','Everyday laundry, washed, dried and neatly folded.',12,'kg','/images/order-1.webp'),
 ('dry','Dry Cleaning','Care for suits, dresses, jackets and delicates.',25,'item','/images/order-2.webp'),
 ('iron','Ironing & Pressing','Crisp professional pressing.',12,'item','/images/order-3.webp'),
 ('bedding','Bedding & Household','Blankets, duvets and household linens.',30,'item','/images/order-1.webp'),
]
SLOTS = [f'{h:02d}:00–{h+1:02d}:00' for h in range(8, 17)]
SCHEMA = '''
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
 phone TEXT NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'customer',
 verified_email INTEGER NOT NULL DEFAULT 0, verified_phone INTEGER NOT NULL DEFAULT 0,
 preferences TEXT NOT NULL DEFAULT '{"emailUpdates":true,"smsUpdates":true,"marketing":false}',
 created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS addresses (
 id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 label TEXT NOT NULL, street TEXT NOT NULL, area TEXT NOT NULL, region TEXT NOT NULL,
 phone TEXT NOT NULL, instructions TEXT NOT NULL DEFAULT '', is_default INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS payment_methods (
 id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 kind TEXT NOT NULL, last4 TEXT NOT NULL, expiry TEXT, provider TEXT,
 is_default INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS services (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, rate REAL NOT NULL,
 unit TEXT NOT NULL, image TEXT NOT NULL, is_active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS orders (
 id INTEGER PRIMARY KEY, reference TEXT NOT NULL UNIQUE,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 method TEXT NOT NULL, status TEXT NOT NULL, pickup_date TEXT NOT NULL,
 pickup_slot TEXT NOT NULL, pickup_address_id INTEGER REFERENCES addresses(id) ON DELETE SET NULL,
 delivery_address_id INTEGER REFERENCES addresses(id) ON DELETE SET NULL,
 pickup_snapshot TEXT, delivery_snapshot TEXT,
 contact_phone TEXT NOT NULL, speed TEXT NOT NULL, instructions TEXT NOT NULL DEFAULT '',
 subtotal REAL NOT NULL, express_fee REAL NOT NULL DEFAULT 0, total REAL NOT NULL,
 estimated INTEGER NOT NULL DEFAULT 1, payment_choice TEXT NOT NULL,
 payment_status TEXT NOT NULL, payment_method_id INTEGER REFERENCES payment_methods(id) ON DELETE SET NULL,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS order_items (
 id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
 service_id TEXT NOT NULL REFERENCES services(id), title TEXT NOT NULL, qty REAL NOT NULL,
 unit TEXT NOT NULL, unit_rate REAL NOT NULL, total REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS order_events (
 id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
 status TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS chat_messages (
 id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 sender TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL, read_by_admin INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_messages(user_id);
CREATE TABLE IF NOT EXISTS password_resets(token_hash TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS email_verifications(token_hash TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS inquiries(id INTEGER PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL,category TEXT NOT NULL,message TEXT NOT NULL,created_at TEXT NOT NULL);

'''

def utcnow(): return datetime.now(timezone.utc).isoformat(timespec='seconds')
def scrub(x: str, limit=500): return x.strip()[:limit]

def password_hash(password: str) -> str:
 salt=secrets.token_bytes(16)
 dk=hashlib.pbkdf2_hmac('sha256',password.encode(),salt,310_000)
 return f'pbkdf2_sha256$310000${salt.hex()}${dk.hex()}'

def check_password(password: str, stored: str) -> bool:
 try:
  alg,count,salt,expected=stored.split('$')
  if alg!='pbkdf2_sha256': return False
  actual=hashlib.pbkdf2_hmac('sha256',password.encode(),bytes.fromhex(salt),int(count))
  return hmac.compare_digest(actual,bytes.fromhex(expected))
 except (ValueError,TypeError): return False

class PgRow(dict):
 """PostgreSQL row supporting both row['field'] and row[0] like sqlite3.Row."""
 def __getitem__(self, key):
  if isinstance(key,int): return list(self.values())[key]
  return super().__getitem__(key)

def pg_row_factory(cursor):
    if cursor.description is None:
        return lambda values: values

    columns = [column.name for column in cursor.description]
    return lambda values: PgRow(zip(columns, values))

class PgConnection:
 """Minimal compatibility adapter for parameterized SQLite queries."""
 def __init__(self, con): self.con=con
 def execute(self, sql, params=None):
  sql=sql.replace('?', '%s')
  return self.con.execute(sql,params or (),prepare=False)
 def executescript(self, script):
  for statement in script.split(';'):
   if statement.strip(): self.execute(statement)
 def commit(self): self.con.commit()
 def rollback(self): self.con.rollback()
 def close(self): self.con.close()

# The same domain schema is supported on both local SQLite and Railway PostgreSQL.
# BIGSERIAL creates the identity columns; FK columns use BIGINT to match.
def postgres_schema():
 schema=SCHEMA.replace('PRAGMA foreign_keys=ON;','')
 schema=re.sub(r'\bid INTEGER PRIMARY KEY\b','id BIGSERIAL PRIMARY KEY',schema)
 schema=re.sub(r'\b(user_id|order_id|pickup_address_id|delivery_address_id|payment_method_id) INTEGER\b',r'\1 BIGINT',schema)
 return schema

@contextmanager
def connection():
 if USING_POSTGRES:
  import psycopg
  con=PgConnection(psycopg.connect(DATABASE_URL, row_factory=pg_row_factory, connect_timeout=15))
 else:
  DB_PATH.parent.mkdir(parents=True,exist_ok=True)
  con=sqlite3.connect(str(DB_PATH),timeout=15)
  con.row_factory=sqlite3.Row
  con.execute('PRAGMA foreign_keys=ON')
 try:
  yield con
  con.commit()
 except Exception:
  con.rollback();raise
 finally:con.close()

def insert_id(c, query, params):
 """Insert and retrieve the ID without SQLite-only last_insert_rowid()."""
 if USING_POSTGRES:return c.execute(query+' RETURNING id',params).fetchone()[0]
 c.execute(query,params)
 return c.execute('SELECT last_insert_rowid()').fetchone()[0]

def rowdict(row): return dict(row) if row is not None else None

def init_db():
 with connection() as c:
  if USING_POSTGRES:
   migrations=ROOT/'backend'/'migrations'
   c.execute('CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)')
   for file in sorted(migrations.glob('[0-9]*.sql')):
    version=file.stem
    if not c.execute('SELECT 1 FROM schema_migrations WHERE version=?',(version,)).fetchone():
     c.executescript(file.read_text())
     c.execute('INSERT INTO schema_migrations(version,applied_at) VALUES(?,?)',(version,utcnow()))
  else:
   c.executescript(SCHEMA)
  for s in SERVICE_SEED:
   c.execute('INSERT INTO services(id,name,description,rate,unit,image) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING',s)
  if DEMO:
   demo_users=[('Alex Mensah','alex.mensah@example.com','+233 24 567 8901','DemoPass123!','customer'),('Dee Admin','admin@dees.example.com','+233 24 000 0000','AdminPass123!','admin')]
   for name,email,phone,password,role in demo_users:
    existing=c.execute('SELECT id FROM users WHERE email=?',(email,)).fetchone()
    if existing: continue
    uid=insert_id(c,'INSERT INTO users(name,email,phone,password_hash,role,verified_email,verified_phone,created_at) VALUES (?,?,?,?,?,?,?,?)',(name,email,phone,password_hash(password),role,1,1,utcnow()))
    if role=='customer':
     seeds=[('Home','House 12, Greenland Avenue','East Legon, Accra','Greater Accra',phone,'Please call at the gate',1),('Office','Business Centre, Liberation Road','Airport City, Accra','Greater Accra',phone,'Reception desk',0),('University','Campus Reception','Oyarifa, Accra','Greater Accra',phone,'Call on arrival',0)]
     for a in seeds:c.execute('INSERT INTO addresses(user_id,label,street,area,region,phone,instructions,is_default,created_at) VALUES (?,?,?,?,?,?,?,?,?)',(uid,*a,utcnow()))
     for pm in [('visa','4242','08/28',None,1),('mastercard','5578','05/28',None,0),('momo','8901',None,'MTN MoMo',0)]:
      c.execute('INSERT INTO payment_methods(user_id,kind,last4,expiry,provider,is_default,created_at) VALUES (?,?,?,?,?,?,?)',(uid,*pm,utcnow()))
     c.execute('INSERT INTO chat_messages(user_id,sender,body,created_at) VALUES (?,?,?,?)',(uid,'admin',"Welcome to Dee’s Laundromat Support! How can we help?",utcnow()))
     # Sample order with status events and actual server-side records.
     today=(date.today()+timedelta(days=1)).isoformat()
     ref='DL-DEMO-001'
     address=c.execute('SELECT * FROM addresses WHERE user_id=? AND is_default=1',(uid,)).fetchone()
     snapshot=json.dumps(dict(address))
     oid=insert_id(c,'''INSERT INTO orders(reference,user_id,method,status,pickup_date,pickup_slot,pickup_address_id,delivery_address_id,pickup_snapshot,delivery_snapshot,contact_phone,speed,subtotal,total,payment_choice,payment_status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',(ref,uid,'pickup','cleaning',today,SLOTS[1],address['id'],address['id'],snapshot,snapshot,phone,'standard',60,60,'later','unpaid',utcnow(),utcnow()))
     c.execute('INSERT INTO order_items(order_id,service_id,title,qty,unit,unit_rate,total) VALUES(?,?,?,?,?,?,?)',(oid,'wash','Wash & Fold',5,'kg',12,60))
     for evt in ['booked','collected','cleaning']:c.execute('INSERT INTO order_events(order_id,status,note,created_at) VALUES(?,?,?,?)',(oid,evt,'Sample tracking event',utcnow()))

@asynccontextmanager
async def lifespan(app:FastAPI):
 # Railway can start the API before the database is accepting connections.
 for attempt in range(12):
  try:
   init_db()
   break
  except Exception as exc:
   if not USING_POSTGRES or attempt == 11:
    raise
   import psycopg
   if not isinstance(exc, psycopg.OperationalError):
    raise
   time.sleep(2)
 yield

app=FastAPI(title='Dee’s Laundromat API',version='1.0.0',docs_url='/api/docs',openapi_url='/api/openapi.json',lifespan=lifespan)

@app.middleware('http')
async def security(request: Request, call_next):
    print("DEBUG REQUEST:", {
        "origin": repr(request.headers.get("origin")),
        "host": repr(request.headers.get("host")),
        "allowed": repr(ALLOWED_ORIGINS),
        "method": request.method,
        "path": request.url.path,
    }, flush=True)

    if request.url.path.startswith('/api') and request.method not in ('GET', 'HEAD', 'OPTIONS'):
        origin = request.headers.get('origin')
        host_origin = f'{request.url.scheme}://{request.headers.get("host")}'

        if origin and origin != host_origin and origin not in ALLOWED_ORIGINS:
            return Response(status_code=403, content='Origin not allowed')

        if request.headers.get('x-requested-with') != 'DeesWeb':
            return Response(status_code=403, content='Missing request header')

    response = await call_next(request)
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['X-Frame-Options'] = 'DENY'

    return response

# Local testing lets the frontend reach API via the Next.js same-origin rewrite.
def token_digest(token):return hashlib.sha256(token.encode()).hexdigest()
def whoami(request:Request):
 token=request.cookies.get('dees_session','')
 if not token:raise HTTPException(401,'Please log in')
 with connection() as c:
  rec=c.execute('''SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?''',(token_digest(token),int(time.time()))).fetchone()
 if rec is None:raise HTTPException(401,'Session expired. Please log in')
 return rowdict(rec)
def admin_only(user=Depends(whoami)):
 if user['role']!='admin':raise HTTPException(403,'Admin access required')
 return user

def public_user(u):
 return {'id':u['id'],'name':u['name'],'email':u['email'],'phone':u['phone'],'role':u['role'],'verifiedEmail':bool(u['verified_email']),'verifiedPhone':bool(u['verified_phone']),'preferences':json.loads(u['preferences'])}

def make_session(response:Response,uid:int,remember:bool=True):
 token=secrets.token_urlsafe(40)
 with connection() as c:
  c.execute('DELETE FROM sessions WHERE expires_at<=?',(int(time.time()),))
  c.execute('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)',(token_digest(token),uid,int(time.time())+SESSION_MAX_AGE))
 response.set_cookie('dees_session',token,httponly=True,samesite='lax',secure=SECURE_COOKIES,max_age=SESSION_MAX_AGE if remember else None,path='/')

class Register(BaseModel):
 name:str=Field(min_length=2,max_length=100)
 email:EmailStr
 phone:str=Field(min_length=9,max_length=25)
 password:str=Field(min_length=10,max_length=128)
 acceptTerms:bool
class Login(BaseModel):
 email:EmailStr
 password:str
 remember:bool=False
class ProfilePatch(BaseModel):
 name:str=Field(min_length=2,max_length=100)
 email:EmailStr
 phone:str=Field(min_length=9,max_length=25)
class PasswordChange(BaseModel):
 currentPassword:str
 newPassword:str=Field(min_length=10,max_length=128)
class PreferencesPatch(BaseModel):
 emailUpdates:bool
 smsUpdates:bool
 marketing:bool

@app.get('/api/health')
def health():return {'ok':True,'app':'Dee’s Laundromat API','demoMode':DEMO}
@app.post('/api/auth/register',status_code=201)
def register(payload:Register,response:Response):
 if not payload.acceptTerms:raise HTTPException(400,'You must accept the terms and privacy policy')
 if not re.fullmatch(r'\+?[0-9 ()-]{9,25}',payload.phone):raise HTTPException(400,'Enter a valid phone number')
 with connection() as c:
  if c.execute('SELECT 1 FROM users WHERE lower(email)=?',(payload.email.lower(),)).fetchone():raise HTTPException(409,'Email already registered')
  uid=insert_id(c,'INSERT INTO users(name,email,phone,password_hash,created_at) VALUES(?,?,?,?,?)',(scrub(payload.name,100),payload.email.lower(),payload.phone.strip(),password_hash(payload.password),utcnow()))
 make_session(response,uid)
 with connection() as c:u=rowdict(c.execute('SELECT * FROM users WHERE id=?',(uid,)).fetchone())
 return public_user(u)

_failures={}
@app.post('/api/auth/login')
def login(payload:Login,response:Response,request:Request):
 key=(request.client.host if request.client else 'unknown',payload.email.lower())
 now=time.time();attempts=[ts for ts in _failures.get(key,[]) if now-ts<900]
 if len(attempts)>=10:raise HTTPException(429,'Too many login attempts. Try again later')
 with connection() as c:u=rowdict(c.execute('SELECT * FROM users WHERE lower(email)=?',(payload.email.lower(),)).fetchone())
 if not u or not check_password(payload.password,u['password_hash']):
  _failures[key]=attempts+[now]
  raise HTTPException(401,'Invalid email or password')
 _failures.pop(key,None)
 make_session(response,u['id'],payload.remember)
 return public_user(u)
@app.post('/api/auth/logout')
def logout(response:Response,request:Request):
 token=request.cookies.get('dees_session','')
 if token:
  with connection() as c:c.execute('DELETE FROM sessions WHERE token_hash=?',(token_digest(token),))
 response.delete_cookie('dees_session',path='/')
 return {'ok':True}
@app.get('/api/me')
def me(user=Depends(whoami)):return public_user(user)
@app.patch('/api/me')
def update_profile(payload:ProfilePatch,user=Depends(whoami)):
 if not re.fullmatch(r'\+?[0-9 ()-]{9,25}',payload.phone):raise HTTPException(400,'Enter a valid phone number')
 with connection() as c:
  if c.execute('SELECT id FROM users WHERE lower(email)=? AND id<>?',(payload.email.lower(),user['id'])).fetchone():raise HTTPException(409,'Email is already in use')
  # In demo mode: changed email/phone marked unverified; real sends require external provider.
  c.execute('UPDATE users SET name=?,email=?,phone=?,verified_email=?,verified_phone=? WHERE id=?',(scrub(payload.name,100),payload.email.lower(),payload.phone.strip(),int(payload.email.lower()==user['email']),int(payload.phone.strip()==user['phone']),user['id']))
  if payload.email.lower()!=user['email']:
   c.execute('DELETE FROM email_verifications WHERE user_id=?',(user['id'],))
  rec=rowdict(c.execute('SELECT * FROM users WHERE id=?',(user['id'],)).fetchone())
 return public_user(rec)
@app.put('/api/me/preferences')
def update_preferences(payload:PreferencesPatch,user=Depends(whoami)):
 with connection() as c:c.execute('UPDATE users SET preferences=? WHERE id=?',(payload.model_dump_json(),user['id']))
 return {'ok':True,'preferences':payload.model_dump()}
@app.post('/api/me/password')
def update_password(payload:PasswordChange,user=Depends(whoami)):
 if not check_password(payload.currentPassword,user['password_hash']):raise HTTPException(400,'Current password is incorrect')
 with connection() as c:
  c.execute('UPDATE users SET password_hash=? WHERE id=?',(password_hash(payload.newPassword),user['id']))
  c.execute('DELETE FROM sessions WHERE user_id=?',(user['id'],))
 return {'ok':True,'message':'Password changed. Sign in again.'}

# Addresses: all changes scoped to authenticated customer.
class AddressIn(BaseModel):
 label:str=Field(min_length=1,max_length=60)
 street:str=Field(min_length=3,max_length=180)
 area:str=Field(min_length=2,max_length=120)
 region:str=Field(min_length=2,max_length=100)
 phone:str=Field(min_length=9,max_length=25)
 instructions:str=Field(default='',max_length=500)
 isDefault:bool=False

def address_out(a):
 return {**rowdict(a),'isDefault':bool(a['is_default'])}

def owned_address(c,uid,aid):
 a=c.execute('SELECT * FROM addresses WHERE id=? AND user_id=?',(aid,uid)).fetchone()
 if not a:raise HTTPException(404,'Address not found')
 return a

@app.get('/api/addresses')
def list_addresses(user=Depends(whoami)):
 with connection() as c: return [address_out(a) for a in c.execute('SELECT * FROM addresses WHERE user_id=? ORDER BY is_default DESC,id DESC',(user['id'],))]
@app.post('/api/addresses',status_code=201)
def add_address(data:AddressIn,user=Depends(whoami)):
 with connection() as c:
  count=c.execute('SELECT COUNT(*) FROM addresses WHERE user_id=?',(user['id'],)).fetchone()[0]
  default=data.isDefault or count==0
  if default:c.execute('UPDATE addresses SET is_default=0 WHERE user_id=?',(user['id'],))
  id_=insert_id(c,'''INSERT INTO addresses(user_id,label,street,area,region,phone,instructions,is_default,created_at) VALUES(?,?,?,?,?,?,?,?,?)''',(user['id'],scrub(data.label,60),scrub(data.street,180),scrub(data.area,120),scrub(data.region,100),data.phone,scrub(data.instructions),int(default),utcnow()))
  return address_out(c.execute('SELECT * FROM addresses WHERE id=?',(id_,)).fetchone())
@app.put('/api/addresses/{aid}')
def edit_address(aid:int,data:AddressIn,user=Depends(whoami)):
 with connection() as c:
  prior=owned_address(c,user['id'],aid)
  if data.isDefault:c.execute('UPDATE addresses SET is_default=0 WHERE user_id=?',(user['id'],))
  default=data.isDefault or bool(prior['is_default']) and not data.isDefault # preserve until explicitly changed by dedicated action
  c.execute('''UPDATE addresses SET label=?,street=?,area=?,region=?,phone=?,instructions=?,is_default=? WHERE id=? AND user_id=?''',(data.label,data.street,data.area,data.region,data.phone,data.instructions,int(default),aid,user['id']))
  return address_out(c.execute('SELECT * FROM addresses WHERE id=?',(aid,)).fetchone())
@app.post('/api/addresses/{aid}/default')
def default_address(aid:int,user=Depends(whoami)):
 with connection() as c:
  owned_address(c,user['id'],aid)
  c.execute('UPDATE addresses SET is_default=0 WHERE user_id=?',(user['id'],))
  c.execute('UPDATE addresses SET is_default=1 WHERE id=?',(aid,))
 return {'ok':True}
@app.delete('/api/addresses/{aid}')
def delete_address(aid:int,user=Depends(whoami)):
 with connection() as c:
  old=owned_address(c,user['id'],aid)
  c.execute('DELETE FROM addresses WHERE id=?',(aid,))
  if old['is_default']:
   other=c.execute('SELECT id FROM addresses WHERE user_id=? ORDER BY id LIMIT 1',(user['id'],)).fetchone()
   if other:c.execute('UPDATE addresses SET is_default=1 WHERE id=?',(other['id'],))
 return {'ok':True}

# Payment method aliases only, no actual card details, security codes, or authorization data.
class PaymentIn(BaseModel):
 kind:Literal['visa','mastercard','momo']
 last4:str=Field(pattern=r'^\d{4}$')
 expiry:str|None=Field(default=None,max_length=7)
 provider:str|None=Field(default=None,max_length=60)
 isDefault:bool=False

def payment_out(p):return {**rowdict(p),'isDefault':bool(p['is_default'])}
@app.get('/api/payment-methods')
def list_payments(user=Depends(whoami)):
 with connection() as c:return [payment_out(p) for p in c.execute('SELECT * FROM payment_methods WHERE user_id=? ORDER BY is_default DESC,id DESC',(user['id'],))]
@app.post('/api/payment-methods',status_code=201)
def add_payment(data:PaymentIn,user=Depends(whoami)):
 if not DEMO:raise HTTPException(501,'Connect a PCI-compliant provider before saving payment methods')
 with connection() as c:
  count=c.execute('SELECT COUNT(*) FROM payment_methods WHERE user_id=?',(user['id'],)).fetchone()[0]
  default=data.isDefault or count==0
  if default:c.execute('UPDATE payment_methods SET is_default=0 WHERE user_id=?',(user['id'],))
  pid=insert_id(c,'INSERT INTO payment_methods(user_id,kind,last4,expiry,provider,is_default,created_at) VALUES(?,?,?,?,?,?,?)',(user['id'],data.kind,data.last4,data.expiry,data.provider,int(default),utcnow()))
  return payment_out(c.execute('SELECT * FROM payment_methods WHERE id=?',(pid,)).fetchone())
@app.post('/api/payment-methods/{pid}/default')
def payment_default(pid:int,user=Depends(whoami)):
 with connection() as c:
  if not c.execute('SELECT 1 FROM payment_methods WHERE id=? AND user_id=?',(pid,user['id'])).fetchone():raise HTTPException(404,'Payment method not found')
  c.execute('UPDATE payment_methods SET is_default=0 WHERE user_id=?',(user['id'],))
  c.execute('UPDATE payment_methods SET is_default=1 WHERE id=?',(pid,))
 return {'ok':True}
@app.delete('/api/payment-methods/{pid}')
def remove_payment(pid:int,user=Depends(whoami)):
 with connection() as c:
  rec=c.execute('SELECT * FROM payment_methods WHERE id=? AND user_id=?',(pid,user['id'])).fetchone()
  if not rec:raise HTTPException(404,'Payment method not found')
  c.execute('DELETE FROM payment_methods WHERE id=?',(pid,))
  if rec['is_default']:
   other=c.execute('SELECT id FROM payment_methods WHERE user_id=? ORDER BY id LIMIT 1',(user['id'],)).fetchone()
   if other:c.execute('UPDATE payment_methods SET is_default=1 WHERE id=?',(other['id'],))
 return {'ok':True}

@app.get('/api/services')
def services():
 with connection() as c:return [rowdict(s) for s in c.execute('SELECT * FROM services WHERE is_active=1 ORDER BY id')]
@app.get('/api/availability')
def availability(day:str,method:Literal['pickup','store']='pickup',user=Depends(whoami)):
 try:chosen=date.fromisoformat(day)
 except ValueError:raise HTTPException(400,'Invalid date')
 if not (date.today()<=chosen<=date.today()+timedelta(days=45)):raise HTTPException(400,'Date must be within the next 45 days')
 with connection() as c:
  counts=dict((r['pickup_slot'],r['n']) for r in c.execute("SELECT pickup_slot,COUNT(*) n FROM orders WHERE pickup_date=? AND status NOT IN ('cancelled','delivered','collected') GROUP BY pickup_slot",(day,)))
 return [{'slot':s,'available':counts.get(s,0)<10} for s in SLOTS]

class OrderItemIn(BaseModel):
 serviceId:str
 qty:float=Field(gt=0,le=100)
class OrderIn(BaseModel):
 method:Literal['pickup','store']
 items:list[OrderItemIn]=Field(min_length=1,max_length=20)
 pickupDate:str
 pickupSlot:str
 pickupAddressId:int|None=None
 deliveryAddressId:int|None=None
 pickupNew:AddressIn|None=None
 deliveryNew:AddressIn|None=None
 contactPhone:str=Field(min_length=9,max_length=25)
 speed:Literal['standard','express']='standard'
 instructions:str=Field(default='',max_length=500)
 paymentChoice:Literal['later','online_demo']='later'
 paymentMethodId:int|None=None

def price_order(c,items,speed):
 found=[];sub=0
 for item in items:
  svc=c.execute('SELECT * FROM services WHERE id=? AND is_active=1',(item.serviceId,)).fetchone()
  if not svc:raise HTTPException(400,f'Service not available: {item.serviceId}')
  if svc['unit']=='item' and item.qty!=int(item.qty):raise HTTPException(400,'Item quantities must be whole numbers')
  line=round(svc['rate']*item.qty,2);sub+=line
  found.append({'serviceId':svc['id'],'title':svc['name'],'qty':item.qty,'unit':svc['unit'],'unitRate':svc['rate'],'total':line})
 fee=15 if speed=='express' else 0
 return found,round(sub,2),fee,round(sub+fee,2)

@app.post('/api/quote')
def quote(data:OrderIn,user=Depends(whoami)):
 with connection() as c:lines,sub,fee,total=price_order(c,data.items,data.speed)
 return {'items':lines,'subtotal':sub,'expressFee':fee,'total':total,'estimated':True,'currency':'GHS','note':'Illustrative quote; weight-based services may be repriced after weighing.'}

def snapshot(addr):return json.dumps(dict(addr)) if addr is not None else None

def load_order(c,order):
 o=rowdict(order)
 o['items']=[rowdict(x) for x in c.execute('SELECT * FROM order_items WHERE order_id=?',(o['id'],))]
 o['events']=[rowdict(x) for x in c.execute('SELECT status,note,created_at FROM order_events WHERE order_id=? ORDER BY id',(o['id'],))]
 o['pickupAddress']=json.loads(o.pop('pickup_snapshot') or 'null')
 o['deliveryAddress']=json.loads(o.pop('delivery_snapshot') or 'null')
 return o

@app.post('/api/orders',status_code=201)
def create_order(data:OrderIn,user=Depends(whoami)):
 try:chosen=date.fromisoformat(data.pickupDate)
 except ValueError:raise HTTPException(400,'Invalid date')
 if not date.today()<=chosen<=date.today()+timedelta(days=45):raise HTTPException(400,'Choose a date within 45 days')
 if data.pickupSlot not in SLOTS:raise HTTPException(400,'Choose an available slot')
 if data.paymentChoice=='online_demo' and not DEMO:raise HTTPException(501,'Online payments require a payment provider')
 with connection() as c:
  busy=c.execute("SELECT count(*) n FROM orders WHERE pickup_date=? AND pickup_slot=? AND status NOT IN ('cancelled','delivered','collected')",(data.pickupDate,data.pickupSlot)).fetchone()['n']
  if busy>=10:raise HTTPException(409,'That slot is full. Please choose another.')
  pickup=delivery=None
  if data.method=='pickup':
   if data.pickupAddressId is None and data.pickupNew is None:raise HTTPException(400,'Pickup address required')
   if data.deliveryAddressId is None and data.deliveryNew is None:raise HTTPException(400,'Delivery address required')
   pickup=owned_address(c,user['id'],data.pickupAddressId) if data.pickupAddressId is not None else data.pickupNew.model_dump()
   delivery=owned_address(c,user['id'],data.deliveryAddressId) if data.deliveryAddressId is not None else data.deliveryNew.model_dump()
  elif data.pickupAddressId:
   raise HTTPException(400,'Store orders cannot have a pickup address')
  if data.paymentMethodId:
   if not c.execute('SELECT 1 FROM payment_methods WHERE id=? AND user_id=?',(data.paymentMethodId,user['id'])).fetchone():raise HTTPException(400,'Invalid payment method')
  lines,subtotal,fee,total=price_order(c,data.items,data.speed)
  ref='DL-'+datetime.now(timezone.utc).strftime('%y%m%d')+'-'+secrets.token_hex(3).upper()
  now=utcnow()
  oid=insert_id(c,'''INSERT INTO orders(reference,user_id,method,status,pickup_date,pickup_slot,pickup_address_id,delivery_address_id,pickup_snapshot,delivery_snapshot,contact_phone,speed,instructions,subtotal,express_fee,total,estimated,payment_choice,payment_status,payment_method_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
   (ref,user['id'],data.method,'booked',data.pickupDate,data.pickupSlot,data.pickupAddressId if pickup else None,data.deliveryAddressId if delivery else None,snapshot(pickup),snapshot(delivery),data.contactPhone,data.speed,data.instructions,subtotal,fee,total,1,data.paymentChoice,'demo_paid' if data.paymentChoice=='online_demo' else 'unpaid',data.paymentMethodId,now,now))
  for ln in lines:c.execute('INSERT INTO order_items(order_id,service_id,title,qty,unit,unit_rate,total) VALUES(?,?,?,?,?,?,?)',(oid,ln['serviceId'],ln['title'],ln['qty'],ln['unit'],ln['unitRate'],ln['total']))
  c.execute('INSERT INTO order_events(order_id,status,note,created_at) VALUES(?,?,?,?)',(oid,'booked','Booking received',now))
  return load_order(c,c.execute('SELECT * FROM orders WHERE id=?',(oid,)).fetchone())

@app.get('/api/orders')
def orders(user=Depends(whoami)):
 with connection() as c:return [load_order(c,o) for o in c.execute('SELECT * FROM orders WHERE user_id=? ORDER BY id DESC',(user['id'],))]
@app.get('/api/orders/{ref}')
def order(ref:str,user=Depends(whoami)):
 with connection() as c:
  record=c.execute('SELECT * FROM orders WHERE reference=? AND user_id=?',(ref,user['id'])).fetchone()
  if record is None:raise HTTPException(404,'Order not found')
  return load_order(c,record)
@app.post('/api/orders/{ref}/cancel')
def cancel(ref:str,user=Depends(whoami)):
 with connection() as c:
  record=c.execute('SELECT * FROM orders WHERE reference=? AND user_id=?',(ref,user['id'])).fetchone()
  if not record:raise HTTPException(404,'Order not found')
  if record['status']!='booked':raise HTTPException(409,'This order can no longer be cancelled online; please contact support')
  c.execute("UPDATE orders SET status='cancelled',updated_at=? WHERE id=?",(utcnow(),record['id']))
  c.execute('INSERT INTO order_events(order_id,status,note,created_at) VALUES(?,?,?,?)',(record['id'],'cancelled','Cancelled by customer',utcnow()))
 return {'ok':True}

class MessageIn(BaseModel):body:str=Field(min_length=1,max_length=3000)
@app.get('/api/support/messages')
def messages(user=Depends(whoami)):
 with connection() as c:return [rowdict(m) for m in c.execute('SELECT id,sender,body,created_at FROM chat_messages WHERE user_id=? ORDER BY id',(user['id'],))]
@app.post('/api/support/messages',status_code=201)
def post_message(data:MessageIn,user=Depends(whoami)):
 with connection() as c:
  id_=insert_id(c,'INSERT INTO chat_messages(user_id,sender,body,created_at) VALUES(?,?,?,?)',(user['id'],'customer',data.body.strip(),utcnow()))
 return {'id':id_,'sender':'customer','body':data.body.strip(),'created_at':utcnow()}

# Administrator dashboard uses separate endpoints with role validation.
@app.get('/api/admin/overview')
def admin_overview(admin=Depends(admin_only)):
 with connection() as c:
  return {'orders':c.execute('SELECT COUNT(*) FROM orders').fetchone()[0],
          'active':c.execute("SELECT COUNT(*) FROM orders WHERE status NOT IN ('delivered','cancelled') AND NOT (method='store' AND status='collected')").fetchone()[0],
          'customers':c.execute("SELECT COUNT(*) FROM users WHERE role='customer'").fetchone()[0],
          'unreadMessages':c.execute("SELECT COUNT(*) FROM chat_messages WHERE sender='customer' AND read_by_admin=0").fetchone()[0]}
@app.get('/api/admin/orders')
def admin_orders(admin=Depends(admin_only)):
 with connection() as c:
  out=[]
  for o in c.execute('SELECT o.*,u.name as customer_name,u.email as customer_email FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.id DESC'):
   item=load_order(c,o)
   out.append(item)
  return out
class StatusIn(BaseModel):
 status:Literal['booked','received','collected','cleaning','ready','out_for_delivery','delivered','cancelled']
 note:str=Field(default='',max_length=500)
@app.patch('/api/admin/orders/{ref}/status')
def admin_status(ref:str,data:StatusIn,admin=Depends(admin_only)):
 with connection() as c:
  order=c.execute('SELECT * FROM orders WHERE reference=?',(ref,)).fetchone()
  if not order:raise HTTPException(404,'Order not found')
  allowed={'pickup':{'booked':['collected','cancelled'],'collected':['cleaning'],'cleaning':['out_for_delivery'],'out_for_delivery':['delivered']},
           'store':{'booked':['received','cancelled'],'received':['cleaning'],'cleaning':['ready'],'ready':['collected']}}
  if data.status not in allowed[order['method']].get(order['status'],[]):raise HTTPException(409,'Invalid order status transition')
  now=utcnow()
  c.execute('UPDATE orders SET status=?,updated_at=? WHERE id=?',(data.status,now,order['id']))
  c.execute('INSERT INTO order_events(order_id,status,note,created_at) VALUES(?,?,?,?)',(order['id'],data.status,data.note.strip(),now))
 return {'ok':True}
@app.get('/api/admin/customers')
def admin_customers(admin=Depends(admin_only)):
 with connection() as c:return [{'id':u['id'],'name':u['name'],'email':u['email'],'phone':u['phone'],'created_at':u['created_at']} for u in c.execute("SELECT * FROM users WHERE role='customer' ORDER BY id DESC")]
@app.get('/api/admin/support')
def admin_threads(admin=Depends(admin_only)):
    with connection() as c:
        return [
            rowdict(r) for r in c.execute("""
                SELECT
                    u.id AS user_id,
                    u.name,
                    u.email,
                    COUNT(m.id) AS message_count,
                    SUM(
                        CASE
                            WHEN m.sender = 'customer'
                            AND m.read_by_admin = 0
                            THEN 1 ELSE 0
                        END
                    ) AS unread
                FROM chat_messages m
                JOIN users u ON u.id = m.user_id
                GROUP BY u.id, u.name, u.email
                ORDER BY MAX(m.id) DESC
            """)
        ]
@app.get('/api/admin/support/{uid}')
def admin_thread(uid:int,admin=Depends(admin_only)):
 with connection() as c:
  if not c.execute("SELECT 1 FROM users WHERE id=? AND role='customer'",(uid,)).fetchone():raise HTTPException(404,'Customer not found')
  messages=[rowdict(m) for m in c.execute('SELECT id,sender,body,created_at FROM chat_messages WHERE user_id=? ORDER BY id',(uid,))]
  c.execute("UPDATE chat_messages SET read_by_admin=1 WHERE user_id=? AND sender='customer'",(uid,))
  return messages
@app.post('/api/admin/support/{uid}',status_code=201)
def admin_reply(uid:int,data:MessageIn,admin=Depends(admin_only)):
 with connection() as c:
  if not c.execute("SELECT 1 FROM users WHERE id=? AND role='customer'",(uid,)).fetchone():raise HTTPException(404,'Customer not found')
  c.execute('INSERT INTO chat_messages(user_id,sender,body,created_at,read_by_admin) VALUES(?,?,?,?,1)',(uid,'admin',data.body.strip(),utcnow()))
 return {'ok':True}
class RateIn(BaseModel):rate:float=Field(gt=0,le=100000)
@app.patch('/api/admin/services/{sid}')
def update_service(sid:str,data:RateIn,admin=Depends(admin_only)):
 with connection() as c:
  if not c.execute('SELECT 1 FROM services WHERE id=?',(sid,)).fetchone():raise HTTPException(404,'Service not found')
  c.execute('UPDATE services SET rate=? WHERE id=?',(data.rate,sid))
 return {'ok':True}
class DeleteAccount(BaseModel):password:str
@app.delete('/api/me')
def delete_account(data:DeleteAccount,response:Response,user=Depends(whoami)):
 if not check_password(data.password,user['password_hash']):raise HTTPException(400,'Password is incorrect')
 if user['role']=='admin':raise HTTPException(403,'Admin account deletion requires server administration')
 with connection() as c:c.execute('DELETE FROM users WHERE id=?',(user['id'],))
 response.delete_cookie('dees_session',path='/')
 return {'ok':True}
# Email verification and password reset. In DEMO_MODE links are returned for local testing;
# otherwise SMTP must be configured. Do not expose these links in production responses.
import smtplib
from email.message import EmailMessage
PUBLIC_ORIGIN=os.getenv('PUBLIC_ORIGIN','http://localhost:3000').rstrip('/')
def mail_out(to:str,subject:str,body:str):
 host=os.getenv('SMTP_HOST')
 if not host:raise HTTPException(503,'Email delivery is not configured yet')
 msg=EmailMessage();msg['Subject']=subject;msg['From']=os.getenv('SMTP_FROM','no-reply@example.com');msg['To']=to;msg.set_content(body)
 try:
  with smtplib.SMTP(host,int(os.getenv('SMTP_PORT','587')),timeout=15) as smtp:
   smtp.starttls();user=os.getenv('SMTP_USER');pw=os.getenv('SMTP_PASSWORD')
   if user and pw:smtp.login(user,pw)
   smtp.send_message(msg)
 except Exception:raise HTTPException(503,'Email delivery temporarily unavailable')
class EmailOnly(BaseModel):email:EmailStr
class TokenPassword(BaseModel):token:str;newPassword:str=Field(min_length=10,max_length=128)
class TokenOnly(BaseModel):token:str
@app.post('/api/auth/password-reset/request')
def request_reset(data:EmailOnly):
 token=None
 with connection() as c:
  u=c.execute('SELECT * FROM users WHERE email=?',(data.email.lower(),)).fetchone()
  if u:
   token=secrets.token_urlsafe(32)
   c.execute('INSERT INTO password_resets(token_hash,user_id,expires_at) VALUES (?,?,?)',(token_digest(token),u['id'],int(time.time())+1800))
 if token:
  url=f'{PUBLIC_ORIGIN}/reset-password?token={token}'
  if DEMO:return {'ok':True,'message':'For this test account, use the test reset link below.','demoResetUrl':url}
  mail_out(data.email,'Reset your Dee’s Laundromat password',f'This link expires in 30 minutes:\n{url}')
 return {'ok':True,'message':'If the account exists, reset instructions have been sent.'}
@app.post('/api/auth/password-reset/confirm')
def confirm_reset(data:TokenPassword):
 with connection() as c:
  row=c.execute('SELECT * FROM password_resets WHERE token_hash=? AND expires_at>?',(token_digest(data.token),int(time.time()))).fetchone()
  if not row:raise HTTPException(400,'Invalid or expired reset link')
  c.execute('UPDATE users SET password_hash=? WHERE id=?',(password_hash(data.newPassword),row['user_id']))
  c.execute('DELETE FROM sessions WHERE user_id=?',(row['user_id'],))
  c.execute('DELETE FROM password_resets WHERE user_id=?',(row['user_id'],))
 return {'ok':True}
@app.post('/api/me/verification/request')
def request_verification(user=Depends(whoami)):
 if user['verified_email']:return {'ok':True,'message':'Email already verified'}
 token=secrets.token_urlsafe(32)
 with connection() as c:c.execute('INSERT INTO email_verifications(token_hash,user_id,expires_at) VALUES(?,?,?)',(token_digest(token),user['id'],int(time.time())+1800))
 url=f'{PUBLIC_ORIGIN}/verify-email?token={token}'
 if DEMO:return {'ok':True,'demoVerifyUrl':url}
 mail_out(user['email'],'Verify your Dee’s Laundromat email',f'Verify your email within 30 minutes:\n{url}')
 return {'ok':True,'message':'Verification link sent'}
@app.post('/api/auth/verification/confirm')
def confirm_verification(data:TokenOnly):
 with connection() as c:
  row=c.execute('SELECT * FROM email_verifications WHERE token_hash=? AND expires_at>?',(token_digest(data.token),int(time.time()))).fetchone()
  if not row:raise HTTPException(400,'Invalid or expired verification link')
  c.execute('UPDATE users SET verified_email=1 WHERE id=?',(row['user_id'],))
  c.execute('DELETE FROM email_verifications WHERE user_id=?',(row['user_id'],))
 return {'ok':True}
class InquiryIn(BaseModel):
 name:str=Field(min_length=2,max_length=100)
 email:EmailStr
 category:Literal['general','corporate']='general'
 message:str=Field(min_length=10,max_length=2500)
@app.post('/api/inquiries',status_code=201)
def inquiry(data:InquiryIn):
 with connection() as c:c.execute('INSERT INTO inquiries(name,email,category,message,created_at) VALUES(?,?,?,?,?)',(data.name,data.email.lower(),data.category,data.message,utcnow()))
 return {'ok':True,'message':'Your inquiry has been saved in the test system.'}
@app.get('/api/admin/inquiries')
def admin_inquiries(admin=Depends(admin_only)):
 with connection() as c:return [rowdict(x) for x in c.execute('SELECT * FROM inquiries ORDER BY id DESC')]
