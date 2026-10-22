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

type Screen =
  | "splash"
  | "login"
  | "register"
  | "role"
  | "loading"
  | "parentHome"
  | "parentTasks";

type Role = "parent" | "family" | "child";
const SESSION_KEY = "@quietcue_dev_session";

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");

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
        onContinue={() => setScreen("role")}
      />
    );
  }

  // ROLE SELECTION SCREEN
  if (screen === "role") {
    return (
      <RoleSelectionScreen
        onBack={() => setScreen("register")}
        onContinue={(role: Role) => {
          if (role === "parent") {
            setScreen("loading");
          } else {
            Alert.alert(
              "QuietCue",
              `${role} dashboard will be added next.`
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

    // PARENT TASKS SCREEN
    if (screen === "parentTasks") {
      return (
        <>
          <StatusBar style="dark" />
          <ParentTasksScreen
            onBack={() => setScreen("parentHome")}
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