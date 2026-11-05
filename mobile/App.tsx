import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, View, Text, Pressable, StyleSheet } from 'react-native';

import { type User, backend, type Registration, type Role } from './src/lib/api';
import { errorMessage } from './src/lib/family';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import CreateAccountScreen from './src/screens/CreateAccountScreen';
import RoleSelectionScreen from './src/screens/RoleSelectionScreen';

export default function App() {
  const [screen, setScreen] = useState<'splash' | 'login' | 'register' | 'role' | 'home' | 'tasks'>('splash');
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  useEffect(() => {
    let active = true;
    let authChanged = false;
    const { data: { subscription } } = backend.auth.onAuthStateChange((_event, session) => {
      authChanged = true;
      if (!active) return;
      setUser(session?.user ?? null);
      if (session && (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION')) setScreen('home');
      else if (_event === 'SIGNED_OUT') setScreen('login');
      setChecking(false);
    });
    backend.auth.getSession().then(({ data, error }) => {
      if (!active || authChanged) return;
      if (error) Alert.alert('Session Error', error.message);
      setUser(data.session?.user ?? null);
      if (data.session) setScreen('home');
      setChecking(false);
    }).catch(() => { if (active) setChecking(false); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  const logout = async () => {
    const { error } = await backend.auth.signOut();
    if (error) { Alert.alert('Logout Failed', error.message); return; }
    setUser(null); setScreen('login');
  };
  const createAccount = async (role: Role) => {
    if (!registration || submitting.current) return;
    submitting.current = true; setBusy(true);
    try {
      const { data, error } = await backend.auth.signUp({
        email: registration.email, password: registration.password,
        options: { data: { full_name: registration.fullName, role } }
      });
      if (error) throw error;
      setRegistration(null);
      if (data.session) { setUser(data.session.user); setScreen('home'); }
      else {
        setScreen('login');
        Alert.alert('Check Your Email', 'Check your inbox (or spam) for the confirmation link, then return here to log in. If you already registered, use your existing login.');
      }
    } catch (error) {
      Alert.alert('Sign Up Failed', errorMessage(error));
    } finally { submitting.current = false; setBusy(false); }
  };
  if (checking) return <View style={styles.center}><ActivityIndicator color="#BE356C" size="large" /></View>;
  if (screen === 'splash') return <SplashScreen onContinue={() => setScreen('login')} />;
  if (screen === 'register') return <CreateAccountScreen onBack={() => { setRegistration(null); setScreen('login'); }} onContinue={details => { setRegistration(details); setScreen('role'); }} />;
  if (screen === 'role') return <RoleSelectionScreen busy={busy} onBack={() => { setRegistration(null); setScreen('register'); }} onContinue={createAccount} />;
  if (user && (screen === 'home' || screen === 'tasks')) {
    const role = user.user_metadata.role;
    if (role === 'child' || role === 'family') return <Redirect href="/child/home" />;
    if (role === 'parent') return <Redirect href="/parent/home" />;
    return <View style={styles.center}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Welcome, {user.user_metadata.full_name || 'QuietCue user'}!</Text>
      <Text style={styles.text}>Account: {role === 'child' ? 'Child' : role === 'family' ? 'Family' : 'Role not set'}</Text>
      <Text style={styles.text}>{user.email}</Text>
      <Text style={styles.text}>You are signed in. Your dashboard is coming soon.</Text>
      <Pressable style={styles.button} onPress={logout}><Text style={styles.title}>Log Out</Text></Pressable>
    </View>;
  }
  return <LoginScreen onSignUp={() => setScreen('register')} onLogin={async (email, password) => {
    try {
      const { data, error } = await backend.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setUser(data.user); setScreen('home');
    } catch (error) { Alert.alert('Login Failed', errorMessage(error)); }
  }} />;
}
const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#FFF8FB', justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  title: { color: '#BE356C', fontSize: 21, fontWeight: '600', textAlign: 'center' },
  text: { color: '#553241', textAlign: 'center' },
  button: { backgroundColor: '#E9B7C9', borderRadius: 24, paddingHorizontal: 32, paddingVertical: 12 }
});
