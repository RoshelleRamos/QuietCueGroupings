import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Props = {
  onHomePress: () => void;
  onTasksPress: () => void;
  onFocusPress: () => void;
};

type Message = {
  id: string;
  text: string;
  sender: "me" | "other";
  time: string;
};

type Conversation = {
  id: string;
  name: string;
  role: string;
  messages: Message[];
};

const STORAGE_KEY = "@quietcue_messages_demo_v1";

const initialConversations: Conversation[] = [
  {
    id: "teacher1",
    name: "Teacher Maria",
    role: "Teacher",
    messages: [
      {
        id: "welcome1",
        text: "Hello! Welcome to QuietCue.",
        sender: "other",
        time: "9:00 AM",
      },
    ],
  },
  {
    id: "teacher2",
    name: "Teacher Ana",
    role: "Teacher",
    messages: [
      {
        id: "welcome2",
        text: "Feel free to send a message here.",
        sender: "other",
        time: "10:00 AM",
      },
    ],
  },
];

export default function ParentMessagesScreen({
  onHomePress,
  onTasksPress,
  onFocusPress,
}: Props) {
  const [conversations, setConversations] =
    useState<Conversation[]>(initialConversations);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [messageText, setMessageText] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadMessages() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);

        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setConversations(parsed);
          }
        }
      } catch (error) {
        console.error("Unable to load messages:", error);
      } finally {
        setLoaded(true);
      }
    }

    loadMessages();
  }, []);

  useEffect(() => {
    if (!loaded) return;

    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(conversations)
    ).catch((error) => {
      console.error("Unable to save messages:", error);
    });
  }, [conversations, loaded]);

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedId
  );

  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.name.toLowerCase().includes(search.toLowerCase())
  );

  const sendMessage = () => {
    const text = messageText.trim();

    if (!text || !selectedId) return;

    const now = new Date();

    const newMessage: Message = {
      id: `${Date.now()}-${Math.random()}`,
      text,
      sender: "me",
      time: now.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    };

    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === selectedId
          ? {
              ...conversation,
              messages: [...conversation.messages, newMessage],
            }
          : conversation
      )
    );

    setMessageText("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {selectedConversation ? (
          <Pressable onPress={() => setSelectedId(null)}>
            <Ionicons name="arrow-back" size={25} color="#FFFFFF" />
          </Pressable>
        ) : (
          <Text style={styles.headerTitle}>Quiet Cue</Text>
        )}

        <Text style={styles.headerSubtitle}>
          {selectedConversation
            ? selectedConversation.name
            : "Messages"}
        </Text>

        <Ionicons
          name="chatbubbles-outline"
          size={24}
          color="#FFFFFF"
        />
      </View>

      {selectedConversation ? (
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={styles.chatList}
            contentContainerStyle={styles.chatContent}
          >
            <Text style={styles.chatRole}>
              {selectedConversation.role}
            </Text>

            {selectedConversation.messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  message.sender === "me"
                    ? styles.myBubble
                    : styles.otherBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.sender === "me" && styles.myMessageText,
                  ]}
                >
                  {message.text}
                </Text>

                <Text
                  style={[
                    styles.messageTime,
                    message.sender === "me" && styles.myMessageTime,
                  ]}
                >
                  {message.time}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.composer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              placeholderTextColor="#9B8290"
              value={messageText}
              onChangeText={setMessageText}
              multiline
            />

            <Pressable
              style={[
                styles.sendButton,
                !messageText.trim() && styles.disabledSend,
              ]}
              onPress={sendMessage}
              disabled={!messageText.trim()}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.inboxContainer}>
          <Text style={styles.sectionTitle}>Your Conversations</Text>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#B53166" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search conversations"
              placeholderTextColor="#9B8290"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <ScrollView>
            {filteredConversations.length === 0 ? (
              <Text style={styles.emptyText}>
                No conversations found.
              </Text>
            ) : (
              filteredConversations.map((conversation) => {
                const lastMessage =
                  conversation.messages[conversation.messages.length - 1];

                return (
                  <Pressable
                    key={conversation.id}
                    style={styles.conversationCard}
                    onPress={() => setSelectedId(conversation.id)}
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {conversation.name.charAt(0)}
                      </Text>
                    </View>

                    <View style={styles.conversationInfo}>
                      <Text style={styles.conversationName}>
                        {conversation.name}
                      </Text>

                      <Text style={styles.conversationRole}>
                        {conversation.role}
                      </Text>

                      <Text
                        style={styles.preview}
                        numberOfLines={1}
                      >
                        {lastMessage?.text || "No messages yet"}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#B53166"
                    />
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      )}

      <View style={styles.bottomBar}>
        <Pressable style={styles.navButton} onPress={onHomePress}>
          <Ionicons name="home-outline" size={23} color="#FFFFFF" />
          <Text style={styles.navText}>Home</Text>
        </Pressable>

        <Pressable style={styles.navButton} onPress={onTasksPress}>
          <Ionicons name="checkbox-outline" size={23} color="#FFFFFF" />
          <Text style={styles.navText}>Tasks</Text>
        </Pressable>

        <Pressable style={styles.navButton} onPress={onFocusPress}>
          <Ionicons name="timer-outline" size={23} color="#FFFFFF" />
          <Text style={styles.navText}>Focus</Text>
        </Pressable>

        <View style={styles.activeNavItem}>
          <Ionicons name="chatbubble" size={23} color="#FFFFFF" />
          <Text style={styles.navText}>Messages</Text>
        </View>
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
  headerSubtitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  inboxContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#49303C",
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F4B7CD",
    borderRadius: 15,
    paddingHorizontal: 13,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    padding: 13,
    color: "#49303C",
  },
  conversationCard: {
    backgroundColor: "#FFE4EC",
    borderWidth: 1,
    borderColor: "#F38DB2",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#B53166",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  conversationInfo: {
    flex: 1,
  },
  conversationName: {
    color: "#B53166",
    fontSize: 16,
    fontWeight: "700",
  },
  conversationRole: {
    color: "#775465",
    fontSize: 12,
    marginTop: 2,
  },
  preview: {
    color: "#775465",
    fontSize: 13,
    marginTop: 7,
  },
  emptyText: {
    textAlign: "center",
    color: "#775465",
    marginTop: 30,
  },
  chatContainer: {
    flex: 1,
  },
  chatList: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 24,
  },
  chatRole: {
    textAlign: "center",
    color: "#775465",
    fontSize: 12,
    marginBottom: 20,
  },
  messageBubble: {
    maxWidth: "82%",
    padding: 13,
    borderRadius: 17,
    marginBottom: 12,
  },
  myBubble: {
    backgroundColor: "#B53166",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: "#FFE4EC",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    color: "#49303C",
  },
  myMessageText: {
    color: "#FFFFFF",
  },
  messageTime: {
    fontSize: 10,
    color: "#775465",
    marginTop: 7,
    textAlign: "right",
  },
  myMessageTime: {
    color: "#FFE4EC",
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F4B7CD",
  },
  messageInput: {
    flex: 1,
    backgroundColor: "#FFF8FB",
    borderWidth: 1,
    borderColor: "#F4B7CD",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 100,
    color: "#49303C",
  },
  sendButton: {
    backgroundColor: "#B53166",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  disabledSend: {
    opacity: 0.5,
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