import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  DEFAULT_NOTIFICATION_SETTINGS,
  getNotificationSettings,
  saveNotificationSettings,
  type NotificationSettings,
} from "../utils/notificationSettings";

type Props = {
  onBack: () => void;
};

export default function ParentNotificationSettingsScreen({
  onBack,
}: Props) {
  const [settings, setSettings] = useState<NotificationSettings>(
    DEFAULT_NOTIFICATION_SETTINGS
  );

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    const loadSettings = async () => {
      const saved = await getNotificationSettings();

      if (active) {
        setSettings(saved);
        setLoaded(true);
      }
    };

    void loadSettings();

    return () => {
      active = false;
    };
  }, []);

  const updateSetting = async (
    key: keyof NotificationSettings,
    value: boolean
  ) => {
    const updated = {
      ...settings,
      [key]: value,
    };

    setSettings(updated);
    await saveNotificationSettings(updated);
  };

  const renderSetting = (
    key: keyof NotificationSettings,
    title: string,
    description: string,
    icon: keyof typeof Ionicons.glyphMap
  ) => (
    <View style={styles.settingCard}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={24} color="#B53166" />
      </View>

      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>
          {description}
        </Text>
      </View>

      <Switch
        value={settings[key]}
        onValueChange={(value) =>
          void updateSetting(key, value)
        }
        trackColor={{
          false: "#D9C5CD",
          true: "#E8A0BC",
        }}
        thumbColor={settings[key] ? "#B53166" : "#F5F5F5"}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Ionicons
            name="arrow-back"
            size={26}
            color="#FFFFFF"
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          Notification Settings
        </Text>

        <View style={{ width: 26 }} />
      </View>

      {!loaded ? (
        <ActivityIndicator
          size="large"
          color="#B53166"
          style={{ marginTop: 40 }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>
            Manage Notifications
          </Text>

          <Text style={styles.sectionDescription}>
            Choose which updates you want to receive.
          </Text>

          {renderSetting(
            "task",
            "Task Notifications",
            "Added, completed, and deleted tasks",
            "checkbox-outline"
          )}

          {renderSetting(
            "focus",
            "Focus Notifications",
            "Completed focus sessions",
            "timer-outline"
          )}

          {renderSetting(
            "message",
            "Message Notifications",
            "Teacher message updates (future integration)",
            "chatbubble-ellipses-outline"
          )}

          <Text style={styles.note}>
            Your preferences are saved automatically.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8FB",
  },
  header: {
    backgroundColor: "#B53166",
    paddingTop: 55,
    paddingBottom: 25,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#49303C",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#745663",
    marginBottom: 24,
  },
  settingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F4DCE5",
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FCE4EC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
    paddingRight: 8,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#49303C",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: "#745663",
    lineHeight: 18,
  },
  note: {
    fontSize: 12,
    color: "#9F4268",
    textAlign: "center",
    marginTop: 20,
  },
});