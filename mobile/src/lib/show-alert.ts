import { Alert, Platform, type AlertButton } from 'react-native';

export function showAlert(title: string, message: string, buttons?: AlertButton[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = `${title}\n\n${message}`;
  const action = buttons?.find(button => button.onPress);
  if (!action) {
    window.alert(text);
  } else if (window.confirm(`${text}\n\nSelect OK to ${action.text?.toLowerCase()}.`)) {
    action.onPress?.();
  }
}
