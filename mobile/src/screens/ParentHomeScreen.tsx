
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
} from "react-native";

export default function ParentHomeScreen() {
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
      <StatusBar barStyle="light-content" />

      {/* FIXED HEADER */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandSymbol}>◎</Text>
          </View>

          <Text style={styles.headerTitle}>Quiet Cue</Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={() =>
              Alert.alert(
                "Notifications",
                "Notifications will be added soon."
              )
            }
          >
            <Text style={styles.headerIcon}>♟</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              Alert.alert("Menu", "Menu options will be added soon.")
            }
          >
            <Text style={styles.headerIcon}>☰</Text>
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

          <View>
            <Text style={styles.parentName}>Parent: Taylor Swift</Text>
            <Text style={styles.statusText}>
              🔴 Busy | Available at 6:00 PM
            </Text>
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

            <Pressable style={styles.startButton}>
              <Text style={styles.startButtonText}>Start Session</Text>
            </Pressable>
          </View>

          <View style={styles.tasksCard}>
            <Text style={styles.cardTitle}>Today's Tasks</Text>

            {tasks.map((task, index) => (
              <Text key={index} style={styles.taskText}>
                ☑ {task}
              </Text>
            ))}

            <Text style={styles.viewAll}>View All</Text>
          </View>
        </View>

        {/* PENDING REQUESTS */}
        <Text style={styles.sectionTitle}>Pending Requests</Text>

        {requests.map((request, index) => (
          <View key={index} style={styles.requestCard}>
            <Text style={styles.requestText}>
              <Text style={styles.bold}>{request.name}</Text> (Daughter) is
              requesting for {request.message}
            </Text>

            <Text style={styles.priority}>{request.priority}</Text>
          </View>
        ))}

        {/* FAMILY OVERVIEW */}
        <Text style={styles.sectionTitle}>Family Overview</Text>

        {family.map((member, index) => (
          <View key={index} style={styles.familyCard}>
            <View style={styles.familyAvatar}>
              <Text>👩</Text>
            </View>

            <View style={styles.familyInfo}>
              <Text style={styles.familyName}>{member.name}</Text>
              <Text style={styles.familyStatus}>
                Status: {member.status}
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </View>
        ))}
      </ScrollView>

      {/* FIXED BOTTOM NAVIGATION */}
      <View style={styles.bottomBar}>
        <Text style={styles.navItem}>⌂{"\n"}Home</Text>
        <Text style={styles.navItem}>▤{"\n"}Tasks</Text>
        <Text style={styles.navItem}>◷{"\n"}Focus</Text>
        <Text style={styles.navItem}>✉{"\n"}Messages</Text>
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

  brandIcon: {
    width: 23,
    height: 23,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  brandSymbol: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },

  headerActions: {
    flexDirection: "row",
    gap: 16,
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
    borderRadius: 15,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  avatar: {
    width: 46,
    height: 46,
    backgroundColor: "#FFFFFF",
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  avatarText: {
    fontSize: 27,
  },

  parentName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#49303C",
  },

  statusText: {
    fontSize: 10,
    color: "#663E50",
    marginTop: 5,
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
    borderRadius: 20,
    paddingVertical: 8,
    marginTop: 8,
    alignItems: "center",
  },

  startButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },

  taskText: {
    fontSize: 9,
    color: "#593E4B",
    marginBottom: 7,
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

  priority: {
    fontSize: 9,
    color: "#C82E59",
    marginTop: 4,
    fontWeight: "600",
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

  familyStatus: {
    fontSize: 10,
    color: "#74636A",
    marginTop: 3,
  },

  arrow: {
    color: "#E45D92",
    fontSize: 26,
  },

  bottomBar: {
    backgroundColor: "#DB6795",
    paddingVertical: 13,
    paddingHorizontal: 25,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  navItem: {
    color: "#FFFFFF",
    fontSize: 13,
    textAlign: "center",
  },
});