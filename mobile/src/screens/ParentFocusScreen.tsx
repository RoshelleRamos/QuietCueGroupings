import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Alert,
  AppState,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Circle } from "react-native-svg";

const FOCUS_DURATION = 30 * 60;
const STORAGE_KEY = "@quietcue_parent_focus_v1";

type Props = {
  onHomePress: () => void;
  onTasksPress: () => void;
};

type FocusData = {
  secondsLeft: number;
  isRunning: boolean;
  lastUpdated: number;
  totalSeconds: number;
  date: string;
};

const getLocalDate = () => {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
};

const createInitialData = (): FocusData => ({
  secondsLeft: FOCUS_DURATION,
  isRunning: false,
  lastUpdated: Date.now(),
  totalSeconds: 0,
  date: getLocalDate(),
});

function synchronizeTimer(
  data: FocusData,
  now = Date.now()
): FocusData {
  const today = getLocalDate();
  const elapsed = data.isRunning
    ? Math.max(0, Math.floor((now - data.lastUpdated) / 1000))
    : 0;

  const countedSeconds = Math.min(elapsed, data.secondsLeft);

  return {
    secondsLeft: Math.max(0, data.secondsLeft - countedSeconds),
    isRunning: data.isRunning && data.secondsLeft > elapsed,
    lastUpdated: data.isRunning
      ? data.lastUpdated + elapsed * 1000
      : now,
    totalSeconds:
      (data.date === today ? data.totalSeconds : 0) +
      countedSeconds,
    date: today,
  };
}

export default function ParentFocusScreen({
  onHomePress,
  onTasksPress,
}: Props) {
  const [focus, setFocus] = useState<FocusData>(createInitialData);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadFocus = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved) as FocusData;
        const valid =
          typeof parsed.secondsLeft === "number" &&
          typeof parsed.isRunning === "boolean" &&
          typeof parsed.lastUpdated === "number" &&
          typeof parsed.totalSeconds === "number" &&
          typeof parsed.date === "string";

        if (valid) {
          const updated = synchronizeTimer(parsed);
          setFocus(updated);
          await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(updated)
          );
        }
      }
    } catch (error) {
      console.error("Failed to load focus timer:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadFocus();
  }, [loadFocus]);

  const saveFocus = async (updated: FocusData) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error("Failed to save focus timer:", error);
    }
  };

  useEffect(() => {
    if (!isLoaded || !focus.isRunning) return;

    const interval = setInterval(() => {
      setFocus((previous) => synchronizeTimer(previous));
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoaded, focus.isRunning]);

  useEffect(() => {
    if (!isLoaded) return;

    saveFocus(focus);
  }, [focus, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;

    const subscription = AppState.addEventListener(
      "change",
      (state) => {
        if (state === "active") {
          setFocus((previous) => synchronizeTimer(previous));
        }
      }
    );

    return () => subscription.remove();
  }, [isLoaded]);

  const handleStartPause = () => {
    if (!isLoaded) return;

    setFocus((previous) => {
      const current = synchronizeTimer(previous);

      return {
        ...current,
        secondsLeft:
          current.secondsLeft === 0
            ? FOCUS_DURATION
            : current.secondsLeft,
        isRunning: !current.isRunning,
        lastUpdated: Date.now(),
      };
    });
  };

  const handleStop = () => {
    setFocus((previous) => {
      const current = synchronizeTimer(previous);
      return {
        ...current,
        secondsLeft: FOCUS_DURATION,
        isRunning: false,
        lastUpdated: Date.now(),
      };
    });
  };

  const handleSkip = () => {
    Alert.alert(
      "Skip Session",
      "Do you want to skip the current session?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Skip",
          onPress: handleStop,
        },
      ]
    );
  };

  const circleSize = 230;
const strokeWidth = 12;
const radius = (circleSize - strokeWidth) / 2;
const circumference = 2 * Math.PI * radius;

const progress = Math.max(
  0,
  Math.min(1, focus.secondsLeft / FOCUS_DURATION)
);

const strokeDashoffset = circumference * (1 - progress);

  const minutes = Math.floor(focus.secondsLeft / 60);
  const seconds = focus.secondsLeft % 60;

  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;

  const totalHours = Math.floor(focus.totalSeconds / 3600);
  const totalMinutes = Math.floor(
    (focus.totalSeconds % 3600) / 60
  );

  const formattedTotal = `${String(totalHours).padStart(2, "0")}h ${String(
    totalMinutes
  ).padStart(2, "0")}m`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quiet Cue</Text>
        <Ionicons
          name="notifications-outline"
          size={24}
          color="#FFFFFF"
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Current Session</Text>

        <View style={styles.sessionCard}>
          <Text style={styles.sessionName}>Office Hours</Text>
          <Text style={styles.sessionDescription}>
            Stay focused and make every minute count.
          </Text>

          <View style={styles.timerCircle}>
  <Svg
    width={circleSize}
    height={circleSize}
    style={{ position: "absolute", top: 0, left: 0 }}
  >
    <Circle
      cx={circleSize / 2}
      cy={circleSize / 2}
      r={radius}
      stroke="#F4B7CD"
      strokeWidth={strokeWidth}
      fill="none"
    />

    <Circle
      cx={circleSize / 2}
      cy={circleSize / 2}
      r={radius}
      stroke="#B53166"
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeDasharray={`${circumference} ${circumference}`}
      strokeDashoffset={strokeDashoffset}
      rotation={-90}
      origin={`${circleSize / 2}, ${circleSize / 2}`}
    />
  </Svg>

  <Ionicons
    name="timer-outline"
    size={28}
    color="#B53166"
  />

  <Text style={styles.timerText}>
    {isLoaded ? formattedTime : "--:--"}
  </Text>

  <Text style={styles.timerLabel}>
    {!isLoaded
      ? "Loading..."
      : focus.isRunning
      ? "Focusing..."
      : focus.secondsLeft === 0
      ? "Session Complete"
      : "Ready to Focus"}
  </Text>
</View>

          <Text style={styles.totalLabel}>
            Today's Total Focus Time
          </Text>
          <Text style={styles.totalTime}>{formattedTotal}</Text>

          <View style={styles.buttonRow}>
            <Pressable
              style={styles.stopButton}
              onPress={handleStop}
              disabled={!isLoaded}
            >
              <Ionicons name="stop" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Stop</Text>
            </Pressable>

            <Pressable
              style={styles.pauseButton}
              onPress={handleStartPause}
              disabled={!isLoaded}
            >
              <Ionicons
                name={focus.isRunning ? "pause" : "play"}
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.buttonText}>
                {focus.isRunning ? "Pause" : "Start"}
              </Text>
            </Pressable>

            <Pressable
              style={styles.skipButton}
              onPress={handleSkip}
              disabled={!isLoaded}
            >
              <Ionicons
                name="play-skip-forward"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.buttonText}>Skip</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* BOTTOM NAVIGATION */}
      <View style={styles.bottomBar}>
        <Pressable
          style={styles.navButton}
          onPress={onHomePress}
        >
          <Ionicons
            name="home-outline"
            size={23}
            color="#FFFFFF"
          />
          <Text style={styles.navText}>Home</Text>
        </Pressable>

        <Pressable
          style={styles.navButton}
          onPress={onTasksPress}
        >
          <Ionicons
            name="checkbox-outline"
            size={23}
            color="#FFFFFF"
          />
          <Text style={styles.navText}>Tasks</Text>
        </Pressable>

        <View style={styles.activeNavItem}>
          <Ionicons name="timer" size={23} color="#FFFFFF" />
          <Text style={styles.navText}>Focus</Text>
        </View>

        <Pressable
          style={styles.navButton}
          onPress={() =>
            Alert.alert(
              "Messages",
              "Messages screen coming soon."
            )
          }
        >
          <Ionicons
            name="chatbubble-outline"
            size={23}
            color="#FFFFFF"
          />
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
    paddingTop: 25,
    paddingBottom: 25,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#49303C",
    marginBottom: 20,
  },
  sessionCard: {
    backgroundColor: "#FFE4EC",
    borderRadius: 22,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F38DB2",
  },
  sessionName: {
    fontSize: 19,
    fontWeight: "700",
    color: "#B53166",
  },
  sessionDescription: {
    fontSize: 12,
    color: "#775465",
    marginTop: 8,
    textAlign: "center",
  },
  timerCircle: {
  width: 230,
  height: 230,
  borderRadius: 115,
  backgroundColor: "#FFF8FB",
  justifyContent: "center",
  alignItems: "center",
  marginVertical: 25,
},
  timerText: {
    fontSize: 43,
    fontWeight: "700",
    color: "#B53166",
    marginTop: 8,
  },
  timerLabel: {
    fontSize: 13,
    color: "#775465",
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 13,
    color: "#775465",
  },
  totalTime: {
    fontSize: 25,
    fontWeight: "700",
    color: "#B53166",
    marginTop: 6,
    marginBottom: 25,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  stopButton: {
    flex: 1,
    backgroundColor: "#B53166",
    paddingVertical: 13,
    borderRadius: 15,
    alignItems: "center",
    gap: 5,
  },
  pauseButton: {
    flex: 1,
    backgroundColor: "#D45A88",
    paddingVertical: 13,
    borderRadius: 15,
    alignItems: "center",
    gap: 5,
  },
  skipButton: {
    flex: 1,
    backgroundColor: "#A45C80",
    paddingVertical: 13,
    borderRadius: 15,
    alignItems: "center",
    gap: 5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
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
  navButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
  },
  activeNavItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#BE4779",
    borderRadius: 18,
    paddingVertical: 7,
  },
  navText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
  },
});