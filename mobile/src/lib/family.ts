export type Profile = { id: string; full_name: string; role: string; focus_status: 'available'|'focusing'|'break'; available_at: string|null };
export type FamilyRequest = { id: string; child_id: string; parent_id: string; category: string; message: string; priority: 'normal'|'emergency'; status: 'pending'|'acknowledged'|'done'; created_at: string };
export const categories = ['School help','Food & drink','Can we talk?','Something else'] as const;
export function errorMessage(error: unknown) {
 return error instanceof Error ? error.message : 'Something went wrong with local storage.';
}
export function parentStatus(parent: Profile|null, now = Date.now()) {
 if (!parent) return { label: 'Not connected', detail: 'Ask your parent for a family code.', color: '#837C91', focusing: false };
 const end = parent.available_at ? new Date(parent.available_at).getTime() : null;
 const focusing = parent.focus_status === 'focusing' && (!end || end > now);
 if (focusing) return { label: 'Focusing', detail: end ? `Available at ${new Date(end).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · about ${Math.max(1, Math.ceil((end-now)/60000))} min` : 'Your parent is focusing right now.', color: '#B26326', focusing };
 if (parent.focus_status === 'break') return { label: 'On a break', detail: 'A little pause before the next focus time.', color: '#4765A8', focusing };
 return { label: 'Available', detail: 'A good time to say hello.', color: '#26785E', focusing };
}
