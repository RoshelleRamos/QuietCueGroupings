import { Platform } from 'react-native';
import type { ParentNotification } from './parent-model';
// Local presentation only. Background remote push requires a signed app and server dispatcher.
async function api(){
 if(Platform.OS==='web')return null;
 const notifications=await import('expo-notifications');
 notifications.setNotificationHandler({handleNotification:async()=>({shouldPlaySound:true,shouldSetBadge:false,shouldShowBanner:true,shouldShowList:true})});
 return notifications;
}
export async function enableDeviceAlerts(){
 const n=await api();if(!n)return false;
 if(Platform.OS==='android')await n.setNotificationChannelAsync('family',{name:'Family alerts',importance:n.AndroidImportance.HIGH,sound:'default'});
 const settings=await n.requestPermissionsAsync({ios:{allowAlert:true,allowSound:true,allowBadge:true}});
 return settings.granted || settings.ios?.status===n.IosAuthorizationStatus.PROVISIONAL;
}
export async function presentDeviceAlert(note:ParentNotification,stillSignedIn:()=>boolean=()=>true){
 try{
  const n=await api();if(!n)return false;
  const settings=await n.getPermissionsAsync();
  if(!settings.granted && settings.ios?.status!==n.IosAuthorizationStatus.PROVISIONAL)return false;
  if(!stillSignedIn())return false;
  await n.scheduleNotificationAsync({identifier:`quietcue-${note.id}`,content:{title:note.title,body:note.body,sound:'default',data:{recipientId:note.recipient_id,page:'notifications'}},trigger:null});return true;
 }catch{return false;}
}
