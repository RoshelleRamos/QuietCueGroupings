import React from 'react';
import { Redirect } from 'expo-router';
import ParentDashboardScreen from '../screens/ParentDashboardScreen';
export default function ParentPreview(){return __DEV__?<ParentDashboardScreen preview/>:<Redirect href="/"/>;}
