import AsyncStorage from "@react-native-async-storage/async-storage";

const SETTINGS_KEY = "@quietcue_notification_settings_v1";

export type NotificationSettings = {
  task: boolean;
  focus: boolean;
  message: boolean;
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  task: true,
  focus: true,
  message: true,
};

export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const saved = await AsyncStorage.getItem(SETTINGS_KEY);

    if (!saved) {
      return { ...DEFAULT_NOTIFICATION_SETTINGS };
    }

    return {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...JSON.parse(saved),
    };
  } catch (error) {
    console.error("Failed to load notification settings:", error);
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }
}

export async function saveNotificationSettings(
  settings: NotificationSettings
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(settings)
    );
  } catch (error) {
    console.error("Failed to save notification settings:", error);
  }
}