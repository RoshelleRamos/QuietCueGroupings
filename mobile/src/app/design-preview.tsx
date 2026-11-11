import React from 'react';
import { Redirect } from 'expo-router';
import ChildDashboardScreen from '../screens/ChildDashboardScreen';
export default function Preview(){ return __DEV__ ? <ChildDashboardScreen preview/> : <Redirect href="/"/>; }
