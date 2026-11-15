
import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  onBack: () => void;
};

export default function AboutQuietCueScreen({ onBack }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityLabel="Back to Settings"
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>About QuietCue</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brandCard}>
          <Image
            source={require("../../assets/QQ LOGO.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>QuietCue</Text>
          <Text style={styles.tagline}>
            Stay connected. Respect focus.
          </Text>
          <Text style={styles.version}>Version 1.0.0 (Demo)</Text>
        </View>

        <Text style={styles.sectionTitle}>About the App</Text>
        <Text style={styles.paragraph}>
          QuietCue is a family-focused mobile application
          designed to help parents and children communicate
          while respecting each other's time and availability.
          It provides a simple way to manage daily tasks,
          focus sessions, and family requests.
        </Text>

        <Text style={styles.sectionTitle}>Key Features</Text>

        {[
          ["checkbox-outline", "Task Management",
            "Organize and track daily responsibilities."],
          ["timer-outline", "Focus Sessions",
            "Support focused time and reduce interruptions."],
          ["chatbubble-outline", "Family Communication",
            "Help family members stay connected."],
          ["time-outline", "Availability Status",
            "Show when a family member is available or busy."],
          ["notifications-outline", "Notifications",
            "Manage alerts and important updates."],
        ].map(([icon, title, description]) => (
          <View key={title} style={styles.featureRow}>
            <Ionicons
              name={icon as React.ComponentProps<
                typeof Ionicons
              >["name"]}
              size={23}
              color="#B53166"
            />
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>{title}</Text>
              <Text style={styles.featureDescription}>
                {description}
              </Text>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Development Information</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Application: QuietCue
          </Text>
          <Text style={styles.infoText}>
            Platform: Mobile Application
          </Text>
          <Text style={styles.infoText}>
            Status: Academic Prototype / Demo
          </Text>
        </View>

        <Text style={styles.footer}>
          Made with care for better family communication.
        </Text>
      </ScrollView>
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
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    paddingHorizontal: 20,
    paddingVertical: 22,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
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
  brandCard: {
    backgroundColor: "#FFE5EE",
    borderRadius: 20,
    alignItems: "center",
    padding: 25,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  appName: {
    fontSize: 25,
    fontWeight: "700",
    color: "#B53166",
    marginTop: 10,
  },
  tagline: {
    fontSize: 13,
    color: "#49303C",
    marginTop: 5,
  },
  version: {
    fontSize: 11,
    color: "#826B75",
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#B53166",
    marginTop: 25,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 13,
    color: "#49303C",
    lineHeight: 22,
  },
  featureRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F5DCE6",
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#49303C",
  },
  featureDescription: {
    fontSize: 11,
    color: "#826B75",
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: "#FFE5EE",
    padding: 16,
    borderRadius: 14,
    gap: 9,
  },
  infoText: {
    fontSize: 12,
    color: "#49303C",
  },
  footer: {
    textAlign: "center",
    fontSize: 11,
    color: "#826B75",
    marginTop: 30,
  },
});
