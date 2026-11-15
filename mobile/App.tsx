import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, View } from "react-native";

import SplashScreen from "./src/screens/SplashScreen";
import LoginScreen from "./src/screens/LoginScreen";
import CreateAccountScreen from "./src/screens/CreateAccountScreen";
import RoleSelectionScreen from "./src/screens/RoleSelectionScreen";
import LoadingScreen from "./src/screens/LoadingScreen";
import ParentHomeScreen from "./src/screens/ParentHomeScreen";
import ParentTasksScreen from "./src/screens/ParentTasksScreen";
import ParentFocusScreen from "./src/screens/ParentFocusScreen";
import ParentMessagesScreen from "./src/screens/ParentMessagesScreen";
import ParentNotificationsScreen from "./src/screens/ParentNotificationsScreen";
import ParentNotificationSettingsScreen from "./src/screens/ParentNotificationSettingsScreen";
import ParentProfileScreen from "./src/screens/ParentProfileScreen";
import ParentSettingsScreen from "./src/screens/ParentSettingsScreen";
import AboutQuietCueScreen from "./src/screens/AboutQuietCueScreen";
import ParentPrivacySecurityScreen from "./src/screens/ParentPrivacySecurityScreen";

type Screen =
  | "splash"
  | "login"
  | "register"
  | "role"
  | "loading"
  | "parentHome"
  | "parentTasks"
  | "parentFocus"
  | "parentMessages"
  | "parentNotifications"
  | "parentNotificationSettings"
  | "parentProfile"
  | "parentSettings"
  | "aboutQuietCue"
  | "parentPrivacySecurity";

type Role = "parent" | "family" | "child";
const SESSION_KEY = "@quietcue_dev_session";
const DEMO_ACCOUNT_KEY = "@quietcue_demo_account_v1";

const SELECTED_FOCUS_TASK_KEY = "@quietcue_selected_focus_task";

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [pendingAccount, setPendingAccount] = useState<{
  fullName: string;
  email: string;
} | null>(null);

  const [notificationSettingsSource, setNotificationSettingsSource] =
  useState<"parentHome" | "parentNotifications">("parentNotifications");

  const [selectedFocusTask, setSelectedFocusTask] = useState<{
  id: number;
  title: string;
} | null>(null);

useEffect(() => {
  const loadSelectedFocusTask = async () => {
    try {
      const savedTask = await AsyncStorage.getItem(
        SELECTED_FOCUS_TASK_KEY
      );

      if (savedTask) {
        const parsedTask = JSON.parse(savedTask);

        if (
          typeof parsedTask.id === "number" &&
          typeof parsedTask.title === "string"
        ) {
          setSelectedFocusTask(parsedTask);
        }
      }
    } catch (error) {
      console.error("Failed to load selected focus task:", error);
    }
  };

  loadSelectedFocusTask();
}, []);

  const [checkingSession, setCheckingSession] = useState(true);

  

useEffect(() => {
  const checkSession = async () => {
    try {
      const savedSession = await AsyncStorage.getItem(SESSION_KEY);

      if (savedSession === "parent") {
        setScreen("parentHome");
      }
    } catch (error) {
      console.error("Failed to check session:", error);
    } finally {
      setCheckingSession(false);
    }
  };

  checkSession();
}, []);

  const hasContinued = useRef(false);

  const handleSplashContinue = () => {
    if (hasContinued.current) return;

    hasContinued.current = true;
    setScreen("login");
  };

  if (checkingSession) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#FFF8FB",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator size="large" color="#D45A88" />
    </View>
  );
}

  // SPLASH SCREEN
  if (screen === "splash") {
    return <SplashScreen onContinue={handleSplashContinue} />;
  }

  // CREATE ACCOUNT SCREEN
  if (screen === "register") {
    return (
      <CreateAccountScreen
        onBack={() => setScreen("login")}
        onContinue={(account) => {
          setPendingAccount(account);
          setScreen("role");
        }}
      />
    );
  }

  // ROLE SELECTION SCREEN
  if (screen === "role") {
    return (
      <RoleSelectionScreen
      onBack={() => setScreen("register")}
       onContinue={async (role: Role) => {
  if (role !== "parent") {
    Alert.alert(
      "QuietCue",
      `${role} dashboard will be added next.`
    );
    return;
  }

  if (!pendingAccount) {
    Alert.alert(
      "Missing Account",
      "Please complete the Create Account form first."
    );
    setScreen("register");
    return;
  }

  try {
    const demoAccount = {
      fullName: pendingAccount.fullName,
      email: pendingAccount.email,
      role: role,
    };

    await AsyncStorage.setItem(
      DEMO_ACCOUNT_KEY,
      JSON.stringify(demoAccount)
    );

    setPendingAccount(null);
    setScreen("loading");
  } catch (error) {
    console.error("Failed to save demo account:", error);
    Alert.alert(
      "Error",
      "Unable to save your demo account."
    );
  }
}}
      />
    );
  }

  // LOADING SCREEN
if (screen === "loading") {
  return (
    <LoadingScreen
      onFinish={async () => {
        try {
          await AsyncStorage.setItem(SESSION_KEY, "parent");
        } catch (error) {
          console.error("Failed to save session:", error);
        }

        setScreen("parentHome");
      }}
    />
  );
}

    // PARENT HOME DASHBOARD
      if (screen === "parentHome") {
        return (
          <>
            <StatusBar style="dark" />
            <ParentHomeScreen
            onTasksPress={() => setScreen("parentTasks")}
            onFocusPress={() => setScreen("parentFocus")}
            onMessagesPress={() => setScreen("parentMessages")}
            onNotificationsPress={() => setScreen("parentNotifications")}
            onNotificationSettingsPress={() => {
  setNotificationSettingsSource("parentHome");
  setScreen("parentNotificationSettings");
}}
onProfilePress={() => setScreen("parentProfile")}
onAppSettingsPress={() => setScreen("parentSettings")}

onAboutPress={() => setScreen("aboutQuietCue")}
onPrivacyPress={() => setScreen("parentPrivacySecurity")}

onLogout={async () => {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
    setScreen("login");
  } catch (error) {
    console.error("Logout failed:", error);
    Alert.alert("Error", "Unable to log out.");
  }
}}

/>
                
          </>
        );
      }

        // PARENT PROFILE SCREEN
  if (screen === "parentProfile") {
    return (
      <ParentProfileScreen
        onBack={() => setScreen("parentHome")}
      />
    );
  }

    // PARENT APP SETTINGS SCREEN
if (screen === "parentSettings") {
  return (
    <ParentSettingsScreen
      onBack={() => setScreen("parentHome")}
      onProfilePress={() => setScreen("parentProfile")}
      onNotificationSettingsPress={() =>
        setScreen("parentNotificationSettings")
      }
    />
  );
}

// ABOUT QUIETCUE SCREEN
if (screen === "aboutQuietCue") {
  return (
    <AboutQuietCueScreen
      onBack={() => setScreen("parentHome")}
    />
  );
}

if (screen === "parentPrivacySecurity") {
  return (
    <ParentPrivacySecurityScreen
      onBack={() => setScreen("parentHome")}
    />
  );
}

    // PARENT TASKS SCREEN
    if (screen === "parentTasks") {
      return (
        <>
          <StatusBar style="dark" />
          <ParentTasksScreen
          onBack={() => setScreen("parentHome")}
          onFocusTabPress={() => setScreen("parentFocus")}
          onMessagesPress={() => setScreen("parentMessages")}
          onFocusPress={async (taskId, taskTitle) => {
  const selectedTask = {
    id: taskId,
    title: taskTitle,
  };

  setSelectedFocusTask(selectedTask);

  try {
    await AsyncStorage.setItem(
      SELECTED_FOCUS_TASK_KEY,
      JSON.stringify(selectedTask)
    );
  } catch (error) {
    console.error("Failed to save selected focus task:", error);
  }

  setScreen("parentFocus");
}}

onTaskDeleted={async (taskId) => {
  if (selectedFocusTask?.id === taskId) {
    setSelectedFocusTask(null);

    try {
      await AsyncStorage.removeItem(SELECTED_FOCUS_TASK_KEY);
    } catch (error) {
      console.error("Failed to clear selected focus task:", error);
    }
  }
}}
        />
        </>
      );
    }

 // PARENT FOCUS SCREEN
  if (screen === "parentFocus") {
    return (
      <>
        <StatusBar style="dark" />
       <ParentFocusScreen
        onHomePress={() => setScreen("parentHome")}
        onTasksPress={() => setScreen("parentTasks")}
        onMessagesPress={() => setScreen("parentMessages")}
        selectedTaskTitle={selectedFocusTask?.title ?? null}
      />
      </>
    );
  }

  // PARENT MESSAGES SCREEN
  if (screen === "parentMessages") {
    return (
      <>
        <StatusBar style="dark" />
        <ParentMessagesScreen
          onHomePress={() => setScreen("parentHome")}
          onTasksPress={() => setScreen("parentTasks")}
          onFocusPress={() => setScreen("parentFocus")}
        />
      </>
    );
  }

   // PARENT NOTIFICATIONS SCREEN
  if (screen === "parentNotifications") {
    return (
      <>
        <StatusBar style="dark" />
        <ParentNotificationsScreen
          onBack={() => setScreen("parentHome")}
          onSettingsPress={() => {
            setNotificationSettingsSource("parentNotifications");
            setScreen("parentNotificationSettings");
          }}
        />
      </>
    );
  }

  // PARENT NOTIFICATION SETTINGS SCREEN
  if (screen === "parentNotificationSettings") {
    return (
      <>
        <StatusBar style="dark" />
        <ParentNotificationSettingsScreen
          onBack={() => setScreen(notificationSettingsSource)}
        />
      </>
    );
  }

    // LOGIN SCREEN
    return (
      <LoginScreen
        onSignUp={() => setScreen("register")}
        onLogin={async () => {
          try {
            await AsyncStorage.setItem(SESSION_KEY, "parent");
            setScreen("parentHome");
          } catch (error) {
            console.error("Login failed:", error);
            Alert.alert(
              "Error",
              "Unable to save your session. Please try again."
            );
          }
        }}
      />
    );
    }