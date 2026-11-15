

import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Image,
  Modal,
  AppState,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  NOTIFICATIONS_STORAGE_KEY,
  type NotificationItem,
} from "../utils/notifications";

type Props = {
  onTasksPress: () => void;
  onFocusPress: () => void;
  onMessagesPress: () => void;
  onNotificationsPress: () => void;
  onNotificationSettingsPress: () => void;
  onProfilePress: () => void;
  onAppSettingsPress: () => void;
  onAboutPress: () => void;
  onPrivacyPress: () => void;
  onLogout: () => void;
};

export default function ParentHomeScreen({
  onTasksPress,
  onFocusPress,
  onMessagesPress,
  onNotificationsPress,
  onNotificationSettingsPress,
  onProfilePress,
  onAppSettingsPress,
  onAboutPress,
  onPrivacyPress,
  onLogout,
}: Props) {

    const [unreadCount, setUnreadCount] = useState(0);
    const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    let active = true;

    const loadUnreadNotifications = async () => {
      try {
        const saved = await AsyncStorage.getItem(
          NOTIFICATIONS_STORAGE_KEY
        );

        const notifications: NotificationItem[] = saved
          ? JSON.parse(saved)
          : [];

        if (active) {
          setUnreadCount(
            notifications.filter((item) => !item.read).length
          );
        }
      } catch (error) {
        console.error(
          "Failed to load unread notifications:",
          error
        );
      }
    };

    void loadUnreadNotifications();

    return () => {
      active = false;
    };
  }, []);
    
  const [tasks, setTasks] = useState<
  { id: number; title: string; completed: boolean }[]
>([]);

useEffect(() => {
  const loadTasks = async () => {
    try {
      const savedTasks = await AsyncStorage.getItem(
        "@quietcue_parent_tasks"
      );

      if (savedTasks !== null) {
        setTasks(JSON.parse(savedTasks));
      }
    } catch (error) {
      console.error("Failed to load dashboard tasks:", error);
    }
  };

  loadTasks();
}, []);

const [availability, setAvailability] = useState("Available");
const [availableAt, setAvailableAt] = useState("");

useEffect(() => {
  const loadAvailability = async () => {
    try {
      const saved = await AsyncStorage.getItem(
        "@quietcue_parent_profile_v1"
      );

      if (saved) {
  const profile = JSON.parse(saved);

  const scheduledTime = Number(profile?.availableAtTimestamp);

  const hasExpired =
    profile?.availability !== "Available" &&
    profile?.availableAtTimestamp != null &&
    Number.isFinite(scheduledTime) &&
    Date.now() >= scheduledTime;

  if (hasExpired) {
    const updatedProfile = {
      ...profile,
      availability: "Available",
      availableAt: "",
      availableAtTimestamp: null,
    };

    await AsyncStorage.setItem(
      "@quietcue_parent_profile_v1",
      JSON.stringify(updatedProfile)
    );

    setAvailability("Available");
    setAvailableAt("");
  } else {
    const scheduledTime = Number(profile?.availableAtTimestamp);

const hasExpired =
  profile?.availability !== "Available" &&
  profile?.availableAtTimestamp != null &&
  Number.isFinite(scheduledTime) &&
  Date.now() >= scheduledTime;

if (hasExpired) {
  const updatedProfile = {
    ...profile,
    availability: "Available",
    availableAt: "",
    availableAtTimestamp: null,
  };

  await AsyncStorage.setItem(
    "@quietcue_parent_profile_v1",
    JSON.stringify(updatedProfile)
  );

  setAvailability("Available");
  setAvailableAt("");
} else {
  setAvailability(profile?.availability ?? "Available");
  setAvailableAt(profile?.availableAt ?? "");
}
  }
}
    } catch (error) {
      console.error("Failed to load availability:", error);
    }
  };

void loadAvailability();

const interval = setInterval(() => {
  if (AppState.currentState === "active") {
    void loadAvailability();
  }
}, 10000);

const subscription = AppState.addEventListener(
  "change",
  (nextState) => {
    if (nextState === "active") {
      void loadAvailability();
    }
  }
);

return () => {
  clearInterval(interval);
  subscription.remove();
};
}, []);

const completedCount = tasks.filter(
  (task) => task.completed
).length;

const totalTasks = tasks.length;

const progressPercentage =
  totalTasks > 0
    ? (completedCount / totalTasks) * 100
    : 0;

    // Show pending tasks first, limited to 3 on dashboard
const dashboardTasks = [...tasks]
  .sort((a, b) => Number(a.completed) - Number(b.completed))
  .slice(0, 3);

  const requests = [
    { name: "Roshelle", message: "school help", priority: "High Priority" },
    { name: "Michaila", message: "layout idea", priority: "Medium Priority" },
    { name: "French", message: "food delivery", priority: "Medium Priority" },
    { name: "Kristine", message: "project fund", priority: "High Priority" },
  ];

  const family = [
    { name: "Roshelle Swift", status: "Focusing" },
    { name: "Michaila Swift", status: "Focusing" },
    { name: "Frenchella Swift", status: "On Break" },
    { name: "Kristine Swift", status: "Available" },
  ];

  return (
    <SafeAreaView style={styles.container}>

{/* FIXED HEADER */}
<View style={styles.header}>
  <View style={styles.brandRow}>
    <Image
      source={require("../../assets/QQ LOGO.png")}
      style={styles.brandLogo}
      resizeMode="cover"
    />

    <Text style={styles.headerTitle}>Quiet Cue</Text>
  </View>

  <View style={styles.headerActions}>
<Pressable
  accessibilityLabel="Notifications"
  onPress={onNotificationsPress}
  style={{
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  }}
>
  <Ionicons
    name="notifications"
    size={25}
    color="#FFD700"
  />

  {unreadCount > 0 && (
  <View
    style={{
      position: "absolute",
      top: -3,
      right: -6,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: "#E53935",
      borderWidth: 1.5,
      borderColor: "#FFF8FB",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 3,
    }}
  >
    <Text
      style={{
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "bold",
      }}
    >
      {unreadCount > 9 ? "9+" : unreadCount}
    </Text>
  </View>
)}
</Pressable>

<Pressable
  accessibilityLabel="Menu"
  onPress={() => setMenuVisible(true)}
  style={{
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  }}
>
  <Ionicons
    name="menu"
    size={28}
    color="#FFFFFF"
  />
</Pressable>

  </View>
</View>

      {/* SCROLLABLE CONTENT */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* PARENT PROFILE */}
        <View style={styles.profileCard}>
        <View style={styles.avatar}>
            <Text style={styles.avatarText}>👩</Text>
        </View>

        <View style={styles.profileInfo}>
            <Text style={styles.parentName}>Parent: Taylor Swift</Text>

                    <View style={styles.statusRow}>
          <View
            style={[
              styles.busyDot,
              {
                backgroundColor:
                  availability === "Available"
                    ? "#22C55E"
                    : availability === "On Break"
                    ? "#F59E0B"
                    : "#EF4444",
              },
            ]}
          />

          <Text style={styles.statusText}>
            {availability}
          </Text>
        </View>

        </View>
        </View>

        {/* FOCUS AND TASKS */}
        <View style={styles.cardsRow}>
          <View style={styles.focusCard}>
            <Text style={styles.cardTitle}>Focus Session</Text>
            <Text style={styles.focusHours}>9 Hours</Text>

            <Text style={styles.progressLabel}>Office Work</Text>
            <View style={styles.progressBackground}>
              <View style={[styles.progressFill, { width: "65%" }]} />
            </View>

            <Text style={styles.progressLabel}>Reading</Text>
            <View style={styles.progressBackground}>
              <View style={[styles.progressFill, { width: "35%" }]} />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.startButton,
                pressed && styles.startButtonPressed,
              ]}
              onPress={onFocusPress}
            >
              <Ionicons name="play-circle-outline" size={17} color="#FFFFFF" />
              <Text style={styles.startButtonText}>Start Session</Text>
            </Pressable>
          </View>

            <View style={styles.tasksCard}>
            <Text style={styles.cardTitle}>Today's Tasks</Text>
            {/* TASK COMPLETION PROGRESS */}
            <View style={{ marginTop: 10, marginBottom: 15 }}>
            <Text style={{ fontSize: 12, color: "#9F4268", marginBottom: 8 }}>
                {completedCount} of {totalTasks} tasks completed ({Math.round(progressPercentage)}%)
            </Text>

            <View
                style={{
                height: 8,
                backgroundColor: "#F5DCE6",
                borderRadius: 10,
                overflow: "hidden",
                }}
            >
                <View
                style={{
                    width: `${progressPercentage}%`,
                    height: "100%",
                    backgroundColor: "#B53166",
                    borderRadius: 10,
                }}
                />
            </View>
            </View>

            {dashboardTasks.length === 0 ? (
  <View
    style={{
      alignItems: "center",
      paddingVertical: 20,
    }}
  >
    <Ionicons
      name="checkmark-circle-outline"
      size={36}
      color="#B53166"
    />

    <Text
      style={{
        fontSize: 14,
        fontWeight: "600",
        color: "#9F4268",
        marginTop: 10,
      }}
    >
      No tasks yet!
    </Text>

    <Text
      style={{
        fontSize: 12,
        color: "#9F4268",
        textAlign: "center",
        marginTop: 5,
      }}
    >
      Add your first task to get started.
    </Text>
  </View>
) : (
        dashboardTasks.map((task) => (
            <View key={task.id} style={styles.taskRow}>
            <Ionicons
                name={task.completed ? "checkbox" : "square-outline"}
                size={14}
                color={task.completed ? "#22C55E" : "#B53166"}
            />

            <Text
                style={[
                styles.taskText,
                task.completed && {
                    textDecorationLine: "line-through",
                    opacity: 0.6,
                },
                ]}
            >
                {task.title}
            </Text>
            </View>
        ))
        )}

            <Pressable
            onPress={onTasksPress}
            >
                <Text style={styles.viewAll}>View All</Text>
             </Pressable>
          </View>
        </View>
        {/* PENDING REQUESTS */}
        <Text style={styles.sectionTitle}>Pending Requests</Text>

        {requests.map((request, index) => {
        const isHighPriority = request.priority === "High Priority";

        return (
            <View key={index} style={styles.requestCard}>
            <Text style={styles.requestText}>
                <Text style={styles.bold}>{request.name}</Text> (Daughter) is
                requesting for {request.message}
            </Text>

            <View
                style={[
                styles.priorityBadge,
                isHighPriority
                    ? styles.highPriorityBadge
                    : styles.mediumPriorityBadge,
                ]}
            >
                <Text
                style={[
                    styles.priorityText,
                    isHighPriority
                    ? styles.highPriorityText
                    : styles.mediumPriorityText,
                ]}
                >
                {request.priority}
                </Text>
            </View>
            </View>
        );
        })}

        {/* FAMILY OVERVIEW */}
        <Text style={styles.sectionTitle}>Family Overview</Text>

        {family.map((member, index) => {
        const statusColor =
            member.status === "Focusing"
            ? "#D94C72"
            : member.status === "On Break"
            ? "#E5A32B"
            : "#39A879";

        return (
            <View key={index} style={styles.familyCard}>
            <View style={styles.familyAvatar}>
                <Text style={styles.familyAvatarText}>👩</Text>
            </View>

            <View style={styles.familyInfo}>
                <Text style={styles.familyName}>{member.name}</Text>

                <View style={styles.familyStatusRow}>
                <View
                    style={[
                    styles.familyStatusDot,
                    { backgroundColor: statusColor },
                    ]}
                />
                <Text style={styles.familyStatus}>
                    {member.status}
                </Text>
                </View>
            </View>

            <Ionicons
                name="chevron-forward"
                size={20}
                color="#E45D92"
            />
            </View>
        );
        })}

      </ScrollView>

 {/* FIXED BOTTOM NAVIGATION */}
<View style={styles.bottomBar}>

  {/* HOME */}
  <View style={styles.activeNavItem}>
    <Ionicons name="home" size={23} color="#FFFFFF" />
    <Text style={styles.navText}>Home</Text>
  </View>

  {/* TASKS */}
  <Pressable
    style={styles.navButton}
    onPress={() => {
      console.log("TASKS PRESSED", typeof onTasksPress);
      onTasksPress();
    }}
  >
    <Ionicons name="checkbox-outline" size={23} color="#FFFFFF" />
    <Text style={styles.navText}>Tasks</Text>
  </Pressable>

 {/* FOCUS */}
<Pressable
  style={styles.navButton}
  onPress={onFocusPress}
>
  <Ionicons name="timer-outline" size={23} color="#FFFFFF" />
  <Text style={styles.navText}>Focus</Text>
</Pressable>

  {/* MESSAGES */}
  <Pressable
  style={styles.navButton}
  onPress={onMessagesPress}
>
  <Ionicons
    name="chatbubble-outline"
    size={23}
    color="#FFFFFF"
  />
  <Text style={styles.navText}>Messages</Text>
</Pressable>

</View>

{/* PARENT MENU */}
<Modal
  visible={menuVisible}
  transparent
  animationType="slide"
  onRequestClose={() => setMenuVisible(false)}
>
  <View
    style={{
      flex: 1,
      flexDirection: "row",
      backgroundColor: "rgba(0,0,0,0.4)",
    }}
  >
    <Pressable
      style={{ flex: 1 }}
      onPress={() => setMenuVisible(false)}
    />

    <View
      style={{
        width: "82%",
        maxWidth: 340,
        backgroundColor: "#FFF8FB",
        paddingTop: 65,
        paddingHorizontal: 20,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 25,
        }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: "#49303C",
          }}
        >
          Parent Menu
        </Text>

        <Pressable onPress={() => setMenuVisible(false)}>
          <Ionicons
            name="close"
            size={26}
            color="#B53166"
          />
        </Pressable>
      </View>

      {[
        { title: "My Profile", icon: "person-outline" },
        { title: "Notification Settings", icon: "notifications-outline" },
        { title: "App Settings", icon: "settings-outline" },
        { title: "Privacy & Security", icon: "shield-checkmark-outline" },
        { title: "About QuietCue", icon: "information-circle-outline" },
      ].map((item) => (
      <Pressable
        key={item.title}
      onPress={() => {
      setMenuVisible(false);

      if (item.title === "My Profile") {
        onProfilePress();
      } else if (item.title === "Notification Settings") {
        onNotificationSettingsPress();
      } else if (item.title === "App Settings") {
      console.log("APP SETTINGS PRESSED");
      onAppSettingsPress();

      } else if (item.title === "Privacy & Security") {
  onPrivacyPress();

    } else if (item.title === "About QuietCue") {
      onAboutPress();

    } else if (item.title === "Logout") {
      onLogout();
    }
    }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#F4DCE5",
        }}
      >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: "#49303C",
            }}
          >
            {item.title}
          </Text>
          </Pressable>
          ))}
      <Pressable
        onPress={() => {
          setMenuVisible(false);
          Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Logout",
                style: "destructive",
                onPress: onLogout,
              },
            ]
          );
        }}
        style={{
          marginTop: 30,
          paddingVertical: 15,
          borderTopWidth: 1,
          borderTopColor: "#F4DCE5",
        }}
      >
        <Text
          style={{
            color: "#B53166",
            fontSize: 16,
            fontWeight: "700",
          }}
        >
          Logout
        </Text>
      </Pressable>
    </View>
  </View>
</Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: "#FFF8FB",
        },

        header: {
            backgroundColor: "#D45A88",
            paddingHorizontal: 22,
            paddingTop: 20,
            paddingBottom: 22,
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },

        brandRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
        },

        brandLogo: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#FFFFFF",
        },

        headerTitle: {
            color: "#FFFFFF",
            fontSize: 18,
            fontWeight: "600",
        },

        headerActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 20,
        },

        headerIcon: {
            color: "#FFFFFF",
            fontSize: 23,
        },

        scrollArea: {
            flex: 1,
        },

        scrollContent: {
            paddingHorizontal: 16,
            paddingTop: 15,
            paddingBottom: 25,
        },


        profileCard: {
            backgroundColor: "#F5A5C2",
            borderRadius: 18,
            paddingVertical: 16,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 14,
            shadowColor: "#B54C78",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.12,
            shadowRadius: 6,
            elevation: 3,
        },

        avatar: {
            width: 54,
            height: 54,
            backgroundColor: "#FFFFFF",
            borderRadius: 27,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 14,
        },

        avatarText: {
            fontSize: 30,
        },

        profileInfo: {
            flex: 1,
        },

        parentName: {
            fontSize: 15,
            fontWeight: "700",
            color: "#49303C",
        },

        statusRow: {
            flexDirection: "row",
            alignItems: "center",
            marginTop: 7,
        },

        busyDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#D62839",
            marginRight: 7,
        },

        statusText: {
            fontSize: 11,
            color: "#663E50",
            flexShrink: 1,
        },

        cardsRow: {
            flexDirection: "row",
            gap: 8,
        },

        focusCard: {
            flex: 1,
            backgroundColor: "#FFE4EC",
            borderWidth: 1,
            borderColor: "#F38DB2",
            borderRadius: 12,
            padding: 10,
        },

        tasksCard: {
            flex: 1,
            backgroundColor: "#FFE5EE",
            borderRadius: 12,
            padding: 10,
        },

        cardTitle: {
            fontSize: 11,
            fontWeight: "700",
            color: "#49303C",
            textAlign: "center",
            marginBottom: 12,
        },

        focusHours: {
            color: "#B23465",
            fontSize: 23,
            fontWeight: "700",
            textAlign: "center",
            marginBottom: 10,
        },

        progressLabel: {
            fontSize: 9,
            color: "#6B4355",
            marginBottom: 4,
        },

        progressBackground: {
            height: 6,
            backgroundColor: "#F4B7CD",
            borderRadius: 6,
            marginBottom: 8,
        },

        progressFill: {
            height: 6,
            backgroundColor: "#B83669",
            borderRadius: 6,
        },

        startButton: {
        backgroundColor: "#AD2F62",
        borderRadius: 22,
        paddingVertical: 10,
        paddingHorizontal: 8,
        marginTop: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        },

        startButtonPressed: {
        opacity: 0.75,
        },

        startButtonText: {
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "700",
        },

        taskRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 5,
        marginBottom: 9,
        },

        taskText: {
        flex: 1,
        fontSize: 10,
        color: "#593E4B",
        lineHeight: 15,
        },

    viewAll: {
        fontSize: 10,
        color: "#B53166",
        textAlign: "center",
        marginTop: 5,
        fontWeight: "600",
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#41353A",
        marginTop: 18,
        marginBottom: 9,
    },

    requestCard: {
        backgroundColor: "#F3ECEF",
        borderLeftWidth: 3,
        borderLeftColor: "#F18BAF",
        borderRadius: 10,
        padding: 9,
        marginBottom: 8,
    },

    requestText: {
        fontSize: 11,
        color: "#493A40",
    },

    bold: {
        fontWeight: "700",
    },

    priorityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 8,
    },

    highPriorityBadge: {
    backgroundColor: "#FAD6DE",
    },

    mediumPriorityBadge: {
    backgroundColor: "#FFF0CC",
    },

    priorityText: {
    fontSize: 10,
    fontWeight: "700",
    },

    highPriorityText: {
    color: "#BC315B",
    },

    mediumPriorityText: {
    color: "#986000",
    },

  familyCard: {
    backgroundColor: "#F4ECEF",
    borderRadius: 12,
    padding: 11,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
  },

  familyAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F9A5C4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  familyInfo: {
    flex: 1,
  },

  familyName: {
    fontSize: 11,
    color: "#43323B",
    fontWeight: "600",
  },

    familyAvatarText: {
    fontSize: 20,
    },

    familyStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    },

    familyStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
    },

    familyStatus: {
    fontSize: 10,
    color: "#74636A",
    },

  arrow: {
    color: "#E45D92",
    fontSize: 26,
  },

bottomBar: {
  backgroundColor: "#DB6795",
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  flexDirection: "row",
  justifyContent: "space-around",
  alignItems: "center",
},

activeNavItem: {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#BE4779",
  borderRadius: 18,
  paddingVertical: 7,
},

navButton: {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: 7,
},

navText: {
  color: "#FFFFFF",
  fontSize: 10,
  fontWeight: "600",
  marginTop: 4,
},
});