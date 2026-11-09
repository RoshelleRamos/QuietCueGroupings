import { Redirect } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { localStore, type Registration, type Role } from './src/lib/local-store';
import { errorMessage } from './src/lib/family';
import { showAlert } from './src/lib/show-alert';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import CreateAccountScreen from './src/screens/CreateAccountScreen';
import RoleSelectionScreen from './src/screens/RoleSelectionScreen';
import { useParent } from './src/state/ParentProvider';

export default function App() {
  const { user, loading } = useParent();
  const [screen, setScreen] = useState<'splash' | 'login' | 'register' | 'role'>('splash');
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);

  const createAccount = async (role: Role) => {
    if (!registration || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    try {
      await localStore.signUp(registration, role);
      setRegistration(null);
      setScreen('login');
    } catch (error) {
      showAlert('Could not create account', errorMessage(error));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  if (user) return <Redirect href={user.user_metadata.role === 'parent' ? '/parent/home' : '/child/home'} />;
  if (loading) return <View style={styles.center}><ActivityIndicator color="#BE356C" size="large" /></View>;
  if (screen === 'splash') return <SplashScreen onContinue={() => setScreen('login')} />;
  if (screen === 'register') return <CreateAccountScreen onBack={() => setScreen('login')} onContinue={details => { setRegistration(details); setScreen('role'); }} />;
  if (screen === 'role') return <RoleSelectionScreen busy={busy} onBack={() => { setRegistration(null); setScreen('register'); }} onContinue={createAccount} />;
  return <LoginScreen onSignUp={() => setScreen('register')} onLogin={async (email, password) => {
    try {
      await localStore.signIn(email, password);
    } catch (error) {
      showAlert('Could not log in', errorMessage(error));
    }
  }} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#FFF8FB', justifyContent: 'center', alignItems: 'center' },
});
