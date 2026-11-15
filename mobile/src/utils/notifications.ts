import AsyncStorage from "@react-native-async-storage/async-storage";
import { getNotificationSettings } from "./notificationSettings";

export const NOTIFICATIONS_STORAGE_KEY =
  "@quietcue_parent_notifications_v1";

export type NotificationType =
  | "task"
  | "focus"
  | "message"
  | "general";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type?: NotificationType;
};

export async function addNotification(
  title: string,
  message: string,
  type: NotificationType = "general"
): Promise<void> {
  try {
     // Respect the parent's notification preferences.
    if (type !== "general") {
      const settings = await getNotificationSettings();

      if (!settings[type]) {
        return;
      }
    }
    
    const saved = await AsyncStorage.getItem(
      NOTIFICATIONS_STORAGE_KEY
    );

    const notifications: NotificationItem[] = saved
      ? JSON.parse(saved)
      : [];

        const newNotification: NotificationItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        title,
        message,
        time: new Date().toLocaleString(),
        read: false,
        type,
        };

    await AsyncStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify([newNotification, ...notifications])
    );
  } catch (error) {
    console.error("Failed to add notification:", error);
  }
}


export function formatNotificationTime(time: string): string {
  if (time === "Today" || time === "Yesterday") {
    return time;
  }

  // Support existing US-formatted dates saved in AsyncStorage.
  const match = time.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i
  );

  let date: Date;

  if (match) {
    const [, month, day, year, hour, minute, second, period] = match;

    let hours = Number(hour) % 12;

    if (period.toUpperCase() === "PM") {
      hours += 12;
    }

    date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      hours,
      Number(minute),
      Number(second ?? 0)
    );
  } else {
    date = new Date(time);
  }

  if (Number.isNaN(date.getTime())) {
    return time;
  }

  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const notificationDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (notificationDay.getTime() === today.getTime()) {
    return `Today, ${formattedTime}`;
  }

  if (notificationDay.getTime() === yesterday.getTime()) {
    return `Yesterday, ${formattedTime}`;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

