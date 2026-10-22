
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
const TASKS_STORAGE_KEY = "@quietcue_parent_tasks";

type Props = {
  onBack: () => void;
};

export default function ParentTasksScreen({ onBack }: Props) {
const [tasks, setTasks] = useState([
  { id: 1, title: "Project for AppDev", completed: false },
  { id: 2, title: "Client layout", completed: true },
  { id: 3, title: "Research Paper C-1", completed: false },
  { id: 4, title: "Research Paper C-2", completed: false },
  { id: 5, title: "GitHub Account", completed: true },
]);

const [tasksLoaded, setTasksLoaded] = useState(false);
const [modalVisible, setModalVisible] = useState(false);
const [newTask, setNewTask] = useState("");

const handleAddTask = () => {
  const title = newTask.trim();

  if (!title) {
    Alert.alert("Missing Task", "Please enter a task name.");
    return;
  }

  setTasks((currentTasks) => [
    ...currentTasks,
    {
      id: Date.now(),
      title,
      completed: false,
    },
  ]);

  setNewTask("");
  setModalVisible(false);
};

const handleToggleTask = (taskId: number) => {
  setTasks((currentTasks) =>
    currentTasks.map((task) =>
      task.id === taskId
        ? { ...task, completed: !task.completed }
        : task
    )
  );
};

const handleDeleteTask = (taskId: number) => {
  Alert.alert(
    "Delete Task",
    "Are you sure you want to delete this task?",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setTasks((currentTasks) =>
            currentTasks.filter((task) => task.id !== taskId)
          );
        },
      },
    ]
  );
};

const completedCount = tasks.filter(
  (task) => task.completed
).length;

// LOAD SAVED TASKS
useEffect(() => {
  const loadTasks = async () => {
    try {
      const savedTasks = await AsyncStorage.getItem(
        TASKS_STORAGE_KEY
      );

      if (savedTasks !== null) {
        setTasks(JSON.parse(savedTasks));
      }
    } catch (error) {
      console.error("Failed to load tasks:", error);
      Alert.alert("Error", "Unable to load saved tasks.");
    } finally {
      setTasksLoaded(true);
    }
  };

  loadTasks();
}, []);

// SAVE TASKS WHENEVER THEY CHANGE
useEffect(() => {
  if (!tasksLoaded) return;

  const saveTasks = async () => {
    try {
      await AsyncStorage.setItem(
        TASKS_STORAGE_KEY,
        JSON.stringify(tasks)
      );
    } catch (error) {
      console.error("Failed to save tasks:", error);
      Alert.alert("Error", "Unable to save tasks.");
    }
  };

  saveTasks();
}, [tasks, tasksLoaded]);
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Ionicons
            name="arrow-back"
            size={24}
            color="#FFFFFF"
          />
        </Pressable>

        <Text style={styles.headerTitle}>My Tasks</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* SUMMARY */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Today's Progress</Text>

          <Text style={styles.summaryCount}>
            {completedCount} of {tasks.length} tasks completed
          </Text>

          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    (completedCount / tasks.length) * 100
                  }%`,
                },
              ]}
            />
          </View>
        </View>

        {/* TASK LIST */}
        <Text style={styles.sectionTitle}>My Task List</Text>

        
        {tasks.map((task) => (
        <Pressable
            key={task.id}
            style={styles.taskCard}
            onPress={() => handleToggleTask(task.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: task.completed }}
  >
            <Ionicons
              name={
                task.completed
                  ? "checkmark-circle"
                  : "ellipse-outline"
              }
              size={24}
              color={
                task.completed ? "#39A879" : "#BE4779"
              }
            />

            <Text
              style={[
                styles.taskTitle,
                task.completed && styles.completedTask,
              ]}
            >
              {task.title}
            </Text>

            <Text
              style={[
                styles.taskStatus,
                task.completed
                  ? styles.completedStatus
                  : styles.pendingStatus,
              ]}
            >
              {task.completed ? "Done" : "Pending"}
            </Text>

            <Pressable
            style={styles.deleteButton}
            onPress={(event) => {
                event.stopPropagation();
                handleDeleteTask(task.id);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${task.title}`}
            >
            <Ionicons
                name="trash-outline"
                size={19}
                color="#D94C72"
            />
            </Pressable>
          </Pressable>
        
        ))}

        {/* ADD TASK BUTTON */}
        <Pressable
          style={styles.addButton}
        onPress={() => setModalVisible(true)}
        >
          <Ionicons
            name="add-circle-outline"
            size={21}
            color="#FFFFFF"
          />
          <Text style={styles.addButtonText}>Add New Task</Text>
        </Pressable>
 </ScrollView>

      {/* ADD TASK MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add New Task</Text>

            <TextInput
              style={styles.taskInput}
              placeholder="Enter your task..."
              placeholderTextColor="#A48B97"
              value={newTask}
              onChangeText={setNewTask}
              maxLength={100}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setNewTask("");
                  setModalVisible(false);
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.saveButton}
                onPress={handleAddTask}
              >
                <Text style={styles.saveText}>Save Task</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    paddingTop: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    padding: 4,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },

  headerSpacer: {
    width: 32,
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  summaryCard: {
    backgroundColor: "#F5A5C2",
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
  },

  summaryTitle: {
    color: "#49303C",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },

  summaryCount: {
    color: "#663E50",
    fontSize: 13,
    marginBottom: 14,
  },

  progressBackground: {
    height: 10,
    backgroundColor: "#FBE1EA",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#B83669",
    borderRadius: 10,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#41353A",
    marginBottom: 14,
  },

  taskCard: {
    backgroundColor: "#F4ECEF",
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  taskTitle: {
    flex: 1,
    color: "#49303C",
    fontSize: 13,
    fontWeight: "600",
  },

  completedTask: {
    textDecorationLine: "line-through",
    color: "#8B7A81",
  },

  taskStatus: {
    fontSize: 10,
    fontWeight: "700",
  },

  deleteButton: {
  padding: 7,
  marginLeft: 3,
},

  completedStatus: {
    color: "#39A879",
  },

  pendingStatus: {
    color: "#BE4779",
  },

  addButton: {
    backgroundColor: "#AD2F62",
    borderRadius: 25,
    paddingVertical: 14,
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

   addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  modalCard: {
    backgroundColor: "#FFF8FB",
    borderRadius: 20,
    padding: 22,
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#49303C",
    marginBottom: 18,
  },

  taskInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E9B5CA",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#49303C",
    marginBottom: 20,
  },

  modalActions: {
    flexDirection: "row",
    gap: 12,
  },

  cancelButton: {
    flex: 1,
    backgroundColor: "#F4E1E9",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },

  cancelText: {
    color: "#8A5269",
    fontWeight: "700",
  },

  saveButton: {
    flex: 1,
    backgroundColor: "#AD2F62",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },

  saveText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
