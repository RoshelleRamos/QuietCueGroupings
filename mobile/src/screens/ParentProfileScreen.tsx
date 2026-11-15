
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Alert,
  TextInput,
} from "react-native"; 

import { Ionicons } from "@expo/vector-icons";

type Props = {
  onBack: () => void;
};

export default function ParentProfileScreen({ onBack }: Props) {


const PROFILE_KEY = "@quietcue_parent_profile_v1";
const DEMO_ACCOUNT_KEY = "@quietcue_demo_account_v1";

const [fullName, setFullName] = useState("");
const [email, setEmail] = useState("");
const [role, setRole] = useState("parent");
const [availability, setAvailability] = useState("Available");
const [availableAt, setAvailableAt] = useState("");
const [draftAvailableAt, setDraftAvailableAt] = useState("");
const [selectedHour, setSelectedHour] = useState("6");
const [selectedMinute, setSelectedMinute] = useState("00");
const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">("PM");
const [isEditing, setIsEditing] = useState(false);

const [draftName, setDraftName] = useState("Taylor Swift");
const [draftAvailability, setDraftAvailability] = useState("Busy");

useEffect(() => {
  const loadProfile = async () => {
    try {
      const savedAccount = await AsyncStorage.getItem(
        DEMO_ACCOUNT_KEY
      );

      const savedProfile = await AsyncStorage.getItem(
        PROFILE_KEY
      );

      const account = savedAccount
        ? JSON.parse(savedAccount)
        : null;

      const profile = savedProfile
        ? JSON.parse(savedProfile)
        : null;

      if (account) {
        setFullName(account.fullName ?? "");
        setEmail(account.email ?? "");
        setRole(account.role ?? "parent");
      } else {
        setFullName(profile?.fullName ?? "");
        setEmail("");
        setRole("parent");
      }

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
    PROFILE_KEY,
    JSON.stringify(updatedProfile)
  );

  setAvailability("Available");
  setAvailableAt("");
} else {
  setAvailability(profile?.availability ?? "Available");
  setAvailableAt(profile?.availableAt ?? "");
}
    } catch (error) {
      console.error("Failed to load profile:", error);
      Alert.alert("Error", "Unable to load your profile.");
    }
  };

  void loadProfile();
}, []);

const startEditing = () => {
  setDraftName(fullName);
  setDraftAvailability(availability);
  setDraftAvailableAt(availableAt);
  const match = availableAt.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);

if (match) {
  setSelectedHour(match[1]);
  setSelectedMinute(match[2]);
  setSelectedPeriod(match[3] as "AM" | "PM");
}
  setIsEditing(true);
};

const saveProfile = async () => {
  const name = draftName.trim();

  if (!name) {
    Alert.alert("Invalid Name", "Please enter your full name.");
    return;
  }

  try {
    const savedAccount = await AsyncStorage.getItem(
      DEMO_ACCOUNT_KEY
    );

    if (!savedAccount) {
      Alert.alert("Error", "No registered demo account found.");
      return;
    }

    const account = JSON.parse(savedAccount);

    const updatedAccount = {
      ...account,
      fullName: name,
    };

    await AsyncStorage.setItem(
      DEMO_ACCOUNT_KEY,
      JSON.stringify(updatedAccount)
    );

    const time =
        draftAvailability === "Available"
            ? ""
            : `${selectedHour}:${selectedMinute} ${selectedPeriod}`;

        await AsyncStorage.setItem(
        PROFILE_KEY,
        JSON.stringify({
            fullName: name,
            availability: draftAvailability,
            availableAt: time,
        })
        );

    setFullName(name);
    setAvailability(draftAvailability);
    setAvailableAt(time);
    setDraftAvailableAt(time);
    setIsEditing(false);

    Alert.alert("Success", "Profile updated successfully!");
  } catch (error) {
    console.error("Failed to save profile:", error);
    Alert.alert("Error", "Unable to save your profile.");
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Ionicons name="arrow-back" size={25} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={42} color="#B53166" />
          </View>
          <Text style={styles.name}>{fullName || "No Name"}</Text>
            <Text style={styles.role}>
            {role.charAt(0).toUpperCase() + role.slice(1)} Account
            </Text>
        </View>

        <View style={styles.infoCard}>
            <Text style={styles.label}>Full Name</Text>
            <Text style={styles.value}>
                {fullName || "Not provided"}
            </Text>

            <Text style={styles.label}>Email Address</Text>
            <Text style={styles.value}>
                {email || "Not provided"}
            </Text>

            <Text style={styles.label}>Account Role</Text>
            <Text style={styles.value}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
            </Text>

            <Text style={styles.label}>Availability</Text>
            <Text style={styles.value}>
            {availability}
            {availability !== "Available" && availableAt
                ? ` | Available at ${availableAt}`
                : ""}
            </Text>
            </View>

        
{isEditing ? (
  <View style={{ gap: 14 }}>
    <Text style={styles.label}>Full Name</Text>

    <TextInput
      value={draftName}
      onChangeText={setDraftName}
      placeholder="Enter your full name"
      style={{
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#F4B7CD",
        borderRadius: 10,
        padding: 14,
        fontSize: 16,
        color: "#49303C",
      }}
    />

    <Text style={styles.label}>Availability</Text>

    {["Busy", "Available", "On Break"].map((status) => (
      <Pressable
        key={status}
        onPress={() => setDraftAvailability(status)}
        style={{
          padding: 12,
          borderRadius: 10,
          backgroundColor:
            draftAvailability === status ? "#F5A5C2" : "#FFFFFF",
          borderWidth: 1,
          borderColor: "#F4B7CD",
        }}
      >
        <Text style={{ color: "#49303C", fontWeight: "600" }}>
          {draftAvailability === status ? "● " : "○ "}
          {status}
        </Text>
      </Pressable>
    ))}


{draftAvailability !== "Available" && (
  <View style={{ gap: 10 }}>
    <Text style={styles.label}>Available Again At</Text>

    <Text style={{ color: "#49303C", fontSize: 14 }}>
      {selectedHour}:{selectedMinute} {selectedPeriod}
    </Text>

    <Text style={styles.label}>Hour</Text>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
      {Array.from({ length: 12 }, (_, i) => String(i + 1)).map(
        (hour) => (
          <Pressable
            key={hour}
            onPress={() => setSelectedHour(hour)}
            style={{
              padding: 10,
              borderRadius: 8,
              backgroundColor:
                selectedHour === hour ? "#F5A5C2" : "#FFFFFF",
            }}
          >
            <Text style={{ color: "#49303C" }}>{hour}</Text>
          </Pressable>
        )
      )}
    </View>

    <Text style={styles.label}>Minute</Text>
    <View style={{ flexDirection: "row", gap: 8 }}>
      {["00", "15", "30", "45"].map((minute) => (
        <Pressable
          key={minute}
          onPress={() => setSelectedMinute(minute)}
          style={{
            padding: 12,
            borderRadius: 8,
            backgroundColor:
              selectedMinute === minute ? "#F5A5C2" : "#FFFFFF",
          }}
        >
          <Text style={{ color: "#49303C" }}>{minute}</Text>
        </Pressable>
      ))}
    </View>

    <Text style={styles.label}>AM / PM</Text>
    <View style={{ flexDirection: "row", gap: 8 }}>
      {(["AM", "PM"] as const).map((period) => (
        <Pressable
          key={period}
          onPress={() => setSelectedPeriod(period)}
          style={{
            padding: 12,
            borderRadius: 8,
            backgroundColor:
              selectedPeriod === period ? "#F5A5C2" : "#FFFFFF",
          }}
        >
          <Text style={{ color: "#49303C" }}>{period}</Text>
        </Pressable>
      ))}
    </View>
  </View>
)}

    <Pressable style={styles.editButton} onPress={saveProfile}>
      <Text style={styles.editText}>Save Changes</Text>
    </Pressable>

    <Pressable
      onPress={() => setIsEditing(false)}
      style={{ alignItems: "center", padding: 12 }}
    >
      <Text style={{ color: "#B53166", fontWeight: "600" }}>
        Cancel
      </Text>
    </Pressable>
  </View>
) : (
  <Pressable style={styles.editButton} onPress={startEditing}>
    <Ionicons name="create-outline" size={19} color="#FFFFFF" />
    <Text style={styles.editText}>Edit Profile</Text>
  </Pressable>
)}
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
    paddingHorizontal: 20,
    paddingVertical: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  content: {
    padding: 18,
    gap: 18,
  },
  profileCard: {
    backgroundColor: "#F5A5C2",
    padding: 25,
    borderRadius: 18,
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  name: {
    fontSize: 21,
    fontWeight: "700",
    color: "#49303C",
  },
  role: {
    color: "#663E50",
    marginTop: 5,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
  },
  label: {
    fontSize: 12,
    color: "#9F4268",
    marginTop: 12,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: "#49303C",
    marginTop: 4,
  },
  editButton: {
    backgroundColor: "#B53166",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    opacity: 0.65,
  },
  editText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});