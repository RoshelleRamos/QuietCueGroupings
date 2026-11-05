import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

import { type User, backend } from '../lib/api';
import { errorMessage, type Profile, type FamilyRequest } from '../lib/family';
import { emptyParent, forAccount, notificationBatch, type ParentSnapshot, type Task, type FocusSession, type ParentNotification } from '../lib/parent-model';
import { enableDeviceAlerts, presentDeviceAlert } from '../lib/device-alerts';

type ParentContext = ParentSnapshot & {
 user:User|null; loading:boolean;error:string;busy:boolean;alertsEnabled:boolean;
 refresh:()=>Promise<void>; saveTask:(title:string,id?:string)=>Promise<boolean>;
 toggleTask:(task:Task)=>Promise<boolean>; deleteTask:(id:string)=>Promise<boolean>;
 startFocus:(minutes:number,taskId:string|null)=>Promise<boolean>;
 endFocus:(status?:'available'|'break')=>Promise<boolean>;
 answer:(id:string,status:'acknowledged'|'done')=>Promise<boolean>;
 markRead:(id?:string)=>Promise<boolean>;enableAlerts:()=>Promise<void>;logout:()=>Promise<void>;
};
const Context=createContext<ParentContext|null>(null);
const alertKey=(id:string)=>`@quietcue_alerts_enabled:${id}`;
const seenKey=(id:string)=>`@quietcue_delivered:${id}`;
function startOfDay(){const date=new Date();date.setHours(0,0,0,0);return date.toISOString();}
function setupError(e:unknown){return errorMessage(e);}
export function ParentProvider({children}:{children:React.ReactNode}){
 const [user,setUser]=useState<User|null>(null);
 const [snapshot,setSnapshot]=useState<ParentSnapshot>(emptyParent());
 const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 const [alertsEnabled,setAlertsEnabled]=useState(false);
 const currentUser=useRef<User|null>(null);const refreshRef=useRef<()=>Promise<void>>(async()=>{});
 const operation=useRef(false);
 useEffect(()=>{
  let alive=true;let authChanged=false;
  const update=(next:User|null)=>{if(!alive)return;currentUser.current=next;setUser(next);};
  const {data:{subscription}}=backend.auth.onAuthStateChange((_event,session)=>{authChanged=true;update(session?.user??null);});
  backend.auth.getSession().then(({data})=>{if(!authChanged)update(data.session?.user??null);}).catch(()=>update(null));
  return()=>{alive=false;subscription.unsubscribe();};
 },[]);
 const userId=user?.id;const role=user?.user_metadata.role;
 useEffect(()=>{
  let alive=true;let fetching=false;let queued=false;let delivered=new Set<string>();let nativeEnabled=false;
  const valid=()=>alive&&currentUser.current?.id===userId;
  const refresh=async()=>{
   if(!userId||role!=='parent')return;
   if(fetching){queued=true;return;}fetching=true;
   try{
    const results=await Promise.all([
     backend.from('qc_profiles').select('id,full_name,role,focus_status,available_at').eq('id',userId).single(),
     backend.from('qc_family_links').select('child_id').eq('parent_id',userId),
     backend.from('qc_requests').select('*').eq('parent_id',userId).order('created_at',{ascending:false}).limit(100),
     backend.from('qc_tasks').select('*').eq('user_id',userId).order('created_at',{ascending:false}),
     backend.from('qc_focus_sessions').select('*').eq('user_id',userId).gte('planned_end',startOfDay()).order('started_at',{ascending:false}),
     backend.from('qc_notifications').select('*').eq('recipient_id',userId).order('created_at',{ascending:false}).limit(100),
     backend.rpc('qc_my_invite')
    ]);
    if(!valid())return;
    for(const result of results)if(result.error)throw result.error;
    const [own,links,requests,tasks,sessions,notes,code]=results;
    const profile=own.data as Profile;
    if(profile.role!=='parent')throw new Error('Parent account required.');
    const ids=(links.data as {child_id:string}[]).map(l=>l.child_id);
    let members:Profile[]=[];
    if(ids.length){const result=await backend.from('qc_profiles').select('id,full_name,role,focus_status,available_at').in('id',ids);if(result.error)throw result.error;members=result.data as Profile[];}
    if(!valid())return;
    const notifications=notes.data as ParentNotification[];
    setSnapshot({ownerId:userId,profile,children:members,requests:requests.data as FamilyRequest[],tasks:tasks.data as Task[],sessions:sessions.data as FocusSession[],notifications,code:code.data as string});setError('');
    if(AppState.currentState==='active'){
     const batch=notificationBatch(notifications,delivered);
     if(batch.length){
      // Claim IDs before presenting so realtime and polling cannot duplicate alerts.
      for(const n of batch)delivered.add(n.id);
      try { await AsyncStorage.setItem(seenKey(userId),JSON.stringify([...delivered].slice(-500))); } catch { /* Keep alerts working if device storage is full. */ }
      if(!valid())return;
      const note=batch[0];
      const shown=nativeEnabled?await presentDeviceAlert(note,valid):false;
      if(!valid())return;
      if(!shown || note.kind==='emergency')Alert.alert(note.title,batch.length>1?`${note.body}\n\n${batch.length} new family updates in your notification inbox.`:note.body,[{text:'Later',style:'cancel'},{text:'View',onPress:()=>{if(currentUser.current?.id===userId)router.push('/parent/notifications');}}]);
     }
    }
   }catch(e){if(valid())setError(setupError(e));}
   finally{fetching=false;if(valid())setLoading(false);if(queued&&valid()){queued=false;void refresh();}}
  };
  refreshRef.current=refresh;
  const init=async()=>{
   if(!userId||role!=='parent'){if(alive){setSnapshot(emptyParent());setLoading(false);setError('');setAlertsEnabled(false);}return;}
   setSnapshot(emptyParent(userId));setLoading(true);setError('');
   try{
    const [saved,optIn]=await Promise.all([AsyncStorage.getItem(seenKey(userId)),AsyncStorage.getItem(alertKey(userId))]);
    if(!valid())return;
    try{const parsed:unknown=JSON.parse(saved||'[]');if(Array.isArray(parsed))delivered=new Set(parsed.filter((v):v is string=>typeof v==='string'));}catch{delivered=new Set();}
    nativeEnabled=optIn==='yes';setAlertsEnabled(nativeEnabled);
   }catch{/* Inbox still works if local preferences are unavailable. */}
   if(valid())await refresh();
  };
  // Synchronize an external authenticated data source, including on account changes.
  void init();
  const timer=setInterval(()=>{if(AppState.currentState==='active')void refresh();},7000);
  const app=AppState.addEventListener('change',state=>{if(state==='active')void refresh();});
  const preference=()=>{if(userId)void AsyncStorage.getItem(alertKey(userId)).then(value=>{nativeEnabled=value==='yes';});};
  // Preferences are rechecked after the Enable alerts button is used.
  const preferenceTimer=setInterval(preference,3000);
  return()=>{alive=false;clearInterval(timer);clearInterval(preferenceTimer);app.remove();};
 },[userId,role]);
 useEffect(()=>{
  if(Platform.OS==='web')return;
  let alive=true;let remove:(()=>void)|undefined;
  void import('expo-notifications').then(n=>{
   if(!alive)return;
   const subscription=n.addNotificationResponseReceivedListener(response=>{
    if(response.notification.request.content.data?.recipientId===currentUser.current?.id)router.push('/parent/notifications');
   });remove=()=>subscription.remove();
  }).catch(()=>{});
  return()=>{alive=false;remove?.();};
 },[]);
 const refresh=useCallback(()=>refreshRef.current(),[]);
 const run=async(action:(id:string)=>Promise<void>)=>{
  const id=currentUser.current?.id;if(!id||operation.current)return false;
  operation.current=true;setBusy(true);
  try{await action(id);if(currentUser.current?.id===id)await refresh();return true;}
  catch(e){if(currentUser.current?.id===id)Alert.alert('Could not save',setupError(e));return false;}
  finally{operation.current=false;setBusy(false);}
 };
 const data=forAccount(snapshot,userId||null);
 const value:ParentContext={...data,user,loading:loading||!!(userId&&role==='parent'&&snapshot.ownerId!==userId),error,busy,alertsEnabled,
  refresh,
  saveTask:async(title,id)=>run(async uid=>{const clean=title.trim();if(!clean||clean.length>120)throw new Error('Enter a task name between 1 and 120 characters.');const result=id?await backend.from('qc_tasks').update({title:clean}).eq('id',id).eq('user_id',uid).select('id').single():await backend.from('qc_tasks').insert({user_id:uid,title:clean}).select('id').single();if(result.error)throw result.error;}),
  toggleTask:async task=>run(async uid=>{const {error:e}=await backend.from('qc_tasks').update({completed:!task.completed}).eq('id',task.id).eq('user_id',uid).select('id').single();if(e)throw e;}),
  deleteTask:async id=>run(async uid=>{const {error:e}=await backend.from('qc_tasks').delete().eq('id',id).eq('user_id',uid).select('id').single();if(e)throw e;}),
  startFocus:async(minutes,taskId)=>run(async()=>{const {error:e}=await backend.rpc('qc_start_focus',{minutes,selected_task:taskId});if(e)throw e;}),
  endFocus:async(status='available')=>run(async()=>{const {error:e}=await backend.rpc('qc_end_focus',{next_status:status});if(e)throw e;}),
  answer:async(id,status)=>run(async uid=>{const {error:e}=await backend.from('qc_requests').update({status}).eq('id',id).eq('parent_id',uid).select('id').single();if(e)throw e;}),
  markRead:async id=>run(async uid=>{let query=backend.from('qc_notifications').update({read_at:new Date().toISOString()}).eq('recipient_id',uid).is('read_at',null);if(id)query=query.eq('id',id);const {error:e}=await query;if(e)throw e;}),
  enableAlerts:async()=>{
   const id=currentUser.current?.id;if(!id)return;
   try{const granted=await enableDeviceAlerts();if(currentUser.current?.id!==id)return;await AsyncStorage.setItem(alertKey(id),granted?'yes':'no');setAlertsEnabled(granted);Alert.alert(granted?'Device alerts enabled':'In-app alerts are available',granted?'You’ll receive device banners for family updates received while QuietCue is running. Closed-app push delivery requires a separate server setup.':'Allow notifications in your phone settings for device banners. Your notification inbox and in-app alerts still work.');}
   catch(e){Alert.alert('Device alerts unavailable',errorMessage(e));}
  },
  logout:async()=>{const {error:e}=await backend.auth.signOut();if(e){Alert.alert('Could not log out',e.message);return;}setSnapshot(emptyParent());router.replace('/');}
 };
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useParent(){const value=useContext(Context);if(!value)throw new Error('ParentProvider is required');return value;}
