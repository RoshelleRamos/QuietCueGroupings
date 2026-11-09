import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { categories, errorMessage, parentStatus, type FamilyRequest } from '../lib/family';
import { localStore, type User } from '../lib/local-store';
import { showAlert } from '../lib/show-alert';
import MessageAttachment from './MessageAttachment';

const tabs = [
  { id: 'home', label: 'Home', icon: 'home-outline' },
  { id: 'request', label: 'Ask', icon: 'hand-left-outline' },
  { id: 'messages', label: 'Messages', icon: 'chatbubbles-outline' },
  { id: 'profile', label: 'Profile', icon: 'person-outline' },
] as const;
const topics = [
  { title: 'Homework', category: categories[0], icon: 'book-outline' },
  { title: 'Food or drink', category: categories[1], icon: 'restaurant-outline' },
  { title: 'I want to talk', category: categories[2], icon: 'chatbubble-outline' },
  { title: 'Something else', category: categories[3], icon: 'ellipsis-horizontal' },
] as const;
const requestLabels = { pending: 'Waiting', acknowledged: 'Seen', done: 'Done' };
const pink = '#A72559';

type Page = typeof tabs[number]['id'] | 'history';
type Icon = React.ComponentProps<typeof Ionicons>['name'];
type ChildData = Awaited<ReturnType<typeof localStore.loadChild>>;

function go(page: Page, params: Record<string, string> = {}) {
  router.replace({ pathname: '/child/[page]', params: { page, ...params } });
}

function Button({ label, icon, onPress, tone = 'primary', disabled }: {
  label: string;
  icon: Icon;
  onPress: () => void;
  tone?: 'primary' | 'light' | 'urgent';
  disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [s.button, tone === 'light' && s.lightButton, tone === 'urgent' && s.urgentButton,
      (pressed || disabled) && s.dim]}>
    <Ionicons name={icon} size={22} color={tone === 'primary' ? '#FFF' : pink} />
    <Text style={[s.buttonLabel, tone !== 'primary' && s.darkButtonLabel]}>{label}</Text>
  </Pressable>;
}

function RequestCard({ request }: { request: FamilyRequest }) {
  return <View style={s.card}>
    <View style={s.row}>
      <Text style={[s.cardTitle, s.grow]}>{request.priority === 'emergency' ? 'Urgent help' : request.category}</Text>
      <Text style={[s.badge, request.status === 'done' && s.done]}>{requestLabels[request.status]}</Text>
    </View>
    <Text style={s.body}>{request.message}</Text>
  </View>;
}

function Empty({ icon, text }: { icon: Icon; text: string }) {
  return <View style={s.empty}>
    <Ionicons name={icon} size={28} color={pink} />
    <Text style={s.emptyText}>{text}</Text>
  </View>;
}

export default function ChildDashboardScreen({ preview = false }: { preview?: boolean }) {
  const { page, kind, sent } = useLocalSearchParams<{ page?: string; kind?: string; sent?: string }>();
  const active: Page = page === 'history' || tabs.some(tab => tab.id === page) ? page as Page : 'home';
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<ChildData | null>(null);
  const [loading, setLoading] = useState(!preview);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState(() => topics.find(topic => topic.category === kind)?.category ?? categories[0]);
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now);
  const lock = useRef(false);
  const mounted = useRef(true);
  const thread = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const load = useCallback(async () => {
    if (preview) return;
    try {
      const account = await localStore.currentUser();
      if (!mounted.current) return;
      if (!account || account.user_metadata.role === 'parent') {
        router.replace('/');
        return;
      }
      const snapshot = await localStore.loadChild(account.id);
      if (mounted.current) {
        setUser(account);
        setData(snapshot);
        setError('');
      }
    } catch (cause) {
      if (mounted.current) setError(errorMessage(cause));
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [preview]);

  useEffect(() => {
    mounted.current = true;
    // The screen reads the saved account when it opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      mounted.current = false;
      clearInterval(timer);
    };
  }, [load]);

  const parent = data?.parent;
  const name = data?.own.full_name || user?.user_metadata.full_name || 'friend';
  const requests = data?.requests ?? [];
  const messages = data?.messages ?? [];
  const status = parentStatus(parent ?? null, now);
  const statusText = status.focusing ? 'Busy right now' : status.label;
  const freeAt = status.focusing && parent?.available_at
    ? new Date(parent.available_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;
  const disabled = busy || loading || preview || !user;

  const run = async (action: (userId: string) => Promise<void>, failure: string) => {
    if (!user || lock.current || preview) return;
    lock.current = true;
    setBusy(true);
    try {
      await action(user.id);
    } catch (cause) {
      showAlert(failure, errorMessage(cause));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  const sendRequest = (urgent = false) => void run(async userId => {
    const body = urgent ? 'I need your help right now.' : message.trim();
    if (!parent || !body) return;
    await localStore.sendRequest(userId, urgent ? 'Emergency' : category, body, urgent ? 'emergency' : 'normal');
    if (!urgent) setMessage('');
    await load();
    go('history', { sent: 'yes' });
  }, 'Could not send request');

  const urgentHelp = () => showAlert('Ask for urgent help?', 'This saves an urgent request on this device. If you need help now, tell a trusted adult nearby.', [
    { text: 'Go back', style: 'cancel' },
    { text: 'Send urgent request', onPress: () => sendRequest(true) },
  ]);

  const connect = () => void run(async userId => {
    await localStore.joinParent(userId, code);
    setCode('');
    await load();
    go('home');
  }, 'Could not connect');

  const sendReply = () => void run(async userId => {
    if (!parent || !reply.trim()) return;
    await localStore.sendMessage(userId, userId, reply, 'child');
    setReply('');
    await load();
  }, 'Could not send message');

  const logout = () => showAlert('Log out?', 'You can log in again with your email and password.', [
    { text: 'Stay here', style: 'cancel' },
    { text: 'Log out', onPress: () => void run(async () => {
      await localStore.signOut();
      router.replace('/');
    }, 'Could not log out') },
  ]);

  const linkParent = <Button label="Connect my parent" icon="people-outline" onPress={() => go('profile')} />;
  const requestHistory = <Button label="My requests" icon="time-outline" tone="light" onPress={() => go('history')} />;

  return <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
    <StatusBar style="dark" />
    <KeyboardAvoidingView style={s.shell} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="QuietCue home" onPress={() => go('home')} style={s.brand}>
          <Image source={require('../../assets/QQ LOGO.png')} style={s.logo} />
          <Text style={s.brandName}>Quiet Cue</Text>
        </Pressable>
        <View style={s.headerTag}><Ionicons name="heart" size={15} color={pink} /><Text style={s.tagText}>My space</Text></View>
      </View>

      <ScrollView key={active} ref={thread} style={s.grow} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => { if (active === 'messages' && messages.length) thread.current?.scrollToEnd({ animated: false }); }}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={pink} onRefresh={() => {
          if (!preview) { setRefreshing(true); void load(); }
        }} />}>
        {error && <View style={s.card}>
          <Text style={s.cardTitle}>Could not load your account</Text>
          <Text style={s.body}>{error}</Text>
          <Button label="Try again" icon="refresh" onPress={() => void load()} />
        </View>}
        {loading && <ActivityIndicator accessibilityLabel="Loading account" color={pink} />}
        {!loading && active === 'home' && <>
          <LinearGradient colors={['#FFE4EF', '#F9C1D7']} style={s.hero}>
            <View style={s.grow}>
              <Text style={s.welcome}>Hi, {name.split(' ')[0]}!</Text>
              <Text style={s.body}>{parent ? 'What would you like to do?' : 'Let’s connect your parent.'}</Text>
            </View>
            <View style={s.heroIcon}><Ionicons name="sunny" color="#985621" size={30} /></View>
          </LinearGradient>

          {parent ? <>
            <View style={[s.card, s.parentCard]}>
              <View style={s.parentIcon}><Ionicons name="heart" size={23} color={pink} /></View>
              <View style={s.grow}>
                <Text style={s.caption}>My parent</Text>
                <Text style={s.cardTitle}>{parent.full_name}</Text>
                <View style={s.row}>
                  <View style={[s.dot, { backgroundColor: status.color }]} />
                  <Text style={[s.caption, { color: status.color }]}>{statusText}{freeAt ? ` · Free at ${freeAt}` : ''}</Text>
                </View>
              </View>
            </View>
            <Button label="Ask for help" icon="hand-left-outline" onPress={() => go('request')} />
            <Button label="Read messages" icon="chatbubbles-outline" tone="light" onPress={() => go('messages')} />
            {requests.length > 0 && <View style={s.card}>
              <Text style={s.cardTitle}>Your latest request</Text>
              <View style={s.row}>
                <Text style={[s.body, s.grow]} numberOfLines={2}>{requests[0].message}</Text>
                <Text style={s.badge}>{requestLabels[requests[0].status]}</Text>
              </View>
              {requestHistory}
            </View>}
            <Button label="I need help now" icon="alert-circle-outline" tone="urgent" disabled={disabled} onPress={urgentHelp} />
          </> : <View style={s.card}>
            <Text style={s.cardTitle}>Have a family code?</Text>
            <Text style={s.body}>Ask your parent for their code, then enter it in Profile.</Text>
            {linkParent}
          </View>}
        </>}

        {!loading && active === 'request' && <>
          <Text style={s.heading}>Ask for help</Text>
          {parent ? <>
            <Text style={s.body}>What do you need help with?</Text>
            <View style={s.topics}>{topics.map(topic => <Pressable key={topic.category}
              accessibilityRole="radio" accessibilityLabel={topic.title} accessibilityState={{ checked: category === topic.category }}
              onPress={() => setCategory(topic.category)} style={[s.topic, category === topic.category && s.selectedTopic]}>
              <Ionicons name={topic.icon} size={23} color={pink} />
              <Text style={s.topicText}>{topic.title}</Text>
            </Pressable>)}</View>
            <Text style={s.cardTitle}>Write your message</Text>
            <TextInput accessibilityLabel="Your request message" value={message} onChangeText={setMessage}
              maxLength={500} multiline placeholder="Can you help me with…" placeholderTextColor="#755C69" style={[s.input, s.message]} />
            <Text style={s.caption}>To {parent.full_name}</Text>
            <Button label={busy ? 'Sending…' : 'Send request'} icon="paper-plane-outline"
              disabled={disabled || !message.trim()} onPress={() => sendRequest()} />
            <Button label="I need help now" icon="alert-circle-outline" tone="urgent" disabled={disabled} onPress={urgentHelp} />
          </> : <><Text style={s.body}>Connect your parent first so they can see your request.</Text>{linkParent}</>}
        </>}

        {!loading && active === 'messages' && <>
          <Text style={s.heading}>Messages</Text>
          {parent ? <>
            <Text style={s.body}>Chat with {parent.full_name}</Text>
            {requestHistory}
            {messages.length === 0 && <Empty icon="chatbubbles-outline" text="No messages yet. Say hi!" />}
            {messages.map(item => <View key={item.id} style={[s.bubble, item.sender === 'child' && s.outgoing]}>
              <Text style={s.caption}>{item.sender === 'parent' ? parent.full_name : 'You'}</Text>
              {item.body !== '' && <Text style={s.body}>{item.body}</Text>}
              {item.attachment && <MessageAttachment attachment={item.attachment} />}
              <Text style={s.caption}>{new Date(item.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
            </View>)}
          </> : <><Text style={s.body}>Connect your parent to start chatting.</Text>{linkParent}</>}
        </>}

        {!loading && active === 'history' && <>
          <Text style={s.heading}>My requests</Text>
          {sent === 'yes' && <Text accessibilityLiveRegion="polite" style={s.success}>Request sent!</Text>}
          <Button label="Back to messages" icon="arrow-back" tone="light" onPress={() => go('messages')} />
          {requests.length ? requests.map(item => <RequestCard key={item.id} request={item} />)
            : <Empty icon="paper-plane-outline" text="Your requests will show up here." />}
        </>}

        {!loading && active === 'profile' && <>
          <Text style={s.heading}>My profile</Text>
          <View style={s.card}>
            <Text style={s.cardTitle}>{name}</Text>
            <Text style={s.body}>{user?.email}</Text>
          </View>
          <View style={s.card}>
            <Text style={s.cardTitle}>My family</Text>
            {parent ? <Text style={s.body}>Connected to {parent.full_name}</Text> : <>
              <Text style={s.body}>Ask your parent for their 12-character family code.</Text>
              <TextInput accessibilityLabel="Family code" value={code} onChangeText={setCode} maxLength={12}
                autoCapitalize="characters" autoCorrect={false} placeholder="Enter family code"
                placeholderTextColor="#755C69" style={s.input} />
              <Button label={busy ? 'Connecting…' : 'Connect my parent'} icon="people-outline"
                disabled={disabled || !code.trim()} onPress={connect} />
            </>}
          </View>
          <Button label="Log out" icon="log-out-outline" tone="light" disabled={disabled} onPress={logout} />
        </>}
      </ScrollView>

      {!loading && active === 'messages' && parent && <View style={s.composer}>
        <TextInput accessibilityLabel="Message" value={reply} onChangeText={setReply} maxLength={500} multiline
          placeholder="Write a message…" placeholderTextColor="#755C69" style={[s.input, s.reply]} />
        <Pressable accessibilityRole="button" accessibilityLabel="Send message" disabled={disabled || !reply.trim()}
          onPress={sendReply} style={[s.send, (disabled || !reply.trim()) && s.dim]}>
          <Ionicons name="send" size={21} color="#FFF" />
        </Pressable>
      </View>}

      <View style={s.nav}>
        {tabs.map(tab => {
          const selected = active === tab.id || (active === 'history' && tab.id === 'messages');
          return <Pressable key={tab.id} accessibilityRole="tab" accessibilityLabel={tab.label}
            accessibilityState={{ selected }} style={[s.tab, selected && s.activeTab]} onPress={() => go(tab.id)}>
            <Ionicons name={tab.icon} size={22} color={selected ? pink : '#765C69'} />
            <Text style={[s.tabText, selected && s.activeTabText]}>{tab.label}</Text>
          </Pressable>;
        })}
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF7FA' },
  shell: { flex: 1, width: '100%', maxWidth: 620, alignSelf: 'center', backgroundColor: '#FFF7FA' },
  grow: { flex: 1 },
  header: { minHeight: 62, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#F3DDE5', backgroundColor: '#FFFBFC' },
  brand: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7 },
  logo: { width: 32, height: 32, borderRadius: 16 },
  brandName: { color: '#402736', fontSize: 19, fontWeight: '800' },
  headerTag: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FAE4ED', paddingVertical: 5, paddingHorizontal: 9, borderRadius: 14 },
  tagText: { color: '#812249', fontSize: 12, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 22, gap: 13 },
  hero: { borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: '#FFF0CD', alignItems: 'center', justifyContent: 'center' },
  welcome: { color: '#402736', fontSize: 29, fontWeight: '800', letterSpacing: -0.6 },
  heading: { color: '#402736', fontSize: 27, fontWeight: '800', letterSpacing: -0.5 },
  body: { color: '#503945', fontSize: 15, lineHeight: 22 },
  caption: { color: '#745866', fontSize: 12, lineHeight: 17, fontWeight: '600' },
  card: { padding: 14, gap: 9, backgroundColor: '#FFF', borderRadius: 17, borderWidth: 1, borderColor: '#F1D5E1' },
  cardTitle: { color: '#402736', fontSize: 16, fontWeight: '700' },
  parentCard: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  parentIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FCE2EE' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  button: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 15, paddingVertical: 9, borderRadius: 16, backgroundColor: pink },
  buttonLabel: { flexShrink: 1, color: '#FFF', fontWeight: '700', fontSize: 16 },
  lightButton: { backgroundColor: '#F9DEEB', borderWidth: 1, borderColor: '#F0BCD2' },
  urgentButton: { backgroundColor: '#FFF2EF', borderWidth: 1, borderColor: '#E9B2B0' },
  darkButtonLabel: { color: '#812249' },
  dim: { opacity: 0.48 },
  topics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topic: { width: '48%', flexGrow: 1, minHeight: 64, borderRadius: 14, paddingHorizontal: 9, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1D5E1' },
  selectedTopic: { borderColor: '#B44C76', backgroundColor: '#F9D5E5' },
  topicText: { color: '#55283C', fontWeight: '700', fontSize: 14, flexShrink: 1 },
  input: { minHeight: 49, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#E4B8CD', borderRadius: 13, backgroundColor: '#FFF', color: '#402736', fontSize: 16 },
  message: { minHeight: 118, textAlignVertical: 'top' },
  badge: { backgroundColor: '#F8DBE9', color: '#7C2F50', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, fontSize: 12, fontWeight: '700' },
  done: { backgroundColor: '#DDF1E6', color: '#206047' },
  empty: { padding: 18, alignItems: 'center', gap: 8, borderRadius: 17, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1D5E1' },
  emptyText: { color: '#503945', textAlign: 'center', fontSize: 15 },
  success: { padding: 12, borderRadius: 12, color: '#206047', backgroundColor: '#DDF1E6', fontSize: 15, fontWeight: '700' },
  bubble: { alignSelf: 'flex-start', maxWidth: '90%', padding: 12, gap: 5, borderRadius: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1D5E1' },
  outgoing: { alignSelf: 'flex-end', backgroundColor: '#F9D5E5' },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, backgroundColor: '#FFF1F6' },
  reply: { flex: 1, maxHeight: 98 },
  send: { width: 49, height: 49, alignItems: 'center', justifyContent: 'center', backgroundColor: pink, borderRadius: 15 },
  nav: { minHeight: 63, flexDirection: 'row', padding: 5, backgroundColor: '#FFFBFC', borderTopWidth: 1, borderColor: '#F3DDE5', gap: 3 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 50, borderRadius: 13 },
  activeTab: { backgroundColor: '#F9D5E5' },
  tabText: { color: '#654855', fontSize: 12, fontWeight: '700' },
  activeTabText: { color: pink },
});
