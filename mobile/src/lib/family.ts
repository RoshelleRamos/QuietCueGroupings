import { backend } from './api';
export type Profile = { id: string; full_name: string; role: string; focus_status: 'available'|'focusing'|'break'; available_at: string|null };
export type FamilyRequest = { id: string; child_id: string; parent_id: string; category: string; message: string; priority: 'normal'|'emergency'; status: 'pending'|'acknowledged'|'done'; created_at: string };
export const categories = ['School help','Food & drink','Can we talk?','Something else'] as const;
export function errorMessage(error: unknown) {
 const value = error as { code?: string; message?: string };
 if (value?.code === '42P01' || value?.code === '42883') return 'The database needs setup. Ask the app administrator to run the backend migration, then tap Retry.';
 return value?.message || 'Could not connect. Check your internet connection and try again.';
}
export function parentStatus(parent: Profile|null, now = Date.now()) {
 if (!parent) return { label: 'Not connected', detail: 'Ask your parent for a family code.', color: '#837C91', focusing: false };
 const end = parent.available_at ? new Date(parent.available_at).getTime() : null;
 const focusing = parent.focus_status === 'focusing' && (!end || end > now);
 if (focusing) return { label: 'Focusing', detail: end ? `Available at ${new Date(end).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · about ${Math.max(1, Math.ceil((end-now)/60000))} min` : 'Your parent is focusing right now.', color: '#B26326', focusing };
 if (parent.focus_status === 'break') return { label: 'On a break', detail: 'A little pause before the next focus time.', color: '#4765A8', focusing };
 return { label: 'Available', detail: 'A good time to say hello.', color: '#26785E', focusing };
}
export async function loadFamily(userId: string, parentMode = false) {
 const own = await backend.from('qc_profiles').select('id,full_name,role,focus_status,available_at').eq('id',userId).single();
 if (own.error) throw own.error;
 let parent: Profile|null = null;
 if (!parentMode) {
  const link = await backend.from('qc_family_links').select('parent_id').eq('child_id',userId).maybeSingle();
  if (link.error) throw link.error;
  if (link.data) {
   const result = await backend.from('qc_profiles').select('id,full_name,role,focus_status,available_at').eq('id',link.data.parent_id).single();
   if (result.error) throw result.error; parent = result.data as Profile;
  }
 }
 const requests = await backend.from('qc_requests').select('*').eq(parentMode ? 'parent_id':'child_id',userId).order('created_at',{ascending:false}).limit(100);
 if(requests.error) throw requests.error;
 return { own: own.data as Profile, parent, requests: requests.data as FamilyRequest[] };
}
