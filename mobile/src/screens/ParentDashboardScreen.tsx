import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Image, ImageBackground, KeyboardAvoidingView, Modal, Platform,
  Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle } from 'react-native-svg';

import { errorMessage, parentStatus, type FamilyRequest, type Profile } from '../lib/family';
import {
  activeSession, clockTime, currentPause, emptyParent, focusSeconds, localDate,
  remainingSeconds, startOfLocalDay, type FocusSession, type ParentSnapshot, type Task,
} from '../lib/parent-model';
import { pickAttachment, type AttachmentDraft } from '../lib/message-attachments';
import MessageAttachment from './MessageAttachment';
import { showAlert } from '../lib/show-alert';
import { useParent } from '../state/ParentProvider';

type Icon = React.ComponentProps<typeof Ionicons>['name'];
const tabs = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'tasks', label: 'Tasks', icon: 'clipboard-outline' },
  { id: 'focus', label: 'Focus', icon: 'timer-outline' },
  { id: 'messages', label: 'Inbox', icon: 'mail-outline' },
] as const;
const pages = ['home', 'tasks', 'focus', 'messages', 'conversation', 'compose', 'family', 'notifications', 'reports', 'profile'];
const pink = '#A72559';
const rose = '#C04774';
const dark = '#402C35';
const muted = '#745B67';

function go(page: string, params: Record<string, string> = {}) {
  router.replace({ pathname: '/parent/[page]', params: { page, ...params } });
}

function Button({ label, onPress, icon, subtle, disabled }: {
  label: string; onPress: () => void; icon?: Icon; subtle?: boolean; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [s.button, subtle && s.subtleButton, (pressed || disabled) && s.dim]}>
    {icon && <Ionicons name={icon} size={17} color={subtle ? pink : '#FFF'} />}
    <Text style={[s.buttonText, subtle && s.subtleText]}>{label}</Text>
  </Pressable>;
}

function IconButton({ label, icon, onPress, light, disabled }: {
  label: string; icon: Icon; onPress: () => void; light?: boolean; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [s.iconButton, (pressed || disabled) && s.dim]}>
    <Ionicons name={icon} size={23} color={light ? '#FFF' : pink} />
  </Pressable>;
}

function Chips({ values, selected, onSelect }: { values: readonly string[]; selected: string; onSelect: (value: string) => void }) {
  return <View style={s.chips}>{values.map(value => <Pressable key={value} accessibilityRole="button"
    accessibilityState={{ selected: value === selected }} onPress={() => onSelect(value)}
    style={[s.chip, value === selected && s.chipActive]}>
    <Text style={s.chipText}>{value}</Text>
  </Pressable>)}</View>;
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
    <Text style={s.avatarText}>{name.trim().slice(0, 1).toUpperCase()}</Text>
  </View>;
}

function Empty({ icon, title, detail }: { icon: Icon; title: string; detail: string }) {
  return <View style={s.empty}>
    <Ionicons name={icon} size={26} color={rose} />
    <Text style={s.cardTitle}>{title}</Text>
    <Text style={s.emptyDetail}>{detail}</Text>
  </View>;
}

function Section({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return <View style={s.between}>
    <Text style={s.section}>{title}</Text>
    {action && onPress && <Pressable accessibilityRole="button" onPress={onPress} style={s.textAction}>
      <Text style={s.link}>{action}</Text>
    </Pressable>}
  </View>;
}

function FocusRing({ session, now, duration, small = false }: {
  session: FocusSession | null; now: number; duration: number; small?: boolean;
}) {
  const remaining = session ? remainingSeconds(session, now) : duration * 60;
  const focused = session ? focusSeconds([session], now) : 0;
  const total = remaining + focused;
  const progress = session && total ? remaining / total : 1;
  const size = small ? 78 : 222;
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  return <View style={[s.ring, { width: size, height: size }]}>
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx={50} cy={50} r={radius} stroke="#E4BCCB" strokeWidth={8} fill="none" />
      {progress > 0 && <Circle cx={50} cy={50} r={radius} stroke={rose} strokeWidth={8} fill="none"
        strokeLinecap="round" strokeDasharray={[circumference, circumference]}
        strokeDashoffset={circumference * (1 - progress)} rotation={-90} origin="50, 50" />}
    </Svg>
    <View style={s.ringCopy} pointerEvents="none">
      {!small && <Text style={s.caption}>{currentPause(session) ? 'Paused' : session ? 'Time remaining' : 'Selected duration'}</Text>}
      <Text accessibilityLabel="Focus time remaining" style={small ? s.miniTime : s.time}>{clockTime(remaining)}</Text>
      {!small && <Text style={s.caption}>{clockTime(focused)} focused</Text>}
    </View>
  </View>;
}

function TaskCheck({ task, onPress, compact = false, disabled }: {
  task: Task; onPress: () => void; compact?: boolean; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="checkbox" accessibilityLabel={task.title}
    accessibilityState={{ checked: task.completed, disabled }} disabled={disabled}
    onPress={onPress} style={[s.taskCheck, compact && s.compactCheck]}>
    <Ionicons name={task.completed ? 'checkbox' : 'square-outline'} color={rose} size={compact ? 16 : 23} />
    <View style={s.grow}>
      <Text numberOfLines={compact ? 1 : undefined} style={[compact ? s.caption : s.cardTitle, task.completed && s.strike]}>{task.title}</Text>
      {!compact && task.due_date && <Text style={s.caption}>Due {task.due_date}</Text>}
    </View>
  </Pressable>;
}

function RequestRow({ request, name, onPress, compact = false }: {
  request: FamilyRequest; name: string; onPress: () => void; compact?: boolean;
}) {
  const urgent = request.priority === 'emergency';
  return <Pressable accessibilityRole="button" accessibilityLabel={`Open request from ${name}: ${request.message}`}
    onPress={onPress} style={[s.request, urgent ? s.urgent : s.standard]}>
    {urgent && !compact && <Text style={s.urgentText}>⚠ Urgent Request</Text>}
    <View style={s.row}>
      {!compact && <Avatar name={name} />}
      <View style={s.grow}>
        <Text style={s.cardTitle}>{name} <Text style={s.caption}>· {request.category}</Text></Text>
        <Text style={s.body} numberOfLines={compact ? 1 : 2}>{request.message}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={pink} />
    </View>
  </Pressable>;
}

export default function ParentDashboardScreen({ preview = false }: { preview?: boolean }) {
  const parent = useParent();
  return <ParentAccountScreen key={preview ? 'preview' : parent.user?.id ?? 'signed-out'} preview={preview} />;
}

function ParentAccountScreen({ preview }: { preview: boolean }) {
  const parent = useParent();
  const data = preview ? emptyParent() : parent;
  const { page, child, request, task, period } = useLocalSearchParams<{
    page?: string; child?: string; request?: string; task?: string; period?: string;
  }>();
  const active = page && pages.includes(page) ? page : 'home';
  const [now, setNow] = useState(Date.now);
  const [menu, setMenu] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [editor, setEditor] = useState<{ task: Task | null; title: string; dueDate: string } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!preview && !parent.loading && parent.user?.user_metadata.role !== 'parent') router.replace('/');
  }, [parent.user, parent.loading, preview]);

  const name = data.profile?.full_name || 'Parent';
  const unread = data.notifications.filter(note => !note.read_at).length;
  const session = activeSession(data.sessions, now);
  const today = localDate(now);
  const todayTasks = data.tasks.filter(item => !item.due_date || item.due_date <= today);
  const busy = preview || signingOut || parent.busy || parent.loading || !!parent.error || !data.profile;
  const status = parentStatus(data.profile, now);
  const member = data.children.find(profile => profile.id === child);
  const inboxActive = ['messages', 'conversation', 'compose'].includes(active);
  const title = active === 'notifications' ? 'Notifications' : 'Quiet Cue';
  const openThread = (childId: string, requestId?: string) => go('conversation', {
    child: childId, ...(requestId ? { request: requestId } : {}),
  });
  const editTask = (item: Task | null) => setEditor({ task: item, title: item?.title ?? '', dueDate: item?.due_date ?? '' });
  const removeTask = (item: Task) => showAlert('Delete task?', item.title, [
    { text: 'Keep task', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => void parent.deleteTask(item.id) },
  ]);
  const logout = () => {
    setMenu(false);
    showAlert('Log out?', 'Your account and activity stay saved on this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', onPress: () => {
        setSigningOut(true);
        void parent.logout().finally(() => setSigningOut(false));
      } },
    ]);
  };

  const scroll = (content: React.ReactNode) => <ScrollView key={active} style={s.grow}
    contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"
    refreshControl={<RefreshControl refreshing={!preview && parent.loading} tintColor={pink} onRefresh={() => void parent.refresh()} />}>
    {!preview && parent.error && <View style={s.card}>
      <Text style={s.cardTitle}>Your data could not be loaded</Text>
      <Text style={s.body}>{parent.error}</Text>
      <Button label="Retry" icon="refresh" onPress={() => void parent.refresh()} />
    </View>}
    {content}
  </ScrollView>;

  return <SafeAreaView edges={['top', 'bottom']} style={[s.safe, (active === 'conversation' || active === 'compose') && s.threadSafe]}>
    <StatusBar style={active === 'conversation' || active === 'compose' ? 'dark' : 'light'} />
    <View style={s.shell}>
      {active !== 'conversation' && active !== 'compose' && <LinearGradient colors={['#A62C59', '#E6749C', '#FFACCA']} style={s.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="QuietCue home" onPress={() => go('home')} style={s.brand}>
          <Image source={require('../../assets/QQ LOGO.png')} style={s.logo} />
          <Text style={s.brandText}>{title}</Text>
        </Pressable>
        <View style={s.row}>
          <View>
            <IconButton light label={`Notifications, ${unread} unread`} icon="notifications" onPress={() => go('notifications')} />
            {unread > 0 && <View style={s.badge} pointerEvents="none"><Text style={s.badgeText}>{unread > 99 ? '99+' : unread}</Text></View>}
          </View>
          <IconButton light label="Open menu" icon="menu" onPress={() => setMenu(true)} />
        </View>
      </LinearGradient>}
      <LinearGradient colors={['#FFF0F1', '#F6CBD8', '#FDECEF']} style={s.grow}>
        {inboxActive && active !== 'messages' ? <Conversation key={`${active}:${child ?? ''}:${request ?? ''}`}
          data={data} member={member} requestId={request} composing={active === 'compose'} busy={busy}
          onSend={parent.sendMessage} onAnswer={parent.answer} /> : scroll(<>
          {active === 'home' && <>
            <Pressable accessibilityRole="button" accessibilityLabel="Manage availability" onPress={() => go('focus')} style={[s.card, s.accountCard]}>
              <Avatar name={name} size={48} />
              <View style={s.grow}>
                <Text style={s.cardTitle}>Parent · {name}</Text>
                <View style={[s.statusPill, { alignSelf: 'flex-start' }]}>
                  <View style={[s.dot, { backgroundColor: session && !currentPause(session) ? '#D42854' : status.color }]} />
                  <Text style={s.caption}>{status.label}{session && !currentPause(session) ? ` · Available at ${timeLabel(session.planned_end)}` : ''}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" color={pink} size={16} />
            </Pressable>
            <View style={s.homeGrid}>
              <View style={[s.card, s.homeCard, s.focusCard]}>
                <Text style={s.cardTitle}>Focus Session</Text>
                <FocusRing session={session} now={now} duration={25} small />
                <Text style={s.caption}>{clockTime(focusSeconds(data.sessions, now, startOfLocalDay(now)))} focused today</Text>
                <Button label={session ? 'View Session' : 'Start Session'} onPress={() => go('focus')} />
              </View>
              <View style={[s.card, s.homeCard]}>
                <Text style={s.cardTitle}>Today’s Tasks</Text>
                {todayTasks.length ? todayTasks.slice(0, 5).map(item => <TaskCheck key={item.id} task={item} compact disabled={busy}
                  onPress={() => void parent.toggleTask(item)} />) : <Text style={s.caption}>No tasks yet.</Text>}
                <Pressable accessibilityRole="button" onPress={() => go('tasks')} style={s.textAction}>
                  <Text style={s.link}>{todayTasks.length ? 'View All' : 'Add a task'}</Text>
                </Pressable>
              </View>
            </View>
            <Section title="Pending Requests" action="View all" onPress={() => go('messages')} />
            {data.requests.some(item => item.status !== 'done') ? [...data.requests]
              .filter(item => item.status !== 'done')
              .sort((a, b) => Number(b.priority === 'emergency') - Number(a.priority === 'emergency')).slice(0, 4)
              .map(item => <RequestRow key={item.id} request={item} compact
                name={data.children.find(profile => profile.id === item.child_id)?.full_name ?? 'Family member'}
                onPress={() => openThread(item.child_id, item.id)} />)
              : <Empty title="No pending requests" detail="Requests from connected family members appear here." icon="mail-open-outline" />}
            <Section title="Family Overview" action="Family code" onPress={() => go('family')} />
            <FamilyList members={data.children} onOpen={profile => openThread(profile.id)} />
          </>}
          {active === 'tasks' && <TasksPage data={data} today={today} busy={busy}
            onAdd={() => editTask(null)} onEdit={editTask} onDelete={removeTask} onToggle={parent.toggleTask} />}
          {active === 'focus' && <FocusPage key={task ?? 'focus'} data={data} session={session} now={now}
            taskId={task} busy={busy} onStart={parent.startFocus} onPause={parent.setFocusPaused} onEnd={parent.endFocus} />}
          {active === 'messages' && <Inbox data={data} onOpen={openThread} />}
          {active === 'notifications' && <>
            <Section title="Notifications" />
            <Text style={s.caption}>{unread} unread family updates</Text>
            {unread > 0 && <Button label="Mark all as read" icon="checkmark-done" disabled={busy} subtle onPress={() => void parent.markRead()} />}
            {data.notifications.map(note => {
              const related = data.requests.find(item => item.id === note.request_id);
              const childId = note.child_id ?? related?.child_id;
              const open = async () => {
                if (!note.read_at && !await parent.markRead(note.id)) return;
                if (childId && note.kind !== 'child_connected') openThread(childId, note.request_id ?? undefined);
                else go('family');
              };
              return <View key={note.id} style={[s.request, note.kind === 'emergency' ? s.urgent : s.standard]}>
                <Pressable accessibilityRole="button" accessibilityLabel={`Open notification: ${note.title}`} onPress={() => void open()} style={s.row}>
                  <Ionicons name={note.kind === 'emergency' ? 'warning' : 'notifications-outline'} size={20} color={pink} />
                  <View style={s.grow}>
                    <Text style={s.cardTitle}>{note.title}</Text>
                    <Text style={s.body}>{note.body}</Text>
                    <Text style={s.caption}>{timeLabel(note.created_at)} · {note.read_at ? 'Read' : 'New'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={pink} />
                </Pressable>
                {!note.read_at && <Button label="Mark as read" subtle disabled={busy} onPress={() => void parent.markRead(note.id)} />}
              </View>;
            })}
            <View style={s.card}>
              <Text style={s.cardTitle}>Weekly Report</Text>
              <Text style={s.body}>Review your focus time and completed tasks.</Text>
              <Button label="View weekly report" subtle onPress={() => go('reports', { period: 'week' })} />
            </View>
          </>}
          {active === 'family' && <>
            <Section title="My family" />
            <View style={s.card}>
              <Text style={s.cardTitle}>Your family code</Text>
              <Text selectable style={s.code}>{data.code || '—'}</Text>
              <Text style={s.body}>On this device, open the Child profile and enter the code under My family.</Text>
              <Button label={Platform.OS === 'web' ? 'Copy family code' : 'Share family code'} icon="share-social-outline"
                disabled={!data.code} onPress={() => void shareFamilyCode(data.code)} />
            </View>
            <Section title="Connected family" />
            <FamilyList members={data.children} onOpen={profile => openThread(profile.id)} />
          </>}
          {active === 'reports' && <Reports data={data} now={now} weekly={period === 'week'} />}
          {active === 'profile' && <>
            <Section title="My profile" />
            <View style={s.card}>
              <Avatar name={name} size={64} />
              <Text style={s.section}>{name}</Text>
              <Text style={s.body}>{parent.user?.email}</Text>
              <Text style={s.caption}>Parent account · Saved on this device</Text>
            </View>
            <Button label="My family & family code" subtle onPress={() => go('family')} />
            <Button label="Notifications" subtle onPress={() => go('notifications')} />
            <Button label="Today’s report" subtle onPress={() => go('reports')} />
            <Button label="Log out" icon="log-out-outline" disabled={busy} onPress={logout} />
          </>}
        </>)}
        {(active === 'tasks' || active === 'messages') && <Pressable accessibilityRole="button"
          accessibilityLabel={active === 'tasks' ? 'Add a task' : 'New conversation'}
          disabled={busy} onPress={() => active === 'tasks' ? editTask(null) : go('compose')}
          style={[s.floating, busy && s.dim]}>
          <LinearGradient colors={['#E97F9F', '#AA2C60']} style={s.floatingFill}><Ionicons name="add" color="#FFF" size={30} /></LinearGradient>
        </Pressable>}
      </LinearGradient>
      {active !== 'conversation' && active !== 'compose' && <LinearGradient colors={['#FFC0D4', '#E482A7', '#BC4A78']} style={s.navBase}>
        <View style={s.nav}>
          {tabs.map(tab => {
            const selected = active === tab.id || (tab.id === 'messages' && inboxActive);
            return <Pressable key={tab.id} accessibilityRole="tab" accessibilityLabel={tab.label}
              accessibilityState={{ selected }} onPress={() => go(tab.id)} style={[s.tab, selected && s.tabActive]}>
              <Ionicons name={tab.icon} size={21} color={selected ? pink : '#FFF'} />
              <Text style={[s.tabText, selected && s.tabTextActive]}>{tab.label}</Text>
            </Pressable>;
          })}
        </View>
      </LinearGradient>}
      <Modal visible={menu} transparent animationType="fade" onRequestClose={() => setMenu(false)}>
        <View style={s.overlay}><View style={s.modal}>
          <View style={s.between}><Text style={s.section}>Quiet Cue</Text><IconButton label="Close menu" icon="close" onPress={() => setMenu(false)} /></View>
          {[
            ['My profile', 'profile'], ['My family', 'family'], ['Notifications', 'notifications'], ['Reports', 'reports'],
          ].map(([label, route]) => <Button key={route} label={label} subtle onPress={() => { setMenu(false); go(route); }} />)}
          <Button label="Log out" icon="log-out-outline" disabled={busy} onPress={logout} />
        </View></View>
      </Modal>
      <Modal visible={editor !== null} transparent animationType="fade" onRequestClose={() => { if (!parent.busy) setEditor(null); }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}>
          {editor && <View style={s.modal}>
            <Text style={s.section}>{editor.task ? 'Edit task' : 'Add a task'}</Text>
            <TextInput accessibilityLabel="Task name" autoFocus value={editor.title} maxLength={120} placeholder="What would you like to do?"
              placeholderTextColor={muted} onChangeText={value => setEditor({ ...editor, title: value })} style={s.input} />
            <Text style={s.caption}>Due date (optional)</Text>
            <TextInput accessibilityLabel="Due date" value={editor.dueDate} maxLength={10} placeholder="YYYY-MM-DD"
              placeholderTextColor={muted} onChangeText={value => setEditor({ ...editor, dueDate: value })} style={s.input} />
            <Button label="Save task" icon="checkmark" disabled={busy || !editor.title.trim()} onPress={async () => {
              if (await parent.saveTask(editor.title, editor.task?.id, editor.dueDate.trim() || null)) setEditor(null);
            }} />
            <Button label="Cancel" subtle disabled={parent.busy} onPress={() => setEditor(null)} />
          </View>}
        </KeyboardAvoidingView>
      </Modal>
      <Modal visible={signingOut} animationType="fade" onRequestClose={() => {}}>
        <ImageBackground source={require('../../assets/DesignBG.png')} resizeMode="cover" style={s.logout}>
          <Image source={require('../../assets/QQ LOGO.png')} style={s.logoutLogo} />
          <ActivityIndicator color="#FFF" />
          <Text style={s.brandText}>Logging out…</Text>
        </ImageBackground>
      </Modal>
    </View>
  </SafeAreaView>;
}

function TasksPage({ data, today, busy, onAdd, onEdit, onDelete, onToggle }: {
  data: ParentSnapshot; today: string; busy: boolean; onAdd: () => void;
  onEdit: (task: Task) => void; onDelete: (task: Task) => void; onToggle: (task: Task) => Promise<boolean>;
}) {
  const [filter, setFilter] = useState('All Tasks');
  const tasks = data.tasks.filter(task => {
    if (filter === 'Today') return !task.due_date || task.due_date <= today;
    if (filter === 'Upcoming') return !!task.due_date && task.due_date > today;
    return true;
  });

  return <View style={s.fabSpace}>
    <Chips values={['All Tasks', 'Today', 'Upcoming', 'Requests']} selected={filter}
      onSelect={value => value === 'Requests' ? go('messages') : setFilter(value)} />
    <Pressable accessibilityRole="button" accessibilityLabel="Add a new task" disabled={busy} onPress={onAdd} style={s.addField}>
      <Ionicons name="add" size={21} color={pink} /><Text style={s.body}>Add a new task...</Text>
    </Pressable>
    <Section title={filter === 'Upcoming' ? 'Upcoming Work' : filter === 'Today' ? 'Today’s Work' : 'My Tasks'} />
    <Text style={s.caption}>{tasks.filter(task => task.completed).length} of {tasks.length} completed</Text>
    {tasks.length ? tasks.map(task => <View key={task.id} style={s.taskRow}>
      <TaskCheck task={task} disabled={busy} onPress={() => void onToggle(task)} />
      {!task.completed && <IconButton label={`Focus on ${task.title}`} icon="timer-outline" disabled={busy}
        onPress={() => go('focus', { task: task.id })} />}
      <IconButton label={`Edit ${task.title}`} icon="create-outline" disabled={busy} onPress={() => onEdit(task)} />
      <IconButton label={`Delete ${task.title}`} icon="trash-outline" disabled={busy} onPress={() => onDelete(task)} />
    </View>) : <Empty title="No tasks here yet" detail="Add a task or choose a different filter." icon="clipboard-outline" />}
  </View>;
}

function FocusPage({ data, session, now, taskId, busy, onStart, onPause, onEnd }: {
  data: ParentSnapshot; session: FocusSession | null; now: number; taskId?: string; busy: boolean;
  onStart: (minutes: number, taskId: string | null) => Promise<boolean>;
  onPause: (paused: boolean) => Promise<boolean>;
  onEnd: (status?: 'available' | 'break') => Promise<boolean>;
}) {
  const [duration, setDuration] = useState('25 min');
  const [selectedTaskId, setSelectedTaskId] = useState(taskId ?? '');
  const paused = !!currentPause(session);
  const minutes = Number.parseInt(duration, 10);
  const unfinished = data.tasks.filter(task => !task.completed);
  const selected = unfinished.find(task => task.id === selectedTaskId);
  const task = session ? data.tasks.find(task => task.id === session.task_id) : selected;

  return <>
    <View style={s.focusCenter}>
      <Text style={s.heading}>{session ? 'Current Session' : 'Focus Session'}</Text>
      <Text style={s.body}>{task?.title ?? 'Quiet focus'}</Text>
      <FocusRing session={session} now={now} duration={minutes} />
      {session && !paused && <Text style={s.caption}>Available at {timeLabel(session.planned_end)}</Text>}
      <Text style={s.cardTitle}>Focus Controls</Text>
      {session ? <View style={s.controls}>
        <Button label="Stop" icon="stop" disabled={busy} onPress={() => void onEnd()} />
        <Button label={paused ? 'Resume' : 'Pause'} icon={paused ? 'play' : 'pause'} subtle disabled={busy} onPress={() => void onPause(!paused)} />
        <Button label="Skip" icon="play-skip-forward" disabled={busy} onPress={() => void onEnd('break')} />
      </View> : <Button label="Start a focus session" icon="play" disabled={busy} onPress={() => void onStart(minutes, selected?.id ?? null)} />}
    </View>
    {!session && <View style={s.card}>
      <Text style={s.cardTitle}>Choose your focus time</Text>
      <Chips values={['15 min', '25 min', '50 min']} selected={duration} onSelect={setDuration} />
      <Text style={s.cardTitle}>Focus on a task (optional)</Text>
      <Button label="Just focus" subtle={!!selected} onPress={() => setSelectedTaskId('')} />
      {unfinished.map(item => <Button key={item.id} label={item.title} subtle={selected?.id !== item.id}
        onPress={() => setSelectedTaskId(item.id)} />)}
    </View>}
    <View style={s.card}>
      <Text style={s.cardTitle}>Availability</Text>
      <Text style={s.body}>Current: {parentStatus(data.profile, now).label}</Text>
      <View style={s.controls}>
        <Button label="Available" subtle disabled={busy} onPress={() => void onEnd()} />
        <Button label="On a break" subtle disabled={busy} onPress={() => void onEnd('break')} />
      </View>
    </View>
    <Button label="View today’s report" subtle onPress={() => go('reports')} />
  </>;
}

function Inbox({ data, onOpen }: { data: ParentSnapshot; onOpen: (childId: string, requestId?: string) => void }) {
  const [filter, setFilter] = useState('Waiting');
  const requests = [...data.requests].filter(request => filter === 'All' || request.status === (
    filter === 'Waiting' ? 'pending' : filter === 'Seen' ? 'acknowledged' : 'done'
  )).sort((a, b) => Number(b.priority === 'emergency') - Number(a.priority === 'emergency'));
  const contacts = data.children.filter(member => data.messages.some(message => message.child_id === member.id));

  return <View style={s.fabSpace}>
    <Text style={s.heading}>Message Requests</Text>
    <Chips values={['Waiting', 'Seen', 'Done', 'All']} selected={filter} onSelect={setFilter} />
    {requests.length ? requests.map(request => <RequestRow key={request.id} request={request}
      name={data.children.find(member => member.id === request.child_id)?.full_name ?? 'Family member'}
      onPress={() => onOpen(request.child_id, request.id)} />)
      : <Empty title="No requests in this view" detail="Use the filters or start a conversation with a connected family member." icon="mail-outline" />}
    {contacts.length > 0 && <>
      <Section title="Conversations" />
      <FamilyList members={contacts} onOpen={member => onOpen(member.id)} />
    </>}
  </View>;
}

function FamilyList({ members, onOpen }: { members: Profile[]; onOpen: (member: Profile) => void }) {
  return members.length ? members.map(member => <Pressable key={member.id} accessibilityRole="button"
    accessibilityLabel={`Open conversation with ${member.full_name}`} style={s.member}
    onPress={() => onOpen(member)}>
    <Avatar name={member.full_name} />
    <View style={s.grow}>
      <Text style={s.cardTitle}>{member.full_name}</Text>
      <Text style={s.caption}>{member.role === 'child' ? 'Child' : 'Family member'}</Text>
    </View>
    <Ionicons name="chevron-forward" size={16} color={pink} />
  </Pressable>) : <Empty title="No family members connected" detail="Connect a Child or Family account using your family code on this device." icon="people-outline" />;
}

function Conversation({ data, member, requestId, composing, busy, onSend, onAnswer }: {
  data: ParentSnapshot; member?: Profile; requestId?: string; composing: boolean; busy: boolean;
  onSend: (childId: string, body: string, attachment?: AttachmentDraft) => Promise<boolean>;
  onAnswer: (id: string, status: 'acknowledged' | 'done') => Promise<boolean>;
}) {
  const [recipient, setRecipient] = useState<Profile | undefined>(member);
  const [body, setBody] = useState('');
  const [attachment, setAttachment] = useState<AttachmentDraft>();
  const [picking, setPicking] = useState(false);
  const thread = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const requests = data.requests.filter(request => request.child_id === recipient?.id);
  const messages = data.messages.filter(message => message.child_id === recipient?.id);
  const timeline = [
    ...requests.map(request => ({ key: `r${request.id}`, created: request.created_at, request })),
    ...messages.map(message => ({ key: `m${message.id}`, created: message.created_at, message })),
  ].sort((a, b) => a.created.localeCompare(b.created));
  const attach = async () => {
    setPicking(true);
    try {
      const file = await pickAttachment();
      if (file) setAttachment(file);
    } catch (cause) {
      showAlert('Could not attach file', errorMessage(cause));
    } finally {
      setPicking(false);
    }
  };
  const send = async () => {
    if (recipient && await onSend(recipient.id, body, attachment)) {
      setBody('');
      setAttachment(undefined);
      if (composing) go('conversation', { child: recipient.id });
    }
  };

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.grow}>
    <View style={s.conversationHeader}>
      <IconButton label="Back to inbox" icon="arrow-back" onPress={() => go('messages')} />
      {recipient && <Avatar name={recipient.full_name} />}
      <View style={s.grow}>
        <Text style={s.cardTitle}>{composing ? 'New Conversation' : recipient?.full_name ?? 'Conversation'}</Text>
        {!composing && <Text style={s.caption}>Saved on this device</Text>}
      </View>
      {composing && recipient && <IconButton label="Change recipient" icon="person-add-outline"
        onPress={() => { setRecipient(undefined); setAttachment(undefined); }} />}
    </View>
    <ScrollView ref={thread} style={s.grow} contentContainerStyle={s.thread} keyboardShouldPersistTaps="handled"
      onContentSizeChange={() => { if (!requestId) thread.current?.scrollToEnd({ animated: false }); }}>
      {composing && !recipient ? <>
        <Text style={s.section}>Recipient</Text>
        <FamilyList members={data.children} onOpen={setRecipient} />
        {!data.children.length && <Button label="Open family code" subtle onPress={() => go('family')} />}
      </> : <>
        {composing && recipient && <Text style={s.caption}>To: {recipient.full_name}</Text>}
        {timeline.length === 0 && recipient && <Text style={s.emptyDetail}>Start the conversation with a message.</Text>}
        {!recipient && !composing && <Empty title="Conversation unavailable" detail="Choose a connected family member from the inbox." icon="chatbubbles-outline" />}
        {timeline.map(item => 'request' in item ? <View key={item.key}
          style={[s.bubble, item.request.priority === 'emergency' && s.urgent, item.request.id === requestId && s.highlight]}>
          <Text style={s.cardTitle}>{item.request.priority === 'emergency' ? '⚠ Urgent Request' : item.request.category}</Text>
          <Text style={s.body}>{item.request.message}</Text>
          <Text style={s.caption}>{timeLabel(item.created)} · {item.request.status === 'pending' ? 'Waiting' : item.request.status === 'acknowledged' ? 'Seen' : 'Done'}</Text>
          {item.request.status !== 'done' && <View style={s.controls}>
            {item.request.status === 'pending' && <Button label="Mark as seen" subtle disabled={busy} onPress={() => void onAnswer(item.request.id, 'acknowledged')} />}
            <Button label="Mark as done" subtle disabled={busy} onPress={() => void onAnswer(item.request.id, 'done')} />
          </View>}
        </View> : <View key={item.key} style={[s.bubble, item.message.sender === 'parent' && s.outgoing]}>
          {item.message.body !== '' && <Text style={s.body}>{item.message.body}</Text>}
          {item.message.attachment && <MessageAttachment attachment={item.message.attachment} />}
          <Text style={s.caption}>{timeLabel(item.created)}</Text>
        </View>)}
      </>}
    </ScrollView>
    {attachment && <View style={s.composer}>
      <Text style={[s.body, s.grow]} numberOfLines={1}>{attachment.name}</Text>
      <IconButton label="Remove attachment" icon="close" disabled={busy} onPress={() => setAttachment(undefined)} />
    </View>}
    <View style={s.composer}>
      <IconButton label="Attach a photo or PDF" icon="add" disabled={busy || !recipient || picking} onPress={() => void attach()} />
      <TextInput accessibilityLabel="Message" placeholder="Message" placeholderTextColor={muted}
        editable={!!recipient && !busy} multiline maxLength={500} value={body} onChangeText={setBody}
        style={[s.input, s.messageInput]} />
      <IconButton label="Send message" icon="send" disabled={busy || !recipient || picking || (!body.trim() && !attachment)} onPress={() => void send()} />
    </View>
  </KeyboardAvoidingView>;
}

function Reports({ data, now, weekly }: { data: ParentSnapshot; now: number; weekly: boolean }) {
  const start = new Date(startOfLocalDay(now));
  if (weekly) start.setDate(start.getDate() - (start.getDay() + 6) % 7);
  const cutoff = start.getTime();
  const sessions = data.sessions.filter(session => (
    Date.parse(session.ended_at ?? session.planned_end) >= cutoff || !!currentPause(session)
  ));
  const done = data.tasks.filter(task => task.completed_at && Date.parse(task.completed_at) >= cutoff).length;
  return <>
    <Text style={s.heading}>{weekly ? 'Weekly Report' : 'Today’s report'}</Text>
    <Chips values={['Today', 'This week']} selected={weekly ? 'This week' : 'Today'}
      onSelect={value => go('reports', { period: value === 'This week' ? 'week' : 'today' })} />
    <View style={s.card}>
      <Text style={s.cardTitle}>{clockTime(focusSeconds(sessions, now, cutoff))} focus time</Text>
      <Text style={s.body}>{done} tasks completed · {sessions.length} sessions</Text>
    </View>
    <Section title="Focus Sessions" />
    {sessions.length ? sessions.map(session => <View key={session.id} style={s.card}>
      <Text style={s.cardTitle}>{data.tasks.find(task => task.id === session.task_id)?.title ?? 'Quiet focus'}</Text>
      <Text style={s.body}>{timeLabel(session.started_at)} · {clockTime(focusSeconds([session], now, cutoff))} focused</Text>
    </View>) : <Empty title="No focus sessions yet" detail="Start a focus session to track your time here." icon="timer-outline" />}
    <Button label="Go to Focus" subtle onPress={() => go('focus')} />
  </>;
}

async function shareFamilyCode(code: string) {
  const message = `Open QuietCue → Child Profile → My family on this device and enter ${code}.`;
  try {
    if (Platform.OS === 'web') {
      await navigator.clipboard.writeText(code);
      showAlert('Family code copied', code);
    } else {
      await Share.share({ message });
    }
  } catch {
    showAlert('Copy your family code', code);
  }
}

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#A62C59' },
  threadSafe: { backgroundColor: '#FFF5F5' },
  shell: { flex: 1, width: '100%', maxWidth: 620, alignSelf: 'center', backgroundColor: '#FFF0F1' },
  grow: { flex: 1 },
  header: { minHeight: 82, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, borderBottomLeftRadius: 36, borderBottomRightRadius: 36, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', zIndex: 1, boxShadow: '0 2px 4px #9F48654D' },
  brand: { flexDirection: 'row', gap: 5, alignItems: 'center', minHeight: 44 },
  logo: { width: 28, height: 28, borderRadius: 14 },
  brandText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  content: { flexGrow: 1, padding: 16, paddingBottom: 24, gap: 12 },
  heading: { color: dark, fontSize: 26, fontWeight: '700', letterSpacing: -0.65 },
  section: { color: dark, fontSize: 18, fontWeight: '700', flexShrink: 1 },
  card: { padding: 14, borderRadius: 15, backgroundColor: '#FFF9FA', gap: 10, borderWidth: 1, borderColor: '#F0CCD7', boxShadow: '0 2px 5px #77304C26' },
  accountCard: { backgroundColor: '#F6B3CB', flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#B8416D', borderWidth: 2, borderColor: '#FFDFEA' },
  avatarText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  statusPill: { marginTop: 5, borderRadius: 16, paddingHorizontal: 9, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFF1F4' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  homeGrid: { flexDirection: 'row', alignItems: 'stretch', gap: 10 },
  homeCard: { flex: 1, padding: 10, gap: 6 },
  focusCard: { backgroundColor: '#FFDCE7', alignItems: 'center' },
  cardTitle: { color: dark, fontSize: 14, fontWeight: '700', flexShrink: 1 },
  body: { color: dark, fontSize: 14, lineHeight: 20 },
  caption: { color: muted, fontSize: 12, lineHeight: 16 },
  empty: { borderRadius: 13, padding: 18, backgroundColor: '#FFF5F7', borderWidth: 1, borderColor: '#E9B8CC', alignItems: 'center', gap: 5 },
  emptyDetail: { color: muted, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  button: { backgroundColor: pink, minHeight: 42, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 22, gap: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFF', fontSize: 13, fontWeight: '700', flexShrink: 1, textAlign: 'center' },
  subtleButton: { backgroundColor: '#F8C4D7' },
  subtleText: { color: '#782140' },
  iconButton: { minWidth: 42, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  dim: { opacity: 0.5 },
  link: { color: pink, fontSize: 13, fontWeight: '700' },
  textAction: { paddingVertical: 8, alignSelf: 'flex-start' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 11, paddingVertical: 6, backgroundColor: '#F9CFDF', borderWidth: 1, borderColor: 'transparent', borderRadius: 20 },
  chipActive: { backgroundColor: '#F3A8C4', borderColor: '#C0527C' },
  chipText: { color: '#70223F', fontSize: 12, fontWeight: '600' },
  fabSpace: { gap: 12, paddingBottom: 58 },
  addField: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: rose, borderRadius: 8, backgroundColor: '#FFF' },
  taskRow: { minHeight: 54, paddingHorizontal: 5, backgroundColor: '#FFF', borderRadius: 10, flexDirection: 'row', alignItems: 'center', boxShadow: '0 2px 4px #77304C26' },
  taskCheck: { flex: 1, minHeight: 44, paddingLeft: 7, flexDirection: 'row', gap: 7, alignItems: 'center' },
  compactCheck: { flex: 0, minHeight: 24, paddingLeft: 0 },
  strike: { textDecorationLine: 'line-through', color: muted },
  floating: { position: 'absolute', right: 22, bottom: 14, width: 53, height: 53, borderRadius: 17, overflow: 'hidden', boxShadow: '0 4px 6px #77304C55' },
  floatingFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  request: { gap: 6, borderRadius: 12, padding: 11, borderWidth: 1, borderLeftWidth: 4, boxShadow: '0 2px 4px #77304C26' },
  urgent: { borderColor: '#D71140', backgroundColor: '#FFD9DE' },
  standard: { borderColor: '#C78D29', backgroundColor: '#FFF2D5' },
  urgentText: { color: '#A31237', fontSize: 13, fontWeight: '800' },
  member: { padding: 10, minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF7FA', borderRadius: 12, boxShadow: '0 2px 4px #77304C26' },
  focusCenter: { alignItems: 'center', gap: 13, paddingVertical: 5 },
  ring: { alignItems: 'center', justifyContent: 'center' },
  ringCopy: { position: 'absolute', alignItems: 'center', gap: 4 },
  time: { color: dark, fontSize: 34, fontWeight: '800', fontVariant: ['tabular-nums'] },
  miniTime: { color: dark, fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },
  controls: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  conversationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 58, borderBottomWidth: 1, borderColor: '#DFBCC9', backgroundColor: '#FFF5F5', paddingHorizontal: 9 },
  thread: { flexGrow: 1, justifyContent: 'flex-end', padding: 15, gap: 12 },
  bubble: { maxWidth: '90%', alignSelf: 'flex-start', padding: 11, borderRadius: 14, borderWidth: 1, borderColor: 'transparent', backgroundColor: '#FFF', gap: 5 },
  highlight: { borderColor: rose },
  outgoing: { alignSelf: 'flex-end', backgroundColor: '#F6B1CE' },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, backgroundColor: '#FFF5F7', borderTopWidth: 1, borderColor: '#E5B6C7' },
  messageInput: { flex: 1, borderRadius: 21, maxHeight: 95 },
  code: { fontSize: 24, letterSpacing: 2, fontWeight: '800', color: pink },
  badge: { position: 'absolute', right: 0, top: 0, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: '#8C1746', alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  navBase: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 8 },
  nav: { flexDirection: 'row', borderRadius: 24, borderWidth: 1, borderColor: '#FFD6E3', backgroundColor: '#FFFFFF22', padding: 3 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 48, borderRadius: 20 },
  tabActive: { backgroundColor: '#FBD1DF' },
  tabText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  tabTextActive: { color: pink },
  overlay: { flex: 1, justifyContent: 'center', padding: 22, backgroundColor: '#49203270' },
  modal: { width: '100%', maxWidth: 450, alignSelf: 'center', padding: 18, borderRadius: 21, backgroundColor: '#FFF4F8', gap: 10 },
  input: { paddingHorizontal: 12, paddingVertical: 10, minHeight: 42, backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: '#D78CAA', fontSize: 14, color: dark },
  logout: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 15 },
  logoutLogo: { width: 84, height: 84, borderRadius: 42 },
});
