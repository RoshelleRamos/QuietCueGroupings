import React from 'react';
import { ParentProvider } from '../state/ParentProvider';
import { Stack } from 'expo-router';
export default function RootLayout(){
 return <ParentProvider><Stack screenOptions={{headerShown:false,animation:'fade'}}/></ParentProvider>;
}