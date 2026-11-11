import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Alert,
  AppState,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Circle } from "react-native-svg";

const FOCUS_DURATION = 30 * 60;
const STORAGE_KEY = "@quietcue_parent_focus_v1";

type Props = {
  onHomePress: () => void;
  onTasksPress: () => void;
  selectedTaskTitle?: string | null;
};

type FocusData = {
  secondsLeft: number;
  isRunning: boolean;
  lastUpdated: number;
  totalSeconds: number;
  completedSessions: number;
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
  completedSessions: 0,
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

  const sessionCompleted =
  data.isRunning &&
  data.secondsLeft > 0 &&
  elapsed >= data.secondsLeft;

  return {
    secondsLeft: Math.max(0, data.secondsLeft - countedSeconds),
    isRunning: data.isRunning && data.secondsLeft > elapsed,
    lastUpdated: data.isRunning
      ? data.lastUpdated + elapsed * 1000
      : now,
    totalSeconds:
    (data.date === today ? data.totalSeconds : 0) +
    countedSeconds,
    completedSessions:
    (data.date === today ? (data.completedSessions ?? 0) : 0) +
    (sessionCompleted ? 1 : 0),
    date: today,
    };
}

export default function ParentFocusScreen({
  onHomePress,
  onTasksPress,
  selectedTaskTitle,
}: Props) {
  const [focus, setFocus] = useState<FocusData>(createInitialData);
  const [isLoaded, setIsLoaded] = useState(false);
  const completionAlertShown = React.useRef(false);
const previousSecondsLeft = React.useRef<number | null>(null);

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
  const timer = setTimeout(() => {
    void loadFocus();
  }, 0);

  return () => clearTimeout(timer);
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

  const previous = previousSecondsLeft.current;
  const current = focus.secondsLeft;

  if (
    previous !== null &&
    previous > 0 &&
    current === 0 &&
    !completionAlertShown.current
  ) {
    completionAlertShown.current = true;

    Alert.alert(
      "Focus Session Complete! 🎉",
      "Great job! You've completed your 30-minute focus session. Keep up the good work!",
      [{ text: "OK" }]
    );
  }

  if (current === FOCUS_DURATION) {
    completionAlertShown.current = false;
  }

  previousSecondsLeft.current = current;
}, [focus.secondsLeft, isLoaded]);

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

   const confirmStop = () => {
    Alert.alert(
      "Stop Focus Session",
      "Are you sure you want to stop your current focus session?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Stop Session",
          style: "destructive",
          onPress: handleStop,
        },
      ]
    );
  };

  const handleSkip = () => {
  Alert.alert(
    "Skip Focus Session",
    "Do you want to skip this session and choose another task?",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Skip Session",
        onPress: () => {
          handleStop();
          onTasksPress();
        },
      },
    ]
  );
};

  const circleSize = 190;
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

  const DAILY_GOAL_SECONDS = 2 * 60 * 60;

const dailyProgress = Math.min(
  100,
  Math.max(0, (focus.totalSeconds / DAILY_GOAL_SECONDS) * 100)
);

const dailyMinutes = Math.floor(focus.totalSeconds / 60);
const dailyGoalMinutes = 120;

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

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        >
        <Text style={styles.sectionTitle}>Current Session</Text>

        <View style={styles.sessionCard}>

          <Text style={styles.selectedTaskLabel}>
            {selectedTaskTitle ? "FOCUSING ON TASK" : "GENERAL FOCUS SESSION"}
          </Text>

          <Text style={styles.sessionName}>
            {selectedTaskTitle || "Office Hours"}
          </Text>
          
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

<View style={styles.focusStatusRow}>
  <View
    style={[
      styles.focusStatusDot,
      {
        backgroundColor: !isLoaded
          ? "#999999"
          : focus.isRunning
          ? "#28A745"
          : focus.secondsLeft === 0
          ? "#28A745"
          : focus.secondsLeft < FOCUS_DURATION
          ? "#E5A100"
          : "#B53166",
      },
    ]}
  />

  <Text style={styles.timerLabel}>
    {!isLoaded
      ? "Loading..."
      : focus.isRunning
      ? "Focusing..."
      : focus.secondsLeft === 0
      ? "Session Complete"
      : focus.secondsLeft < FOCUS_DURATION
      ? "Paused"
      : "Ready to Focus"}
  </Text>
</View>

</View>

          <Text style={styles.totalLabel}>
          Today&apos;s Total Focus Time
        </Text>
          <Text style={styles.totalTime}>{formattedTotal}</Text>

          <Text style={styles.completedText}>
            Completed Sessions: {focus.completedSessions ?? 0}
            </Text>

            <View style={styles.dailyGoalContainer}>
  <Text style={styles.dailyGoalTitle}>Daily Focus Goal</Text>

  <Text style={styles.dailyGoalSubtitle}>
    {dailyMinutes} / {dailyGoalMinutes} minutes
  </Text>

  <View style={styles.dailyProgressBackground}>
    <View
      style={[
        styles.dailyProgressFill,
        { width: `${dailyProgress}%` },
      ]}
    />
  </View>

  <Text style={styles.dailyGoalPercentage}>
    {Math.round(dailyProgress)}% Completed
  </Text>
</View>

          <View style={styles.buttonRow}>
            <Pressable
              style={styles.stopButton}
              onPress={confirmStop}
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
                {focus.isRunning
                  ? "Pause"
                  : focus.secondsLeft === 0
                    ? "Start New Session"
                    : focus.secondsLeft < FOCUS_DURATION
                      ? "Resume"
                      : "Start"}
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
      </ScrollView>

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
},

scrollContent: {
  paddingHorizontal: 16,
  paddingTop: 14,
  paddingBottom: 25,
},

  sectionTitle: {
  fontSize: 19,
  fontWeight: "700",
  color: "#49303C",
  marginBottom: 12,
},

sessionCard: {
  backgroundColor: "#FFE4EC",
  borderRadius: 22,
  padding: 14,
  alignItems: "center",
  borderWidth: 1,
  borderColor: "#F38DB2",
},

selectedTaskLabel: {
  fontSize: 10,
  fontWeight: "700",
  color: "#775465",
  letterSpacing: 1,
  marginBottom: 6,
  textAlign: "center",
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
  width: 190,
  height: 190,
  borderRadius: 95,
  backgroundColor: "#FFF8FB",
  justifyContent: "center",
  alignItems: "center",
  marginVertical: 14,
},
  timerText: {
    fontSize: 43,
    fontWeight: "700",
    color: "#B53166",
    marginTop: 8,
  },

  focusStatusRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
},

focusStatusDot: {
  width: 8,
  height: 8,
  borderRadius: 4,
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
  fontSize: 23,
  fontWeight: "700",
  color: "#B53166",
  marginTop: 4,
  marginBottom: 12,
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

  completedText: {
  fontSize: 14,
  fontWeight: "600",
  color: "#B53166",
  textAlign: "center",
  marginBottom: 18,
},

dailyGoalContainer: {
  width: "100%",
  backgroundColor: "#FFF8FB",
  borderRadius: 14,
  padding: 14,
  marginTop: 4,
},
dailyGoalTitle: {
  fontSize: 14,
  fontWeight: "700",
  color: "#B53166",
  textAlign: "center",
},
dailyGoalSubtitle: {
  fontSize: 12,
  color: "#775465",
  textAlign: "center",
  marginTop: 7,
  marginBottom: 12,
},
dailyProgressBackground: {
  height: 10,
  backgroundColor: "#F4B7CD",
  borderRadius: 10,
  overflow: "hidden",
},
dailyProgressFill: {
  height: "100%",
  backgroundColor: "#B53166",
  borderRadius: 10,
},
dailyGoalPercentage: {
  fontSize: 12,
  fontWeight: "600",
  color: "#B53166",
  textAlign: "center",
  marginTop: 9,
},
});