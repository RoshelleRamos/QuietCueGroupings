import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Image, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { type User, backend } from '../lib/api';
import { categories, errorMessage, loadFamily, parentStatus, type FamilyRequest, type Profile } from '../lib/family';

const tabs = [ {id:'home', label:'Home', icon:'home-outline'}, {id:'request',label:'Request',icon:'chatbubble-ellipses-outline'}, {id:'history',label:'History',icon:'time-outline'}, {id:'profile',label:'Profile',icon:'person-outline'} ] as const;
type Page = typeof tabs[number]['id'];
type IconName = React.ComponentProps<typeof Ionicons>['name'];
 const Button=({title,onPress,busy=false,icon='arrow-forward',danger=false}:{title:string;onPress:()=>void;busy?:boolean;icon?:IconName;danger?:boolean})=><Pressable accessibilityRole="button" disabled={busy} onPress={onPress} style={({pressed})=>[s.button,danger&&s.danger,pressed&&s.pressed,busy&&s.disabled]}><Text style={s.buttonText}>{busy?'Please wait…':title}</Text><Ionicons name={icon} size={20} color="#fff"/></Pressable>;
 const HistoryCard=({item}:{item:FamilyRequest})=><View style={s.historyCard}><View style={[s.iconBox,{backgroundColor:item.priority==='emergency'?'#FDE6E6':'#F5EAF8'}]}><Ionicons name={item.priority==='emergency'?'alert-circle-outline':'chatbubble-outline'} size={22} color={item.priority==='emergency'?'#B93C49':'#976493'}/></View><View style={s.grow}><View style={s.spread}><Text style={s.cardTitle}>{item.category}</Text><Text style={[s.badge,{color:item.status==='done'?'#26785E':'#925474'}]}>{item.status==='pending'?'Waiting':item.status==='done'?'Done':'Seen'}</Text></View><Text style={s.body}>{item.message}</Text><Text style={s.small}>{new Date(item.created_at).toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</Text></View></View>;

export default function ChildDashboardScreen({ preview = false }: { preview?: boolean }) {
 const { page, kind } = useLocalSearchParams<{page?: string;kind?:string}>();
 const active: Page = tabs.some(t=>t.id===page) ? page as Page : 'home';
 const [user,setUser] = useState<User|null>(null);
 const [own,setOwn] = useState<Profile|null>(null);
 const [parent,setParent] = useState<Profile|null>(null);
 const [requests,setRequests] = useState<FamilyRequest[]>([]);
 const [loading,setLoading] = useState(!preview);
 const [refreshing,setRefreshing] = useState(false);
 const [error,setError] = useState('');
 const [code,setCode] = useState('');
 const [category,setCategory] = useState<string>(categories.includes(kind as typeof categories[number]) ? kind! : categories[0]);
 const [message,setMessage] = useState('');
 const [busy,setBusy] = useState(false);
 const [filter,setFilter] = useState('All');
 const [now,setNow] = useState(() => Date.now());
 const lock = useRef(false);
 const mounted = useRef(true);
 const load = useCallback(async (quiet = false) => {
  if(preview) return;
  try {
   const {data,error:authError} = await backend.auth.getUser();
   if(authError) throw authError;
   if(!data.user) {router.replace('/'); return;}
   if(!['child','family'].includes(data.user.user_metadata.role)) {router.replace('/'); return;}
   if(mounted.current) setUser(data.user);
   const result=await loadFamily(data.user.id);
   if(mounted.current) {setOwn(result.own);setParent(result.parent);setRequests(result.requests);setError('');}
  } catch(e) {if(mounted.current && !quiet) setError(errorMessage(e));}
  finally {if(mounted.current) {setLoading(false);setRefreshing(false);}}
 },[preview]);
 useEffect(()=>{
  mounted.current=true;
  // Loading remote account data is intentionally triggered on mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  void load();
  const timer=setInterval(()=>{setNow(Date.now());if(AppState.currentState==='active') void load(true);},7000);
  const app=AppState.addEventListener('change',state=>{if(state==='active') void load();});
  return ()=>{mounted.current=false;clearInterval(timer);app.remove();};
 },[load]);
 const status=parentStatus(parent,now);
 const displayName=(own?.full_name || user?.user_metadata.full_name || 'friend').split(' ')[0];
 const pending=requests.filter(r=>r.status==='pending').length;
 const completed=requests.filter(r=>r.status==='done').length;
 const navigate=(id: Page)=>router.replace({pathname:'/child/[page]',params:{page:id}});
 const send=async (emergency=false)=>{
  if(preview || lock.current) return;
  if(!parent || !user) {Alert.alert('Connect your parent','Open Profile and enter the family code from your parent.');return;}
  const text=message.trim() || (emergency?'I need your attention right now.':'');
  if(!text) {Alert.alert('Add a message','Tell your parent what you need help with.');return;}
  lock.current=true;setBusy(true);
  try {
   const result=await backend.from('qc_requests').insert({child_id:user.id,parent_id:parent.id,category:emergency?'Emergency':category,message:text,priority:emergency?'emergency':'normal'});
   if(result.error) throw result.error;
   setMessage('');
   Alert.alert(emergency?'Emergency request saved':'Request sent',emergency?'Your urgent request is in your parent’s inbox and notification list. Contact your parent directly if you need immediate help.':'Your parent can see your request in their family inbox.');
   await load(); navigate('history');
  } catch(e){Alert.alert('Could not send',errorMessage(e));}
  finally{lock.current=false;setBusy(false);}
 };
 const emergency=()=>{
  if(!parent) {Alert.alert('No parent connected','Connect a parent in Profile first. Contact your parent directly if you need help now.');return;}
  Alert.alert('Need help right now?','This sends an urgent request to your parent’s inbox and notification list. For immediate help, contact your parent directly.',[{text:'Go back',style:'cancel'},{text:'Send urgent request',style:'destructive',onPress:()=>void send(true)}]);
 };
 const join=async()=>{
  if(lock.current || preview) return;
  if(!code.trim()){Alert.alert('Family code needed','Ask your parent for their family code.');return;}
  lock.current=true;setBusy(true);
  try{const {error:joinError}=await backend.rpc('qc_join_parent',{code:code.trim()});if(joinError) throw joinError;setCode('');await load();Alert.alert('You’re connected!','Your parent can now receive your requests.');}
  catch(e){Alert.alert('Could not connect',errorMessage(e));}
  finally{lock.current=false;setBusy(false);}
 };
 const logout=()=>Alert.alert('Log out?','You can sign in again anytime.',[{text:'Stay here',style:'cancel'},{text:'Log out',onPress:async()=>{const {error:e}=await backend.auth.signOut();if(e) Alert.alert('Could not log out',e.message);else router.replace('/');}}]);
 return <SafeAreaView style={s.safe} edges={['top','bottom']}><StatusBar style="dark"/><KeyboardAvoidingView style={s.flex} behavior={Platform.OS==='ios'?'padding':undefined}>
  <View style={s.header}><View style={s.brand}><Image source={require('../../assets/QQ LOGO.png')} style={s.logo}/><Text style={s.brandText}>QuietCue<Text style={s.brandDot}>.</Text></Text></View><View style={s.childPill}><Ionicons name="sparkles-outline" size={14} color="#97516B"/><Text style={s.childText}>MY LITTLE SPACE</Text></View></View>
  <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={refreshing} tintColor="#B94877" onRefresh={()=>{setRefreshing(true);void load();}}/>}>
   {error?<View style={s.error}><Text style={s.cardTitle}>Could not load your family</Text><Text style={s.body}>{error}</Text><Pressable onPress={()=>void load()} style={s.retry}><Text style={s.link}>Retry</Text></Pressable></View>:null}
   {loading?<ActivityIndicator color="#B94877" style={{margin:16}}/>:null}
   {active==='home'&&<>
    <Text style={s.eyebrow}>A LITTLE HELLO, A LITTLE CONNECTION</Text><Text style={s.heading}>Hi, {displayName} <Text style={{fontSize:29}}>☀️</Text></Text><Text style={s.subtitle}>You’re always part of their day.</Text>
    <View style={s.parentCard}><View style={s.spread}><View style={s.row}><View style={s.parentAvatar}><Ionicons name="heart" size={28} color="#B14D78"/></View><View style={s.grow}><Text style={s.small}>YOUR PARENT</Text><Text style={s.parentName}>{parent?.full_name || 'Let’s connect your family'}</Text></View></View></View><View style={s.statusBox}><View style={s.row}><View style={[s.dot,{backgroundColor:status.color}]}/><Text style={[s.statusLabel,{color:status.color}]}>{status.label}</Text></View><Text style={s.body}>{status.detail}</Text></View><Text style={s.parentNote}>{parent?(status.focusing?'A little quiet helps them focus. You can still leave a message.':'Small moments together make a big difference.'): 'One family code brings you closer. Get it from your parent’s Family inbox.'}</Text><Pressable style={s.inlineAction} onPress={()=>navigate(parent?'request':'profile')}><Text style={s.link}>{parent?'Leave a little message':'Connect my parent'}</Text><Ionicons name="arrow-forward" size={18} color="#A23D69"/></Pressable></View>
    <View style={s.sectionHeader}><Text style={s.sectionTitle}>What do you need?</Text><Text style={s.small}>WE’RE LISTENING</Text></View>
    <View style={s.quickGrid}>{[{title:'School help',sub:'Let’s figure it out',icon:'book-outline',color:'#EEEAFB'},{title:'Food & drink',sub:'A little something',icon:'restaurant-outline',color:'#FFF0DC'},{title:'Can we talk?',sub:'Share your thoughts',icon:'chatbubbles-outline',color:'#E3F1ED'},{title:'Something else',sub:'Anything on your mind',icon:'shapes-outline',color:'#F9E5ED'}].map(q=><Pressable accessibilityRole="button" key={q.title} style={({pressed})=>[s.quickCard,pressed&&s.pressed]} onPress={()=>{setCategory(q.title);router.replace({pathname:'/child/[page]',params:{page:'request',kind:q.title}});}}><View style={[s.quickIcon,{backgroundColor:q.color}]}><Ionicons name={q.icon as IconName} color="#775169" size={25}/></View><Text style={s.cardTitle}>{q.title}</Text><Text style={s.small}>{q.sub}</Text></Pressable>)}</View>
    <View style={s.emergencyCard}><View style={s.grow}><Text style={s.cardTitle}>Something can’t wait?</Text><Text style={s.small}>Send an urgent request to your parent.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Send emergency request" disabled={busy} onPress={emergency} style={s.emergencyIcon}><Ionicons name="alert-outline" size={25} color="#B03B4A"/></Pressable></View>
    <View style={s.sectionHeader}><Text style={s.sectionTitle}>Your little updates</Text><Pressable onPress={()=>navigate('history')}><Text style={s.link}>View all →</Text></Pressable></View>
    {requests.length?requests.slice(0,2).map(r=><HistoryCard item={r} key={r.id}/>):<View style={s.empty}><Ionicons name="paper-plane-outline" size={30} color="#AB7994"/><Text style={s.cardTitle}>Your first hello starts here</Text><Text style={s.small}>Your requests will appear here after you send one.</Text></View>}
   </>}
   {active==='request'&&<><Text style={s.eyebrow}>A MESSAGE THAT MATTERS</Text><Text style={s.heading}>Ask your parent</Text><Text style={s.subtitle}>Tell them what you need, in your own words.</Text><View style={s.card}><Text style={s.cardTitle}>What is it about?</Text><View style={s.chips}>{categories.map(c=><Pressable key={c} accessibilityRole="radio" accessibilityState={{selected:category===c}} onPress={()=>setCategory(c)} style={[s.chip,category===c&&s.selectedChip]}><Text style={category===c?s.selectedText:s.body}>{c}</Text></Pressable>)}</View><Text style={s.cardTitle}>Your message</Text><TextInput accessibilityLabel="Your request message" multiline maxLength={500} placeholder="Hi! Could you help me with…" placeholderTextColor="#9C8D99" value={message} onChangeText={setMessage} style={s.message}/><Text style={[s.small,{textAlign:'right'}]}>{message.length}/500</Text><Text style={s.body}>{parent?`To: ${parent.full_name}`:'Connect a parent in Profile before sending.'}</Text><Button busy={busy} title="Send request" icon="paper-plane-outline" onPress={()=>void send()}/></View><View style={s.tip}><Ionicons name="leaf-outline" size={21} color="#547C6A"/><Text style={[s.body,s.grow]}>If your parent is focusing, your message can wait in their inbox until they are ready.</Text></View><Button busy={busy} danger title="I need help right now" icon="alert-circle-outline" onPress={emergency}/><Text style={s.small}>Your parent receives in-app alerts while QuietCue is open.</Text></>}
   {active==='history'&&<><Text style={s.eyebrow}>EVERY MESSAGE HAS A PLACE</Text><Text style={s.heading}>My requests</Text><Text style={s.subtitle}>See what you’ve shared and what’s been answered.</Text><View style={s.stats}><View style={s.stat}><Text style={s.statValue}>{requests.length}</Text><Text style={s.small}>Recent requests</Text></View><View style={s.stat}><Text style={s.statValue}>{pending}</Text><Text style={s.small}>Waiting</Text></View><View style={s.stat}><Text style={s.statValue}>{completed}</Text><Text style={s.small}>Done</Text></View></View><View style={s.chips}>{['All','Waiting','Seen','Done'].map(f=><Pressable key={f} onPress={()=>setFilter(f)} style={[s.chip,filter===f&&s.selectedChip]}><Text style={filter===f?s.selectedText:s.body}>{f}</Text></Pressable>)}</View>{requests.filter(r=>filter==='All'||r.status===({Waiting:'pending',Seen:'acknowledged',Done:'done'} as Record<string,string>)[filter]).map(r=><HistoryCard item={r} key={r.id}/>)}{!requests.length&&<View style={s.empty}><Ionicons name="chatbubbles-outline" size={38} color="#AB7994"/><Text style={s.cardTitle}>Nothing here just yet</Text><Text style={s.small}>Send your parent a message to get started.</Text><Button busy={busy} title="Make a request" onPress={()=>navigate('request')}/></View>}<Text style={s.small}>Showing up to 100 recent requests. Pull down to refresh.</Text></>}
   {active==='profile'&&<><Text style={s.eyebrow}>YOUR OWN LITTLE CORNER</Text><Text style={s.heading}>My profile</Text><View style={s.card}><View style={s.profileAvatar}><Text style={s.avatarText}>{displayName.slice(0,1).toUpperCase()}</Text></View><Text style={s.sectionTitle}>{own?.full_name||user?.user_metadata.full_name||'QuietCue child'}</Text><Text style={s.body}>{user?.email}</Text><Text style={s.badge}>Child / Family account</Text></View><View style={s.card}><Text style={s.sectionTitle}>My family</Text>{parent?<><Text style={s.body}>Connected to {parent.full_name}</Text><View style={s.row}><View style={[s.dot,{backgroundColor:status.color}]}/><Text style={s.body}>{status.label}</Text></View></>:<><Text style={s.body}>Ask your parent to open their Family inbox and share their 12-character family code.</Text><TextInput accessibilityLabel="Family code" value={code} onChangeText={setCode} autoCapitalize="characters" autoCorrect={false} maxLength={12} placeholder="ENTER FAMILY CODE" placeholderTextColor="#9C8D99" style={s.codeInput}/><Button busy={busy} title="Connect my parent" icon="people-outline" onPress={()=>void join()}/></>}</View><View style={s.tip}><Ionicons name="lock-closed-outline" color="#547C6A" size={22}/><Text style={[s.body,s.grow]}>Only your connected parent can read your requests.</Text></View><Pressable style={s.logout} onPress={logout}><Ionicons name="log-out-outline" size={22} color="#A23D69"/><Text style={s.link}>Log out</Text></Pressable></>}
   <Text style={s.footer}>a little quiet. a closer family.</Text>
  </ScrollView>
  <View style={s.nav}>{tabs.map(t=><Pressable accessibilityRole="tab" accessibilityState={{selected:active===t.id}} key={t.id} onPress={()=>navigate(t.id)} style={s.navItem}><View style={[s.navIcon,active===t.id&&s.navActive]}><Ionicons name={t.icon} color={active===t.id?'#A33D68':'#9B8D99'} size={23}/></View><Text style={[s.navLabel,active===t.id&&s.navLabelActive]}>{t.label}</Text></Pressable>)}</View>
 </KeyboardAvoidingView></SafeAreaView>;
}
const s=StyleSheet.create({
 flex:{flex:1},safe:{flex:1,backgroundColor:'#FFFAFC'},header:{paddingHorizontal:22,paddingVertical:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:'#F2E8ED'},brand:{flexDirection:'row',alignItems:'center',gap:7},logo:{width:34,height:34,borderRadius:17},brandText:{fontSize:23,fontWeight:'800',color:'#48344A',letterSpacing:-1},brandDot:{color:'#BD5C86'},childPill:{backgroundColor:'#F6EAF0',padding:8,borderRadius:20,flexDirection:'row',alignItems:'center',gap:5},childText:{fontSize:8,fontWeight:'700',letterSpacing:1,color:'#97516B'},content:{padding:22,gap:16,paddingBottom:26,width:'100%',maxWidth:650,alignSelf:'center'},eyebrow:{fontSize:9,fontWeight:'700',letterSpacing:1.8,color:'#A57991',marginTop:9},heading:{fontSize:34,fontWeight:'800',letterSpacing:-1.2,color:'#473549',marginTop:-6},subtitle:{fontSize:14,color:'#8C7A8C',lineHeight:21,marginTop:-10,marginBottom:5},parentCard:{backgroundColor:'#F5E6EF',borderRadius:25,padding:20,gap:15,borderWidth:1,borderColor:'#EFDAE6'},row:{flexDirection:'row',alignItems:'center',gap:10,flexShrink:1},grow:{flex:1},spread:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8},parentAvatar:{width:54,height:54,borderRadius:19,backgroundColor:'#FFF7FB',alignItems:'center',justifyContent:'center'},parentName:{fontSize:19,fontWeight:'700',color:'#51384D',marginTop:4},small:{fontSize:11,lineHeight:17,color:'#8E7A8B'},statusBox:{backgroundColor:'#FFF9FC',padding:14,borderRadius:16,gap:7},dot:{width:8,height:8,borderRadius:4},statusLabel:{fontSize:15,fontWeight:'700'},body:{fontSize:13,lineHeight:21,color:'#776274'},parentNote:{fontSize:12,lineHeight:19,color:'#8B6881'},inlineAction:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingTop:12,borderTopWidth:1,borderTopColor:'#E7D3E0'},link:{fontSize:12,fontWeight:'700',color:'#A23D69'},sectionHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:8},sectionTitle:{fontSize:18,fontWeight:'700',color:'#4D3B50',letterSpacing:-.4},quickGrid:{flexDirection:'row',flexWrap:'wrap',gap:12},quickCard:{width:'48%',flexGrow:1,backgroundColor:'#FFF',borderRadius:20,padding:16,gap:5,borderWidth:1,borderColor:'#F0E6EC'},quickIcon:{width:44,height:44,borderRadius:15,alignItems:'center',justifyContent:'center',marginBottom:8},cardTitle:{fontSize:14,fontWeight:'700',color:'#513D52',flexShrink:1},emergencyCard:{flexDirection:'row',alignItems:'center',padding:16,borderRadius:18,backgroundColor:'#FCF0EF',gap:12},emergencyIcon:{width:46,height:46,borderRadius:15,backgroundColor:'#FADEDF',justifyContent:'center',alignItems:'center'},empty:{borderWidth:1,borderColor:'#EFE4EB',borderStyle:'dashed',borderRadius:20,padding:24,alignItems:'center',gap:9},footer:{textAlign:'center',fontSize:10,color:'#B49AAA',letterSpacing:1.1,marginTop:10},nav:{flexDirection:'row',borderTopWidth:1,borderTopColor:'#F0E5EC',backgroundColor:'#FFF',paddingVertical:8},navItem:{flex:1,alignItems:'center',gap:3,minHeight:55,justifyContent:'center'},navIcon:{paddingVertical:5,paddingHorizontal:20,borderRadius:20},navActive:{backgroundColor:'#F5E6EF'},navLabel:{fontSize:10,color:'#9B8D99',fontWeight:'600'},navLabelActive:{color:'#A33D68'},card:{backgroundColor:'#FFF',padding:20,borderWidth:1,borderColor:'#F0E6EC',borderRadius:22,gap:16},chips:{flexDirection:'row',flexWrap:'wrap',gap:8},chip:{paddingHorizontal:12,paddingVertical:10,borderRadius:22,borderWidth:1,borderColor:'#EADCE5',backgroundColor:'#FFF'},selectedChip:{backgroundColor:'#A84974',borderColor:'#A84974'},selectedText:{color:'#FFF',fontSize:13,lineHeight:21,fontWeight:'600'},message:{borderWidth:1,borderColor:'#E7DAE3',borderRadius:16,padding:14,minHeight:140,textAlignVertical:'top',fontSize:15,color:'#513D52',backgroundColor:'#FFFAFC'},button:{backgroundColor:'#AC4D78',borderRadius:17,padding:16,flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12,minHeight:52},buttonText:{color:'#FFF',fontSize:14,fontWeight:'700'},danger:{backgroundColor:'#B84C58'},pressed:{opacity:.75},disabled:{opacity:.5},tip:{flexDirection:'row',gap:12,backgroundColor:'#EDF4EE',padding:16,borderRadius:17,alignItems:'center'},stats:{flexDirection:'row',backgroundColor:'#F5E6EF',borderRadius:20,paddingVertical:20},stat:{flex:1,alignItems:'center',gap:6},statValue:{fontSize:28,fontWeight:'800',color:'#A14D75'},historyCard:{flexDirection:'row',padding:16,borderWidth:1,borderColor:'#EEE4EB',backgroundColor:'#FFF',borderRadius:18,gap:12},iconBox:{width:40,height:40,borderRadius:13,alignItems:'center',justifyContent:'center'},badge:{fontSize:10,fontWeight:'700',color:'#A14D75',backgroundColor:'#F8EFF4',paddingHorizontal:8,paddingVertical:5,borderRadius:10,overflow:'hidden'},profileAvatar:{width:72,height:72,borderRadius:26,backgroundColor:'#F5E6EF',justifyContent:'center',alignItems:'center'},avatarText:{fontSize:32,fontWeight:'700',color:'#A84974'},codeInput:{padding:15,borderWidth:1,borderColor:'#E7DAE3',borderRadius:14,color:'#513D52',letterSpacing:2,fontSize:16},logout:{padding:18,borderWidth:1,borderColor:'#E7DAE3',borderRadius:17,flexDirection:'row',justifyContent:'center',alignItems:'center',gap:10},error:{padding:16,backgroundColor:'#FFF0E8',borderRadius:17,gap:8},retry:{paddingVertical:10}
});
