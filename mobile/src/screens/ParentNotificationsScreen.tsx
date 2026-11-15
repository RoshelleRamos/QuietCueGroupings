import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatNotificationTime } from "../utils/notifications";

const STORAGE_KEY = "@quietcue_parent_notifications_v1";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type?: "task" | "focus" | "message" | "general";
};

type Props = {
  onBack: () => void;
  onSettingsPress: () => void;
};

const initialNotifications: NotificationItem[] = [
  {
    id: "1",
    title: "Welcome to QuietCue!",
    message: "Your notification center is ready.",
    time: "Today",
    read: false,
  },
  {
    id: "2",
    title: "Focus Reminder",
    message: "Remember to take breaks between focus sessions.",
    time: "Today",
    read: false,
  },
];

export default function ParentNotificationsScreen({
  onBack,
  onSettingsPress,
}: Props) {

  const [notifications, setNotifications] = useState<
    NotificationItem[]
  >([]);

  const [loaded, setLoaded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<
  "All" | "Unread" | "Tasks" | "Focus"
>("All");

  const [selectedNotification, setSelectedNotification] =
  useState<NotificationItem | null>(null);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);

        if (saved !== null) {
          setNotifications(JSON.parse(saved));
        } else {
          setNotifications(initialNotifications);
        }
      } catch (error) {
        console.error("Failed to load notifications:", error);
        setNotifications(initialNotifications);
      } finally {
        setLoaded(true);
      }
    };

    loadNotifications();
  }, []);

  useEffect(() => {
    if (!loaded) return;

    const saveNotifications = async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(notifications)
        );
      } catch (error) {
        console.error("Failed to save notifications:", error);
      }
    };

    saveNotifications();
  }, [notifications, loaded]);

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

const filteredNotifications = notifications.filter((notification) => {
  const title = notification.title.toLowerCase();

  const category =
    notification.type && notification.type !== "general"
      ? notification.type
      : title.includes("task")
      ? "task"
      : title.includes("focus")
      ? "focus"
      : title.includes("message")
      ? "message"
      : "general";

  switch (activeFilter) {
    case "Unread":
      return !notification.read;

    case "Tasks":
      return category === "task";

    case "Focus":
      return category === "focus";

    default:
      return true;
  }
});

  const markAsRead = (id: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  };

  const clearAll = () => {
    Alert.alert(
      "Clear Notifications",
      "Are you sure you want to remove all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => setNotifications([]),
        },
      ]
    );
  };

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

            <Pressable
                onPress={onSettingsPress}
                accessibilityLabel="Notification Settings"
                hitSlop={12}
                >
                <Ionicons
                    name="settings-outline"
                    size={25}
                    color="#FFFFFF"
                />
                </Pressable>

                </View>

      {!loaded ? (
        <ActivityIndicator
          size="large"
          color="#B53166"
          style={{ marginTop: 40 }}
        />
      ) : (
        <>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              {unreadCount} unread notification
              {unreadCount === 1 ? "" : "s"}
            </Text>

            <Pressable
              onPress={markAllAsRead}
              disabled={unreadCount === 0}
            >
              <Text
                style={[
                  styles.actionText,
                  unreadCount === 0 && { opacity: 0.4 },
                ]}
              >
                Mark All Read
              </Text>
            </Pressable>
          </View>

          <View
  style={{
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  }}
>
  {(["All", "Unread", "Tasks", "Focus"] as const).map(
    (filter) => (
      <Pressable
        key={filter}
        onPress={() => setActiveFilter(filter)}
        style={{
          flex: 1,
          paddingVertical: 10,
          borderRadius: 12,
          alignItems: "center",
          backgroundColor:
            activeFilter === filter ? "#B53166" : "#FCE4EC",
        }}
      >
        <Text
          style={{
            color:
              activeFilter === filter ? "#FFFFFF" : "#B53166",
            fontSize: 12,
            fontWeight: "700",
          }}
        >
          {filter}
        </Text>
      </Pressable>
    )
  )}
</View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {filteredNotifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="notifications-off-outline"
                  size={48}
                  color="#D45A88"
                />
                <Text style={styles.emptyTitle}>
                {activeFilter === "Unread"
                    ? "All Caught Up!"
                    : activeFilter === "Tasks"
                    ? "No Task Notifications"
                    : activeFilter === "Focus"
                    ? "No Focus Notifications"
                    : "No Notifications Yet"}
                </Text>

                <Text style={styles.emptyDescription}>
                {activeFilter === "Unread"
                    ? "You have no unread notifications."
                    : activeFilter === "Tasks"
                    ? "Your task updates will appear here."
                    : activeFilter === "Focus"
                    ? "Your completed focus sessions will appear here."
                    : "Your latest updates will appear here."}
                </Text>
              </View>
            ) : (

              [...filteredNotifications]
              .sort((a, b) => {
                    const getTimestamp = (item: typeof a) => {
                    const idTimestamp = Number(item.id.split("-")[0]);

                    if (Number.isFinite(idTimestamp) && idTimestamp > 0) {
                        return idTimestamp;
                    }

                    const parsedTime = new Date(item.time).getTime();

                    return Number.isNaN(parsedTime) ? 0 : parsedTime;
                    };

                    return getTimestamp(b) - getTimestamp(a);
                })
                .map((notification) => (


                <Pressable
                  key={notification.id}
                  style={[
                    styles.notificationCard,
                    !notification.read && styles.unreadCard,
                  ]}
                  onPress={() => {
                    markAsRead(notification.id);
                    setSelectedNotification(notification);
                    }}  

                >
                 <View style={styles.iconCircle}>
                <Ionicons
                    name={
                        (notification.type === "task" ||
                        (!notification.type &&
                            notification.title.toLowerCase().includes("task")))
                        ? "checkbox-outline"
                        : (notification.type === "focus" ||
                            (!notification.type &&
                                notification.title.toLowerCase().includes("focus")))
                        ? "timer-outline"
                        : (notification.type === "message" ||
                            (!notification.type &&
                                notification.title.toLowerCase().includes("message")))
                        ? "chatbubble-ellipses-outline"
                        : "notifications-outline"
                    }
                    size={21}
                    color="#B53166"
                    />
                </View>

                  <View style={styles.notificationInfo}>
                    <Text style={styles.notificationTitle}>
                      {notification.title}
                    </Text>

                    <Text style={styles.notificationMessage}>
                      {notification.message}
                    </Text>

                    <Text style={styles.notificationTime}>
                        {formatNotificationTime(notification.time)}
                        </Text>
                  </View>

                  {!notification.read && (
                    <View style={styles.unreadDot} />
                  )}
                </Pressable>
              ))
            )}

            {notifications.length > 0 && (
              <Pressable
                style={styles.clearButton}
                onPress={clearAll}
              >
                <Ionicons
                  name="trash-outline"
                  size={17}
                  color="#B53166"
                />
                <Text style={styles.clearText}>
                  Clear All Notifications
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </>
      )}
        {/* NOTIFICATION DETAILS POPUP */}
  <Modal
    visible={selectedNotification !== null}
    transparent
    animationType="fade"
    onRequestClose={() => setSelectedNotification(null)}
  >
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <View
        style={{
          backgroundColor: "#FFF8FB",
          borderRadius: 20,
          padding: 24,
        }}
      >
        <Text
          style={{
            fontSize: 19,
            fontWeight: "700",
            color: "#49303C",
            marginBottom: 12,
          }}
        >
          {selectedNotification?.title}
        </Text>

        <Text
          style={{
            fontSize: 14,
            color: "#745663",
            lineHeight: 22,
          }}
        >
          {selectedNotification?.message}
        </Text>

        <Text
          style={{
            fontSize: 12,
            color: "#9F4268",
            marginTop: 15,
          }}
        >
          {selectedNotification
                ? formatNotificationTime(selectedNotification.time)
                : ""}
        </Text>

        <Pressable
          onPress={() => setSelectedNotification(null)}
          style={{
            backgroundColor: "#B53166",
            borderRadius: 12,
            padding: 13,
            alignItems: "center",
            marginTop: 25,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
            Close
          </Text>
        </Pressable>

      </View>
    </View>
  </Modal>

</View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8FB",
  },
  header: {
    backgroundColor: "#D45A88",
    paddingTop: 65,
    paddingBottom: 25,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 12,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#49303C",
  },
  actionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B53166",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 35,
  },
  notificationCard: {
    backgroundColor: "#F4ECEF",
    borderRadius: 15,
    padding: 15,
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  unreadCard: {
    backgroundColor: "#FFE4EE",
    borderLeftWidth: 4,
    borderLeftColor: "#B53166",
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F5A5C2",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#49303C",
    marginBottom: 5,
  },
  notificationMessage: {
    fontSize: 12,
    color: "#745663",
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 10,
    color: "#9F4268",
    marginTop: 8,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#B53166",
    marginTop: 5,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#49303C",
    marginTop: 15,
  },
  emptyDescription: {
    fontSize: 13,
    color: "#9F4268",
    marginTop: 7,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    marginTop: 15,
  },
  clearText: {
    color: "#B53166",
    fontSize: 13,
    fontWeight: "700",
  },
});
