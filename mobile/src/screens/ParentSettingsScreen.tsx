import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const SOUND_SETTINGS_KEY = "@quietcue_sound_settings_v1";
const APPEARANCE_SETTINGS_KEY = "@quietcue_appearance_settings_v1";

type AppearanceMode = "light" | "dark" | "system";

type SoundPreferences = {
  notificationSounds: boolean;
  vibration: boolean;
};

type Props = {
  onBack: () => void;
  onProfilePress: () => void;
  onNotificationSettingsPress: () => void;
  
  
};

export default function ParentSettingsScreen({
  onBack,
  onProfilePress,
  onNotificationSettingsPress,
  
}: Props) {

  const [notificationSounds, setNotificationSounds] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [appearance, setAppearance] = useState<AppearanceMode>("light");
const [appearanceLoaded, setAppearanceLoaded] = useState(false);
const [appearanceExpanded, setAppearanceExpanded] = useState(false);
const [aboutVisible, setAboutVisible] = useState(false);

  useEffect(() => {
    let active = true;

    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem(SOUND_SETTINGS_KEY);

        if (saved && active) {
          const preferences: SoundPreferences = JSON.parse(saved);
          setNotificationSounds(preferences.notificationSounds ?? true);
          setVibration(preferences.vibration ?? true);
        }
      } catch (error) {
        console.error("Failed to load sound settings:", error);
      } finally {
        if (active) {
          setSettingsLoaded(true);
        }
      }
    };

    void loadSettings();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
  let active = true;

  const loadAppearance = async () => {
    try {
      const saved = await AsyncStorage.getItem(
        APPEARANCE_SETTINGS_KEY
      );

      if (
        active &&
        (saved === "light" ||
          saved === "dark" ||
          saved === "system")
      ) {
        setAppearance(saved);
      }
    } catch (error) {
      console.error("Failed to load appearance settings:", error);
    } finally {
      if (active) {
        setAppearanceLoaded(true);
      }
    }
  };

  void loadAppearance();

  return () => {
    active = false;
  };
}, []);

const updateAppearance = async (mode: AppearanceMode) => {
  try {
    await AsyncStorage.setItem(APPEARANCE_SETTINGS_KEY, mode);
    setAppearance(mode);
    setAppearanceExpanded(false);
  } catch (error) {
    console.error("Failed to save appearance settings:", error);
  }
};

  const updateSoundPreferences = async (
    nextPreferences: SoundPreferences
  ) => {
    setNotificationSounds(nextPreferences.notificationSounds);
    setVibration(nextPreferences.vibration);

    try {
      await AsyncStorage.setItem(
        SOUND_SETTINGS_KEY,
        JSON.stringify(nextPreferences)
      );
    } catch (error) {
      console.error("Failed to save sound settings:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityLabel="Back to Home"
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.headerTitle}>App Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>ACCOUNT</Text>

        <SettingRow
          icon="person-outline"
          title="My Profile"
          subtitle="Personal information and availability"
          onPress={onProfilePress}
        />

        <Text style={styles.sectionTitle}>PREFERENCES</Text>

        <SettingRow
          icon="notifications-outline"
          title="Notification Settings"
          subtitle="Manage alerts and reminders"
          onPress={onNotificationSettingsPress}
        />

        <View style={styles.soundCard}>
  <View style={styles.soundHeader}>
    <Ionicons
      name="volume-medium-outline"
      size={22}
      color="#B53166"
    />
    <Text style={styles.soundTitle}>Sounds & Vibration</Text>
  </View>

  <View style={styles.switchRow}>
    <View style={styles.settingInfo}>
      <Text style={styles.settingTitle}>Notification Sounds</Text>
      <Text style={styles.settingSubtitle}>
        Play sounds for notifications
      </Text>
    </View>

    <Switch
      value={notificationSounds}
      disabled={!settingsLoaded}
      onValueChange={(value) =>
        void updateSoundPreferences({
          notificationSounds: value,
          vibration,
        })
      }
      trackColor={{ false: "#E4CBD5", true: "#F5A5C2" }}
      thumbColor={notificationSounds ? "#B53166" : "#F4F3F4"}
    />
  </View>

  <View style={styles.switchRow}>
    <View style={styles.settingInfo}>
      <Text style={styles.settingTitle}>Vibration</Text>
      <Text style={styles.settingSubtitle}>
        Enable vibration for alerts
      </Text>
    </View>

    <Switch
      value={vibration}
      disabled={!settingsLoaded}
      onValueChange={(value) =>
        void updateSoundPreferences({
          notificationSounds,
          vibration: value,
        })
      }
      trackColor={{ false: "#E4CBD5", true: "#F5A5C2" }}
      thumbColor={vibration ? "#B53166" : "#F4F3F4"}
    />
  </View>
</View>

<View style={styles.appearanceCard}>
  <Pressable
    disabled={!appearanceLoaded}
    onPress={() => setAppearanceExpanded(!appearanceExpanded)}
    style={styles.appearanceHeader}
  >
    <View style={styles.iconBox}>
      <Ionicons
        name="color-palette-outline"
        size={23}
        color="#B53166"
      />
    </View>

    <View style={styles.settingInfo}>
      <Text style={styles.settingTitle}>Appearance</Text>
      <Text style={styles.settingSubtitle}>
        Selected: {appearance === "system"
          ? "System Default"
          : appearance === "dark"
          ? "Dark"
          : "Light"}
      </Text>
    </View>

    <Ionicons
      name={appearanceExpanded ? "chevron-up" : "chevron-down"}
      size={20}
      color="#B53166"
    />
  </Pressable>

  {appearanceExpanded && (
    <View style={styles.appearanceOptions}>
      {([
        { value: "light", label: "Light", icon: "sunny-outline" },
        { value: "dark", label: "Dark", icon: "moon-outline" },
        { value: "system", label: "System Default", icon: "phone-portrait-outline" },
      ] as const).map((option) => (
        <Pressable
          key={option.value}
          onPress={() => void updateAppearance(option.value)}
          style={styles.appearanceOption}
        >
          <Ionicons
            name={option.icon}
            size={21}
            color="#B53166"
          />

          <Text style={styles.appearanceOptionText}>
            {option.label}
          </Text>

          <Ionicons
            name={
              appearance === option.value
                ? "radio-button-on"
                : "radio-button-off"
            }
            size={22}
            color="#B53166"
          />
        </Pressable>
      ))}
    </View>
  )}
</View>

            </ScrollView>
      <Modal
  visible={aboutVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setAboutVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.aboutCard}>
      <Ionicons
        name="heart-circle-outline"
        size={55}
        color="#B53166"
      />

      <Text style={styles.aboutTitle}>QuietCue</Text>
      <Text style={styles.aboutVersion}>Version 1.0.0 (Demo)</Text>

      <Text style={styles.aboutDescription}>
        QuietCue is a family-focused application designed
        to help parents and children manage tasks,
        communicate, and maintain a healthy balance
        between focus time and availability.
      </Text>

      <Text style={styles.aboutDescription}>
        Features include task management, focus sessions,
        family communication, availability status,
        and notification preferences.
      </Text>

      <Pressable
        onPress={() => setAboutVisible(false)}
        style={styles.closeAboutButton}
      >
        <Text style={styles.closeAboutText}>Close</Text>
      </Pressable>
    </View>
  </View>
</Modal>
    </SafeAreaView>
  );
}

type SettingRowProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
  onPress?: () => void;
};

function SettingRow({
  icon,
  title,
  subtitle,
  onPress,
}: SettingRowProps) {
  const isEnabled = typeof onPress === "function";

  return (
    <Pressable
      onPress={onPress}
      disabled={!isEnabled}
      style={({ pressed }) => [
        styles.settingRow,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={23} color="#B53166" />
      </View>

      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>

      {isEnabled ? (
        <Ionicons
          name="chevron-forward"
          size={20}
          color="#B53166"
        />
      ) : (
        <Text style={styles.comingSoon}>Coming soon</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8FB",
  },
  header: {
    backgroundColor: "#D45A88",
    paddingHorizontal: 18,
    paddingVertical: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  sectionTitle: {
    color: "#B53166",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 22,
    marginBottom: 12,
  },
  settingRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#F5DCE6",
  },
  pressed: {
    opacity: 0.7,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FFE5EE",
    alignItems: "center",
    justifyContent: "center",
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#49303C",
  },
  settingSubtitle: {
    fontSize: 11,
    color: "#826B75",
    marginTop: 4,
  },
  comingSoon: {
    fontSize: 10,
    color: "#9B8B92",
  },

  soundCard: {
  backgroundColor: "#FFFFFF",
  borderRadius: 14,
  padding: 15,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: "#F5DCE6",
},
soundHeader: {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
  marginBottom: 12,
},
soundTitle: {
  fontSize: 14,
  fontWeight: "700",
  color: "#49303C",
},
switchRow: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 12,
  borderTopWidth: 1,
  borderTopColor: "#F9E8EF",
  gap: 12,
},
appearanceCard: {
  backgroundColor: "#FFFFFF",
  borderRadius: 14,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: "#F5DCE6",
  overflow: "hidden",
},
appearanceHeader: {
  padding: 14,
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
},
appearanceOptions: {
  borderTopWidth: 1,
  borderTopColor: "#F5DCE6",
  paddingHorizontal: 14,
},
appearanceOption: {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
  paddingVertical: 15,
  borderBottomWidth: 1,
  borderBottomColor: "#F9E8EF",
},
appearanceOptionText: {
  flex: 1,
  fontSize: 14,
  fontWeight: "500",
  color: "#49303C",
},

modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.45)",
  justifyContent: "center",
  alignItems: "center",
  padding: 24,
},
aboutCard: {
  width: "100%",
  backgroundColor: "#FFF8FB",
  borderRadius: 22,
  padding: 25,
  alignItems: "center",
},
aboutTitle: {
  fontSize: 25,
  fontWeight: "700",
  color: "#B53166",
  marginTop: 8,
},
aboutVersion: {
  fontSize: 12,
  color: "#826B75",
  marginTop: 4,
  marginBottom: 18,
},
aboutDescription: {
  fontSize: 13,
  color: "#49303C",
  textAlign: "center",
  lineHeight: 21,
  marginBottom: 14,
},
closeAboutButton: {
  backgroundColor: "#B53166",
  paddingVertical: 12,
  paddingHorizontal: 45,
  borderRadius: 25,
  marginTop: 12,
},
closeAboutText: {
  color: "#FFFFFF",
  fontWeight: "700",
  fontSize: 14,
},
});
