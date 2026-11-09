"""Backend HTTP smoke test. Run after starting backend, with its demo credentials."""
import os,requests,sys
root=os.getenv('API_URL','http://localhost:8000')
s=requests.Session()
s.headers['X-Requested-With']='DeesWeb'
r=s.get(root+'/api/health',timeout=8);r.raise_for_status();assert r.json()['ok']
r=s.post(root+'/api/auth/login',json={'email':'alex.mensah@example.com','password':'DemoPass123!'},timeout=8);r.raise_for_status()
r=s.get(root+'/api/addresses',timeout=8);r.raise_for_status();assert r.json()
r=s.get(root+'/api/orders',timeout=8);r.raise_for_status()
print('PASS: health, login, saved addresses, customer orders')
