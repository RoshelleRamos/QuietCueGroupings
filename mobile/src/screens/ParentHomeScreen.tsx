

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

type RequestStatus = "Pending" | "Approved" | "Declined" | "Completed";

type FamilyRequest = {
  id: string;
  name: string;
  message: string;
  priority: "High Priority" | "Medium Priority";
  status: RequestStatus;
  processedAt?: string;
};

const REQUESTS_STORAGE_KEY = "@quietcue_parent_requests_v3";

const DEFAULT_REQUESTS: FamilyRequest[] = [
  {
    id: "request-shereen-school",
    name: "Shereen",
    message: "Mom, can you help me with my homework?",
    priority: "High Priority",
    status: "Pending",
  },
  {
    id: "request-shriya-snacks",
    name: "Shriya",
    message: "Mom, can you prepare my snacks?",
    priority: "Medium Priority",
    status: "Pending",
  },
  {
    id: "request-artum-grocery",
    name: "Artum",
    message: "Can you check our grocery list?",
    priority: "Medium Priority",
    status: "Pending",
  },
  {
    id: "request-richard-document",
    name: "Richard",
    message: "Can you review my document?",
    priority: "High Priority",
    status: "Pending",
  },

  {
  id: "test-shereen-homework-01",
  name: "Shereen",
  message: "Mom, can you help me finish my homework?",
  priority: "High Priority",
  status: "Pending",
},
{
  id: "test-shereen-school-02",
  name: "Shereen",
  message: "Mom, I need materials for my school project.",
  priority: "Medium Priority",
  status: "Pending",
},
{
  id: "test-shriya-snacks-01",
  name: "Shriya",
  message: "Mom, can you prepare my favorite snacks?",
  priority: "Medium Priority",
  status: "Pending",
},
{
  id: "test-shriya-help-02",
  name: "Shriya",
  message: "Mom, I need your help with something important.",
  priority: "High Priority",
  status: "Pending",
},
{
  id: "test-artum-grocery-01",
  name: "Artum",
  message: "Can you check our grocery list?",
  priority: "Medium Priority",
  status: "Pending",
},
{
  id: "test-artum-call-02",
  name: "Artum",
  message: "Please call me when you are available.",
  priority: "High Priority",
  status: "Pending",
},
{
  id: "test-richard-document-01",
  name: "Richard",
  message: "Can you review the document I sent?",
  priority: "Medium Priority",
  status: "Pending",
},
{
  id: "test-richard-urgent-02",
  name: "Richard",
  message: "I need your help with an urgent family matter.",
  priority: "High Priority",
  status: "Pending",
},
];

const NEW_FAMILY_DEMO_REQUESTS: FamilyRequest[] = [
  {
    id: "demo-shereen-homework-v2",
    name: "Shereen",
    message: "Mom, can you help me with my homework?",
    priority: "High Priority",
    status: "Pending",
  },
  {
    id: "demo-shereen-school-v2",
    name: "Shereen",
    message: "Mom, I need some materials for my school project.",
    priority: "Medium Priority",
    status: "Pending",
  },
  {
    id: "demo-shriya-food-v2",
    name: "Shriya",
    message: "Mom, can you prepare my favorite snacks?",
    priority: "Medium Priority",
    status: "Pending",
  },
  {
    id: "demo-shriya-help-v2",
    name: "Shriya",
    message: "Mom, I need your help with something important.",
    priority: "High Priority",
    status: "Pending",
  },
  {
    id: "demo-artum-grocery-v2",
    name: "Artum",
    message: "Can you check our grocery list?",
    priority: "Medium Priority",
    status: "Pending",
  },
  {
    id: "demo-artum-call-v2",
    name: "Artum",
    message: "Please call me when you are available.",
    priority: "High Priority",
    status: "Pending",
  },
  {
    id: "demo-richard-document-v2",
    name: "Richard",
    message: "Can you review the document I sent?",
    priority: "Medium Priority",
    status: "Pending",
  },
  {
    id: "demo-richard-urgent-v2",
    name: "Richard",
    message: "I need your help with an urgent family matter.",
    priority: "High Priority",
    status: "Pending",
  },
];

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
  parentName: string;
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
  parentName,
  onLogout,
}: Props) {

    const [unreadCount, setUnreadCount] = useState(0);
    const [menuVisible, setMenuVisible] = useState(false);
    const [requests, setRequests] = useState<FamilyRequest[]>([]);
    const [requestsLoaded, setRequestsLoaded] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<FamilyRequest | null>(null);
    const [selectedFamilyMember, setSelectedFamilyMember] = useState<string | null>(null);
    const [requestTab, setRequestTab] = useState<"Pending" | "History">("Pending");

    useEffect(() => {
  let active = true;

  const loadRequests = async () => {
    try {
      const saved = await AsyncStorage.getItem(REQUESTS_STORAGE_KEY);

      if (active) {
        const savedRequests: FamilyRequest[] =
  saved !== null ? JSON.parse(saved) : [];

const existingIds = new Set(
  savedRequests.map((request) => request.id)
);

const missingRequests = DEFAULT_REQUESTS.filter(
  (request) => !existingIds.has(request.id)
);

setRequests([...savedRequests, ...missingRequests]);
      }
    } catch (error) {
      console.error("Failed to load requests:", error);

      if (active) {
        setRequests(DEFAULT_REQUESTS);
      }
    } finally {
      if (active) {
        setRequestsLoaded(true);
      }
    }
  };

  void loadRequests();

  return () => {
    active = false;
  };
}, []);

useEffect(() => {
  if (!requestsLoaded) return;

  setRequests((previous) => {
    const existingIds = new Set(
      previous.map((request) => request.id)
    );

    const missingRequests = NEW_FAMILY_DEMO_REQUESTS.filter(
      (request) => !existingIds.has(request.id)
    );

    if (missingRequests.length === 0) {
      return previous;
    }

    return [...previous, ...missingRequests];
  });
}, [requestsLoaded]);

useEffect(() => {
  if (!requestsLoaded) return;

  const saveRequests = async () => {
    try {
      await AsyncStorage.setItem(
        REQUESTS_STORAGE_KEY,
        JSON.stringify(requests)
      );
    } catch (error) {
      console.error("Failed to save requests:", error);
    }
  };

  void saveRequests();
}, [requests, requestsLoaded]);
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

  const pendingRequests = requests
  
  .filter((request) => request.status === "Pending")
  .sort(
    (a, b) =>
      Number(b.priority === "High Priority") -
      Number(a.priority === "High Priority")
  );

  const requestHistory = requests
  .filter((request) => request.status !== "Pending")
  .sort((a, b) => {
    const timeA = a.processedAt
      ? new Date(a.processedAt).getTime()
      : 0;

    const timeB = b.processedAt
      ? new Date(b.processedAt).getTime()
      : 0;

    return timeB - timeA;
  });

const updateRequestStatus = (
  requestId: string,
  newStatus: RequestStatus
) => {
  const actionLabel =
    newStatus === "Approved"
      ? "Approve"
      : newStatus === "Declined"
      ? "Decline"
      : "Mark as Done";

  Alert.alert(
    `${actionLabel} Request`,
    `Are you sure you want to ${actionLabel.toLowerCase()} this request?`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: () => {
          setRequests((previous) =>
            previous.map((request) =>
              request.id === requestId
                ? {
                  ...request,
                  status: newStatus,
                  processedAt: new Date().toISOString(),
                }
                : request
            )
          );

          setSelectedRequest(null);
        },
      },
    ]
  );
};

const family = [
  { id: "shereen", name: "Shereen", role: "Daughter" },
  { id: "shriya", name: "Shriya", role: "Daughter" },
  { id: "artum", name: "Artum", role: "Husband" },
  { id: "richard", name: "Richard", role: "Brother" },
];

const getMemberRequests = (memberName: string): FamilyRequest[] => {
  const firstName = memberName.trim().split(" ")[0].toLowerCase();

  return requests.filter((request: FamilyRequest) => {
    const requestFirstName = request.name
      .trim()
      .split(" ")[0]
      .toLowerCase();

    return requestFirstName === firstName;
  });
};
const getFamilyRole = (name: string): string => {
  const firstName = name.trim().split(" ")[0].toLowerCase();

  const roles: Record<string, string> = {
    shereen: "Daughter",
    shriya: "Daughter",
    artum: "Husband",
    richard: "Brother",
  };

  return roles[firstName] ?? "Family Member";
};


const getRequestDisplayName = (name: string): string => {
  const normalizedName = name.trim().toLowerCase();

  const displayNames: Record<string, string> = {
    shereen: "Shereen",
    shriya: "Shriya",
    artum: "Artum",
    richard: "Richard",
  };

  return displayNames[normalizedName] ?? name;
};

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
            <Text style={styles.parentName}>Parent: {parentName}</Text>

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
        <View style={styles.requestSectionHeader}>
  <Text style={styles.sectionTitle}>Family Requests</Text>

  <View style={styles.requestTabs}>
    <Pressable
      style={[
        styles.requestTab,
        requestTab === "Pending" && styles.requestTabActive,
      ]}
      onPress={() => setRequestTab("Pending")}
    >
      <Text
        style={[
          styles.requestTabText,
          requestTab === "Pending" && styles.requestTabTextActive,
        ]}
      >
        Pending ({pendingRequests.length})
      </Text>
    </Pressable>

    <Pressable
      style={[
        styles.requestTab,
        requestTab === "History" && styles.requestTabActive,
      ]}
      onPress={() => setRequestTab("History")}
    >
      <Text
        style={[
          styles.requestTabText,
          requestTab === "History" && styles.requestTabTextActive,
        ]}
      >
        History ({requestHistory.length})
      </Text>
    </Pressable>
  </View>
</View>
        {requestsLoaded &&
  (requestTab === "Pending" ? pendingRequests : requestHistory).length === 0 && (
          <View style={styles.requestCard}>
            <Text style={styles.requestText}>
              {requestTab === "Pending"
  ? "No pending requests. You're all caught up!"
  : "No request history yet."}
            </Text>
          </View>
        )}

       {(requestTab === "Pending" ? pendingRequests : requestHistory).map((request) => {
  const isHighPriority = request.priority === "High Priority";

  return (
    <Pressable
      key={request.id}
      style={({ pressed }) => [
        styles.requestCard,
        pressed && { opacity: 0.75 },
      ]}
      onPress={() => setSelectedRequest(request)}
      accessibilityRole="button"
      accessibilityLabel={`View request from ${request.name}`}
    >
      <Text style={styles.requestText}>
        <Text style={styles.bold}>
  {getRequestDisplayName(request.name)}
</Text>{" "}
({getFamilyRole(request.name)}) is
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

      {requestTab === "History" && (
  <View style={styles.requestHistoryStatus}>
    <Ionicons
      name={
        request.status === "Declined"
          ? "close-circle"
          : "checkmark-circle"
      }
      size={15}
      color={
        request.status === "Declined"
          ? "#DC2626"
          : "#16A34A"
      }
    />

    <Text
      style={[
        styles.requestHistoryStatusText,
        {
          color:
            request.status === "Declined"
              ? "#DC2626"
              : "#16A34A",
        },
      ]}
    >
      {request.status}
    </Text>
  </View>
  
)}

{requestTab === "History" && (
  <Text style={styles.requestHistoryDate}>
    {request.processedAt
      ? new Date(request.processedAt).toLocaleString("en-PH", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "Date not recorded"}
  </Text>
)}
    </Pressable>
  );
})}


       {/* FAMILY OVERVIEW */}
<Text style={styles.sectionTitle}>Family Overview</Text>

{family.map((member) => {
  const memberRequests = getMemberRequests(member.name);

  const pendingCount = memberRequests.filter(
    (request) => request.status === "Pending"
  ).length;

  const completedCount = memberRequests.filter(
    (request) => request.status === "Completed"
  ).length;

  const statusLabel =
    pendingCount > 0
      ? `${pendingCount} Pending Request${pendingCount > 1 ? "s" : ""}`
      : completedCount > 0
      ? `${completedCount} Completed Request${completedCount > 1 ? "s" : ""}`
      : "No Pending Requests";

  const statusColor =
    pendingCount > 0
      ? "#E5A32B"
      : completedCount > 0
      ? "#39A879"
      : "#9CA3AF";

  return (
    <Pressable
      key={member.name}
      style={({ pressed }) => [
        styles.familyCard,
        pressed && { opacity: 0.75 },
      ]}
      onPress={() => setSelectedFamilyMember(member.name)}
      accessibilityRole="button"
      accessibilityLabel={`View ${member.name}'s family profile`}
    >
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
            {statusLabel}
          </Text>
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color="#E45D92"
      />
    </Pressable>
  );
})}

      </ScrollView>

      {/* REQUEST DETAILS MODAL */}
<Modal
  visible={selectedRequest !== null}
  transparent
  animationType="fade"
  onRequestClose={() => setSelectedRequest(null)}
>
  <View style={styles.requestModalOverlay}>
    <View style={styles.requestModalCard}>
      <View style={styles.requestModalHeader}>
        <Text style={styles.requestModalTitle}>
          Request Details
        </Text>

        <Pressable onPress={() => setSelectedRequest(null)}>
          <Ionicons name="close" size={24} color="#B53166" />
        </Pressable>
      </View>

      {selectedRequest && (
        <>
          <Text style={styles.requestModalName}>
            {selectedRequest.name} ({getFamilyRole(selectedRequest.name)})
          </Text>

          <Text style={styles.requestModalDescription}>
            Requesting for {selectedRequest.message}
          </Text>

          <Text style={styles.requestModalPriority}>
            {selectedRequest.priority}
          </Text>

          {selectedRequest.status === "Pending" ? (
  <>

          <Pressable
            style={styles.requestApproveButton}
            onPress={() =>
              updateRequestStatus(selectedRequest.id, "Approved")
            }
          >
            <Text style={styles.requestActionText}>
              Approve Request
            </Text>
          </Pressable>

          <Pressable
            style={styles.requestDeclineButton}
            onPress={() =>
              updateRequestStatus(selectedRequest.id, "Declined")
            }
          >
            <Text style={styles.requestDeclineText}>
              Decline Request
            </Text>
          </Pressable>

          <Pressable
            style={styles.requestDoneButton}
            onPress={() =>
              updateRequestStatus(selectedRequest.id, "Completed")
            }
          >
            <Text style={styles.requestDoneText}>
              Mark as Done
            </Text>
          </Pressable>

            </>
            ) : (
              <Text style={styles.requestHistoryMessage}>
                This request has been {selectedRequest.status.toLowerCase()}.
              </Text>
            )}
        </>
      )}
    </View>
  </View>
</Modal>

{/* FAMILY MEMBER PROFILE MODAL */}
<Modal
  visible={selectedFamilyMember !== null}
  transparent
  animationType="fade"
  onRequestClose={() => setSelectedFamilyMember(null)}
>
  <View style={styles.familyModalOverlay}>
    <View style={styles.familyModalCard}>
      <View style={styles.familyModalHeader}>
        <Text style={styles.familyModalTitle}>
          Family Profile
        </Text>

        <Pressable onPress={() => setSelectedFamilyMember(null)}>
          <Ionicons name="close" size={24} color="#B53166" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.familyModalName}>
          {selectedFamilyMember}
        </Text>

        <Text style={styles.familyModalSubtitle}>
          {family.find((member) => member.name === selectedFamilyMember)?.role ?? "Family Member"}
        </Text>

        <Text style={styles.familyModalSubtitle}>
        Pending Requests:{" "}
        {selectedFamilyMember
          ? getMemberRequests(selectedFamilyMember).filter(
              (request) => request.status === "Pending"
            ).length
          : 0}
      </Text>

        <Text style={styles.familyModalSectionTitle}>
          Pending Requests
        </Text>
{getMemberRequests(selectedFamilyMember ?? "")
  .filter((request) => request.status === "Pending")
  .length === 0 ? (
    <Text style={styles.familyModalEmpty}>
      No pending requests.
    </Text>
  ) : (
    getMemberRequests(selectedFamilyMember ?? "")
      .filter((request) => request.status === "Pending")
      .map((request) => (
              <View key={request.id} style={styles.familyModalRequest}>
                <Text style={styles.familyModalRequestText}>
                  {request.message}
                </Text>
                <Text style={styles.familyModalRequestStatus}>
                  {request.priority} • Pending
                </Text>
              </View>
            ))
        )}

        <Text style={styles.familyModalSectionTitle}>
          Request History
        </Text>

        {requests.filter(
          (request) =>
            request.status !== "Pending" &&
            request.name.trim().toLowerCase() ===
              selectedFamilyMember?.split(" ")[0].toLowerCase()
        ).length === 0 ? (
          <Text style={styles.familyModalEmpty}>
            No request history yet.
          </Text>
        ) : (
          requests
            .filter(
              (request) =>
                request.status !== "Pending" &&
                request.name.trim().toLowerCase() ===
                  selectedFamilyMember?.split(" ")[0].toLowerCase()
            )
            .map((request) => (
              <View key={request.id} style={styles.familyModalRequest}>
                <Text style={styles.familyModalRequestText}>
                  {request.message}
                </Text>

                <Text style={styles.familyModalRequestStatus}>
                  {request.status}
                </Text>

                <Text style={styles.familyModalDate}>
                  {request.processedAt
                    ? new Date(request.processedAt).toLocaleString("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "Date not recorded"}
                </Text>
              </View>
            ))
        )}
      </ScrollView>
    </View>
  </View>
</Modal>

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

requestModalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.45)",
  justifyContent: "center",
  paddingHorizontal: 24,
},

requestModalCard: {
  backgroundColor: "#FFF8FB",
  borderRadius: 20,
  padding: 22,
},

requestModalHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
},

requestModalTitle: {
  fontSize: 19,
  fontWeight: "700",
  color: "#49303C",
},

requestModalName: {
  fontSize: 16,
  fontWeight: "700",
  color: "#49303C",
  marginBottom: 8,
},

requestModalDescription: {
  fontSize: 14,
  color: "#775465",
  marginBottom: 12,
},

requestModalPriority: {
  fontSize: 12,
  fontWeight: "700",
  color: "#B53166",
  marginBottom: 22,
},

requestApproveButton: {
  backgroundColor: "#B53166",
  paddingVertical: 13,
  borderRadius: 12,
  alignItems: "center",
  marginBottom: 10,
},

requestActionText: {
  color: "#FFFFFF",
  fontWeight: "700",
  fontSize: 14,
},

requestDeclineButton: {
  borderWidth: 1,
  borderColor: "#B53166",
  paddingVertical: 13,
  borderRadius: 12,
  alignItems: "center",
  marginBottom: 10,
},

requestDeclineText: {
  color: "#B53166",
  fontWeight: "700",
  fontSize: 14,
},

requestDoneButton: {
  backgroundColor: "#FFE4EC",
  paddingVertical: 13,
  borderRadius: 12,
  alignItems: "center",
},

requestDoneText: {
  color: "#B53166",
  fontWeight: "700",
  fontSize: 14,
},

requestSectionHeader: {
  marginTop: 8,
},

requestTabs: {
  flexDirection: "row",
  backgroundColor: "#FCE4ED",
  borderRadius: 12,
  padding: 4,
  marginBottom: 12,
},

requestTab: {
  flex: 1,
  paddingVertical: 10,
  alignItems: "center",
  borderRadius: 9,
},

requestTabActive: {
  backgroundColor: "#B53166",
},

requestTabText: {
  fontSize: 12,
  fontWeight: "700",
  color: "#B53166",
},

requestTabTextActive: {
  color: "#FFFFFF",
},

requestHistoryStatus: {
  flexDirection: "row",
  alignItems: "center",
  gap: 5,
  marginTop: 8,
},

requestHistoryStatusText: {
  fontSize: 11,
  fontWeight: "700",
},

requestHistoryMessage: {
  fontSize: 13,
  color: "#775465",
  textAlign: "center",
  paddingVertical: 15,
},

requestHistoryDate: {
  fontSize: 10,
  color: "#9F4268",
  marginTop: 5,
},

familyModalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.45)",
  justifyContent: "center",
  padding: 22,
},

familyModalCard: {
  backgroundColor: "#FFFFFF",
  borderRadius: 20,
  padding: 20,
  maxHeight: "80%",
},

familyModalHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
},

familyModalTitle: {
  fontSize: 18,
  fontWeight: "700",
  color: "#B53166",
},

familyModalName: {
  fontSize: 20,
  fontWeight: "700",
  color: "#49303C",
  marginBottom: 6,
},

familyModalSubtitle: {
  fontSize: 13,
  color: "#775465",
  marginBottom: 18,
},

familyModalSectionTitle: {
  fontSize: 15,
  fontWeight: "700",
  color: "#B53166",
  marginTop: 12,
  marginBottom: 10,
},

familyModalEmpty: {
  fontSize: 12,
  color: "#999999",
  marginBottom: 10,
},

familyModalRequest: {
  backgroundColor: "#FFF1F6",
  borderRadius: 12,
  padding: 12,
  marginBottom: 9,
},

familyModalRequestText: {
  fontSize: 13,
  fontWeight: "600",
  color: "#49303C",
},

familyModalRequestStatus: {
  fontSize: 11,
  color: "#B53166",
  marginTop: 5,
},

familyModalDate: {
  fontSize: 10,
  color: "#775465",
  marginTop: 5,
},
});