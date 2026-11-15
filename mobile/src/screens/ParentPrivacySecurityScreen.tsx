
import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  onBack: () => void;
};

export default function ParentPrivacySecurityScreen({
  onBack,
}: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>
          Privacy & Security
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.introCard}>
          <Ionicons
            name="shield-checkmark-outline"
            size={42}
            color="#B53166"
          />
          <Text style={styles.introTitle}>
            Your Privacy Matters
          </Text>
          <Text style={styles.description}>
            Manage your privacy preferences and learn
            how QuietCue is intended to protect family
            information.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          Account Security
        </Text>

        <View style={styles.card}>
          <Text style={styles.itemTitle}>
            Password & Authentication
          </Text>
          <Text style={styles.itemDescription}>
            Secure account authentication is planned
            for a future version.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          Data & Privacy
        </Text>

        <View style={styles.card}>
          <Text style={styles.itemTitle}>
            Stored Information
          </Text>
          <Text style={styles.itemDescription}>
            This prototype stores certain demo
            information locally on your device.
            It is not yet a production-ready
            security system.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.itemTitle}>
            Privacy Controls
          </Text>
          <Text style={styles.itemDescription}>
            Additional privacy controls will be
            developed in future versions.
          </Text>
        </View>

        <Text style={styles.footer}>
          QuietCue — Academic Prototype
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
  introCard: {
    backgroundColor: "#FFE5EE",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  introTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#B53166",
    marginTop: 10,
  },
  description: {
    fontSize: 13,
    color: "#49303C",
    textAlign: "center",
    lineHeight: 21,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#B53166",
    marginTop: 25,
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F5DCE6",
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#49303C",
  },
  itemDescription: {
    fontSize: 12,
    color: "#826B75",
    lineHeight: 19,
    marginTop: 6,
  },
  footer: {
    textAlign: "center",
    fontSize: 11,
    color: "#826B75",
    marginTop: 30,
  },
});