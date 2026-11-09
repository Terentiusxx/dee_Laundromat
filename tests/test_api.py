import os,tempfile,unittest,importlib
from pathlib import Path
from fastapi.testclient import TestClient
class ApiTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.tmp=tempfile.TemporaryDirectory()
  os.environ['DATABASE_PATH']=str(Path(cls.tmp.name)/'test.sqlite3')
  os.environ['DEMO_MODE']='true'
  from backend import main
  cls.api=main
  main.init_db()
  cls.client=TestClient(main.app)
  cls.headers={'X-Requested-With':'DeesWeb'}
 @classmethod
 def tearDownClass(cls):cls.client.close();cls.tmp.cleanup()
 def login(self,email='alex.mensah@example.com',password='DemoPass123!'):
  c=TestClient(self.api.app)
  r=c.post('/api/auth/login',json={'email':email,'password':password},headers=self.headers)
  self.assertEqual(r.status_code,200,r.text)
  return c
 def test_00_auth_and_profile(self):
  with self.login() as c:
   self.assertEqual(c.get('/api/me').json()['name'],'Alex Mensah')
   self.assertEqual(c.get('/api/addresses').status_code,200)
   self.assertEqual(c.post('/api/me',json={},headers=self.headers).status_code,405)
   self.assertEqual(c.post('/api/auth/logout',headers=self.headers).status_code,200)
   self.assertEqual(c.get('/api/me').status_code,401)
 def test_01_customer_creation(self):
  c=TestClient(self.api.app)
  info={'name':'Test Customer','email':'test@example.com','phone':'+233 24 555 2201','password':'VeryStrongPass123!','acceptTerms':True}
  self.assertEqual(c.post('/api/auth/register',json=info,headers=self.headers).status_code,201)
  self.assertEqual(c.get('/api/me').json()['name'],'Test Customer')
  self.assertEqual(c.post('/api/auth/register',json=info,headers=self.headers).status_code,409)
  self.assertEqual(c.post('/api/auth/login',json={'email':info['email'],'password':'wrong'},headers=self.headers).status_code,401)
  c.close()
 def test_02_addresses_and_payments(self):
  with self.login() as c:
   a=c.get('/api/addresses').json();self.assertTrue(a[0]['isDefault'])
   r=c.post('/api/addresses',json={'label':'Gym','street':'10 Main Rd','area':'Accra','region':'Greater Accra','phone':'+233 24 567 8901','isDefault':True},headers=self.headers)
   self.assertEqual(r.status_code,201,r.text)
   aid=r.json()['id'];self.assertTrue(r.json()['isDefault'])
   self.assertEqual(c.post(f'/api/addresses/{aid}/default',headers=self.headers).status_code,200)
   r=c.post('/api/payment-methods',json={'kind':'visa','last4':'9999'},headers=self.headers);self.assertEqual(r.status_code,201,r.text)
   self.assertEqual(c.delete(f'/api/payment-methods/{r.json()["id"]}',headers=self.headers).status_code,200)
   self.assertEqual(c.delete(f'/api/addresses/{aid}',headers=self.headers).status_code,200)
 def test_03_booking_admin_and_access_controls(self):
  with self.login() as c:
   a=c.get('/api/addresses').json();method=c.get('/api/payment-methods').json()[0]
   items={'method':'pickup','items':[{'serviceId':'wash','qty':3},{'serviceId':'dry','qty':2}], 'pickupDate':(self.api.date.today()+self.api.timedelta(days=3)).isoformat(),'pickupSlot':'09:00–10:00','pickupAddressId':a[0]['id'],'deliveryAddressId':a[0]['id'],'contactPhone':'+233 24 567 8901','speed':'express','paymentChoice':'later'}
   r=c.post('/api/quote',json=items,headers=self.headers);self.assertEqual(r.status_code,200,r.text);self.assertEqual(r.json()['total'],101)
   r=c.post('/api/orders',json=items,headers=self.headers);self.assertEqual(r.status_code,201,r.text)
   ref=r.json()['reference'];self.assertEqual(r.json()['total'],101)
   self.assertEqual(c.get('/api/orders/'+ref).status_code,200)
   self.assertEqual(c.get('/api/admin/orders').status_code,403)
   with self.login('admin@dees.example.com','AdminPass123!') as admin:
    r=admin.get('/api/admin/orders');self.assertEqual(r.status_code,200,r.text)
    r=admin.patch(f'/api/admin/orders/{ref}/status',json={'status':'collected'},headers=self.headers);self.assertEqual(r.status_code,200,r.text)
    r=admin.patch(f'/api/admin/orders/{ref}/status',json={'status':'delivered'},headers=self.headers);self.assertEqual(r.status_code,409,r.text)
   r=c.post(f'/api/orders/{ref}/cancel',headers=self.headers);self.assertEqual(r.status_code,409,r.text)
 def test_04_chat(self):
  with self.login() as c:
   r=c.post('/api/support/messages',json={'body':'Please check my collection'},headers=self.headers);self.assertEqual(r.status_code,201,r.text)
   with self.login('admin@dees.example.com','AdminPass123!') as admin:
    threads=admin.get('/api/admin/support').json();uid=next(x['user_id'] for x in threads if x['email']=='alex.mensah@example.com')
    self.assertEqual(admin.post(f'/api/admin/support/{uid}',json={'body':'We are on it.'},headers=self.headers).status_code,201)
   msgs=c.get('/api/support/messages').json();self.assertTrue(any(x['body']=='We are on it.' for x in msgs))
 def test_05_cross_user(self):
  with self.login() as c:
   address=c.get('/api/addresses').json()[0]['id']
   stranger=TestClient(self.api.app)
   stranger.post('/api/auth/register',json={'name':'Another User','email':'other@example.com','phone':'+233 24 555 1100','password':'VeryStrongPass123!','acceptTerms':True},headers=self.headers)
   self.assertEqual(stranger.delete(f'/api/addresses/{address}',headers=self.headers).status_code,404)
   stranger.close()
 def test_06_password_reset(self):
  with self.login() as c:
   r=c.post('/api/auth/password-reset/request',json={'email':'alex.mensah@example.com'},headers=self.headers)
   self.assertEqual(r.status_code,200,r.text)
   token=r.json()['demoResetUrl'].split('token=')[1]
   r=c.post('/api/auth/password-reset/confirm',json={'token':token,'newPassword':'NewPass123456!'},headers=self.headers)
   self.assertEqual(r.status_code,200,r.text)
   self.assertEqual(c.get('/api/me').status_code,401)
   self.assertEqual(c.post('/api/auth/login',json={'email':'alex.mensah@example.com','password':'NewPass123456!'},headers=self.headers).status_code,200)
   # Reset password to seeded value to keep remaining tests independent.
   r=c.post('/api/me/password',json={'currentPassword':'NewPass123456!','newPassword':'DemoPass123!'},headers=self.headers)
   self.assertEqual(r.status_code,200,r.text)
 def test_07_store_booking_and_account_preferences(self):
  with self.login() as c:
   self.assertEqual(c.put('/api/me/preferences',json={'emailUpdates':False,'smsUpdates':True,'marketing':False},headers=self.headers).status_code,200)
   self.assertEqual(c.get('/api/me').json()['preferences']['emailUpdates'],False)
   booking={'method':'store','items':[{'serviceId':'dry','qty':1}], 'pickupDate':(self.api.date.today()+self.api.timedelta(days=4)).isoformat(),'pickupSlot':'08:00–09:00','contactPhone':'+233 24 567 8901','speed':'standard','paymentChoice':'later'}
   r=c.post('/api/orders',json=booking,headers=self.headers);self.assertEqual(r.status_code,201,r.text)
   self.assertEqual(r.json()['method'],'store')
   self.assertIsNone(r.json()['pickupAddress'])
 def test_08_inquiry(self):
  r=self.client.post('/api/inquiries',json={'name':'Jane Customer','email':'jane@example.com','category':'corporate','message':'We need a sample corporate laundry quote.'},headers=self.headers)
  self.assertEqual(r.status_code,201,r.text)
  with self.login('admin@dees.example.com','AdminPass123!') as c:
   self.assertTrue(any(x['email']=='jane@example.com' for x in c.get('/api/admin/inquiries').json()))
 def test_06_request_header(self):
  with self.login() as c:
   self.assertEqual(c.post('/api/support/messages',json={'body':'hello'}).status_code,403)
if __name__=='__main__':unittest.main(verbosity=2)

