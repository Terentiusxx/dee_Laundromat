"use client";
import { useCallback,useEffect,useState } from 'react';
export class ApiError extends Error {constructor(public status:number,message:string){super(message);this.name='ApiError';}}
export async function api<T=unknown>(path:string,init:RequestInit={}):Promise<T>{
 const headers=new Headers(init.headers);headers.set('X-Requested-With','DeesWeb');
 if(init.body && typeof init.body==='string' && !headers.has('Content-Type'))headers.set('Content-Type','application/json');
 let res:Response;
 try{res=await fetch('/api'+path,{...init,headers,credentials:'include',cache:'no-store'});}
 catch{throw new ApiError(0,'Cannot reach the Dee’s Laundromat server. Check your connection or start the backend.');}
 if(!res.ok){let message=`Request failed (${res.status})`;
  try{const d=await res.json();message=typeof d.detail==='string'?d.detail:JSON.stringify(d.detail??d);}catch{}
  throw new ApiError(res.status,message);
 }
 if(res.status===204)return undefined as T;
 return res.json() as Promise<T>;
}
export const send=<T=unknown>(path:string,method:'POST'|'PUT'|'PATCH'|'DELETE',body?:unknown)=>api<T>(path,{method,body:body===undefined?undefined:JSON.stringify(body)});
export function useRemote<T>(path:string,initial:T){
 const [data,setData]=useState<T>(initial);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
 const reload=useCallback(async()=>{setLoading(true);try{setData(await api<T>(path));setError('');}catch(e){setError((e as Error).message);}finally{setLoading(false);}},[path]);
 useEffect(()=>{void reload();},[reload]);
 return {data,setData,loading,error,reload};
}
export type Profile={id:number;name:string;email:string;phone:string;role:'customer'|'admin';verifiedEmail:boolean;verifiedPhone:boolean;preferences:{emailUpdates:boolean;smsUpdates:boolean;marketing:boolean}};
export type Address={id:number;label:string;street:string;area:string;region:string;phone:string;instructions:string;isDefault:boolean};
export type PaymentMethod={id:number;kind:'visa'|'mastercard'|'momo';last4:string;expiry:string|null;provider:string|null;isDefault:boolean};
export type Service={id:string;name:string;description:string;rate:number;unit:'kg'|'item';image:string;is_active:number};
export type OrderItem={id:number;service_id:string;title:string;qty:number;unit:string;unit_rate:number;total:number};
export type OrderEvent={status:string;note:string;created_at:string};
export type LaundryOrder={id:number;reference:string;method:'pickup'|'store';status:string;pickup_date:string;pickup_slot:string;pickupAddress:Address|null;deliveryAddress:Address|null;contact_phone:string;speed:string;instructions:string;subtotal:number;express_fee:number;total:number;estimated:number;payment_choice:string;payment_status:string;created_at:string;updated_at:string;items:OrderItem[];events:OrderEvent[];customer_name?:string;customer_email?:string};
export type ChatMessage={id:number;sender:'admin'|'customer';body:string;created_at:string};
export const money=(n:number)=>`GHS ${n.toFixed(2)}`;
export const day=(d:string)=>d?new Date(`${d.slice(0,10)}T12:00:00`).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'—';
export const headlineStatus=(s:string)=>({booked:'Booked',received:'Received',collected:'Collected',cleaning:'In Progress',ready:'Ready for Pickup',out_for_delivery:'Out for Delivery',delivered:'Delivered',cancelled:'Cancelled'} as Record<string,string>)[s]??s;
