import React, { useRef, useState } from "react";
import { Alert } from "react-native";

import SplashScreen from "./src/screens/SplashScreen";
import LoginScreen from "./src/screens/LoginScreen";
import CreateAccountScreen from "./src/screens/CreateAccountScreen";
import RoleSelectionScreen from "./src/screens/RoleSelectionScreen";
import LoadingScreen from "./src/screens/LoadingScreen";
import ParentHomeScreen from "./src/screens/ParentHomeScreen";

type Screen =
  | "splash"
  | "login"
  | "register"
  | "role"
  | "loading"
  | "parentHome";

type Role = "parent" | "family" | "child";

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");

  const hasContinued = useRef(false);

  const handleSplashContinue = () => {
    if (hasContinued.current) return;

    hasContinued.current = true;
    setScreen("login");
  };

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
        onFinish={() => setScreen("parentHome")}
      />
    );
  }

  // PARENT HOME DASHBOARD
  if (screen === "parentHome") {
    return <ParentHomeScreen />;
  }

  // LOGIN SCREEN
  return (
    <LoginScreen
      onSignUp={() => setScreen("register")}
    />
  );
}