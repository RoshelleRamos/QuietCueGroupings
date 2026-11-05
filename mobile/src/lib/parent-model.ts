import type { Profile, FamilyRequest } from './family';
export type Task = {id:string;user_id:string;title:string;completed:boolean;completed_at:string|null;created_at:string};
export type FocusSession = {id:string;user_id:string;task_id:string|null;started_at:string;planned_end:string;ended_at:string|null};
export type ParentNotification = {id:string;recipient_id:string;kind:'child_connected'|'request'|'emergency';title:string;body:string;request_id:string|null;read_at:string|null;created_at:string};
export type ParentSnapshot = {ownerId:string;profile:Profile|null;children:Profile[];requests:FamilyRequest[];tasks:Task[];sessions:FocusSession[];notifications:ParentNotification[];code:string};
export function emptyParent(ownerId=''):ParentSnapshot {return {ownerId,profile:null,children:[],requests:[],tasks:[],sessions:[],notifications:[],code:''};}
export function forAccount(snapshot:ParentSnapshot,userId:string|null):ParentSnapshot {return userId && snapshot.ownerId===userId?snapshot:emptyParent(userId||'');}
export function activeSession(sessions:FocusSession[],now:number){return sessions.find(s=>!s.ended_at && Date.parse(s.planned_end)>now) ?? null;}
export function focusSeconds(sessions:FocusSession[],now:number,earliest=-Infinity){return sessions.reduce((sum,s)=>sum+Math.max(0,Math.floor((Math.min(now,Date.parse(s.ended_at||s.planned_end))-Math.max(earliest,Date.parse(s.started_at)))/1000)),0);}
export function remainingTime(session:FocusSession|null,now:number){const seconds=session?Math.max(0,Math.ceil((Date.parse(session.planned_end)-now)/1000)):0;return `${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;}
export function notificationBatch(rows:ParentNotification[],seen:Set<string>){return rows.filter(n=>!n.read_at&&!seen.has(n.id)).sort((a,b)=>Number(b.kind==='emergency')-Number(a.kind==='emergency'));}

export function startOfLocalDay(now:number){const date=new Date(now);date.setHours(0,0,0,0);return date.getTime();}
