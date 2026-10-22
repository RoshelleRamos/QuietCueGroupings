
import React from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  onTasksPress: () => void;
  onLogout: () => void;
};

export default function ParentHomeScreen({
  onTasksPress,
  onLogout,
}: Props) {
    
  const tasks = [
    "Project for AppDev",
    "Client layout",
    "Research Paper C-1",
    "Research Paper C-2",
    "GitHub Account",
  ];

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
      onPress={() =>
        Alert.alert(
          "Notifications",
          "Notifications will be added soon."
        )
      }
    >
      <Ionicons
        name="notifications-outline"
        size={25}
        color="#FFFFFF"
      />
    </Pressable>

    <Pressable
      accessibilityLabel="Menu"
      onPress={() =>
        Alert.alert(
            "QuietCue Menu",
            "What would you like to do?",
            [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                style: "destructive",
                onPress: onLogout,
            },
            ]
        )
        }
    >
      <Ionicons
        name="menu-outline"
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
            <View style={styles.busyDot} />
            <Text style={styles.statusText}>
                Busy  |  Available at 6:00 PM
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
                onPress={() =>
                    Alert.alert(
                    "Focus Session",
                    "Pomodoro focus timer will be available soon."
                    )
                }
                >
                <Ionicons name="play-circle-outline" size={17} color="#FFFFFF" />
                <Text style={styles.startButtonText}>Start Session</Text>
                </Pressable>
          </View>

            <View style={styles.tasksCard}>
            <Text style={styles.cardTitle}>Today's Tasks</Text>

            {tasks.map((task, index) => (
                <View key={index} style={styles.taskRow}>
                <Ionicons
                    name="checkbox-outline"
                    size={14}
                    color="#B53166"
                />

                <Text style={styles.taskText}>{task}</Text>
                </View>
            ))}

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
    onPress={() =>
      Alert.alert("Focus", "Focus screen coming soon.")
    }
  >
    <Ionicons name="timer-outline" size={23} color="#FFFFFF" />
    <Text style={styles.navText}>Focus</Text>
  </Pressable>

  {/* MESSAGES */}
  <Pressable
    style={styles.navButton}
    onPress={() =>
      Alert.alert("Messages", "Messages screen coming soon.")
    }
  >
    <Ionicons name="chatbubble-outline" size={23} color="#FFFFFF" />
    <Text style={styles.navText}>Messages</Text>
  </Pressable>

</View>

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