import React, { useEffect, useRef, useState } from "react";
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
  Alert,
  Modal,
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
  const chatScrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
const [showAddContact, setShowAddContact] = useState(false);
const [newContactName, setNewContactName] = useState("");
const [newContactRole, setNewContactRole] = useState("Family Member");

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

  const openContactConversation = (contactId: string) => {
  setSelectedId(contactId);
  setMessageText("");
  setShowNewMessage(false);
  setShowAddContact(false);
};

const addNewContact = () => {
  const name = newContactName.trim();
  const role = newContactRole.trim() || "Family Member";

  if (!name) {
    Alert.alert("Missing Name", "Please enter a contact name.");
    return;
  }

  const existingContact = conversations.find(
    (contact) => contact.name.toLowerCase() === name.toLowerCase()
  );

  if (existingContact) {
    Alert.alert(
      "Contact Already Exists",
      "A contact with this name already exists."
    );
    return;
  }

  const newContact: Conversation = {
    id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    role,
    messages: [],
  };

  setConversations((previous) => [...previous, newContact]);

  setNewContactName("");
  setNewContactRole("Family Member");

  openContactConversation(newContact.id);
};

const deleteMessage = (conversationId: string, messageId: string) => {
  Alert.alert(
    "Delete Message",
    "Are you sure you want to delete this message?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setConversations((previous) =>
            previous.map((conversation) =>
              conversation.id === conversationId
                ? {
                    ...conversation,
                    messages: conversation.messages.filter(
                      (message) => message.id !== messageId
                    ),
                  }
                : conversation
            )
          );
        },
      },
    ]
  );
};

const deleteConversation = (conversationId: string) => {
  Alert.alert(
    "Delete Conversation",
    "Delete this conversation and all its messages? This cannot be undone.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setConversations((previous) =>
            previous.filter(
              (conversation) => conversation.id !== conversationId
            )
          );

          if (selectedId === conversationId) {
            setSelectedId(null);
          }
        },
      },
    ]
  );
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

        <Pressable
        onPress={() => {
          setShowAddContact(false);
          setShowNewMessage(true);
        }}
        accessibilityRole="button"
        accessibilityLabel="New Message"
        hitSlop={10}
      >
        <Ionicons
          name="chatbubbles-outline"
          size={24}
          color="#FFFFFF"
        />
      </Pressable>
      </View>

      {selectedConversation ? (
        <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
          <ScrollView
            ref={chatScrollRef}
            style={styles.chatList}
            contentContainerStyle={styles.chatContent}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => {
              chatScrollRef.current?.scrollToEnd({ animated: true });
            }}
          >
            <Text style={styles.chatRole}>
              {selectedConversation.role}
            </Text>

            <Pressable
            style={styles.deleteConversationButton}
            onPress={() => deleteConversation(selectedConversation.id)}
          >
            <Ionicons
              name="trash-outline"
              size={15}
              color="#B53166"
            />
            <Text style={styles.deleteConversationText}>
              Delete Conversation
            </Text>
          </Pressable>

            {selectedConversation.messages.map((message) => (
              <Pressable
                key={message.id}
                onLongPress={() =>
                  deleteMessage(selectedConversation.id, message.id)
                }
                delayLongPress={450}
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
              </Pressable>
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
              blurOnSubmit={false}
              textAlignVertical="center"
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
                    onLongPress={() => deleteConversation(conversation.id)}
                    delayLongPress={500}
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {conversation.name.charAt(0)}
                      </Text>
                    </View>

                    <View style={styles.conversationInfo}>
                      <View style={styles.conversationNameRow}>
                      <Text
                        style={styles.conversationName}
                        numberOfLines={1}
                        
                      >
                        {conversation.name}
                      </Text>

                      <Text style={styles.lastMessageTime}>
                        {lastMessage?.time ?? ""}
                      </Text>
                    </View>

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

      <Modal
  visible={showNewMessage}
  animationType="slide"
  transparent
  onRequestClose={() => {
    setShowNewMessage(false);
    setShowAddContact(false);
  }}
>
  <View style={styles.newMessageOverlay}>
    <View style={styles.newMessagePanel}>
      <View style={styles.newMessageHeader}>
        <Text style={styles.newMessageTitle}>
          {showAddContact ? "Add New Contact" : "New Message"}
        </Text>

        <Pressable
          onPress={() => {
            setShowNewMessage(false);
            setShowAddContact(false);
          }}
        >
          <Ionicons name="close" size={25} color="#FFFFFF" />
        </Pressable>
      </View>

      {showAddContact ? (
        <View style={styles.addContactForm}>
          <Text style={styles.contactLabel}>Contact Name</Text>

          <TextInput
            style={styles.contactInput}
            placeholder="Enter contact name"
            placeholderTextColor="#9B8290"
            value={newContactName}
            onChangeText={setNewContactName}
            maxLength={60}
          />

          <Text style={styles.contactLabel}>Role</Text>

          <TextInput
            style={styles.contactInput}
            placeholder="Family Member, Teacher, etc."
            placeholderTextColor="#9B8290"
            value={newContactRole}
            onChangeText={setNewContactRole}
            maxLength={40}
          />

          <Pressable
            style={styles.addContactSaveButton}
            onPress={addNewContact}
          >
            <Text style={styles.addContactSaveText}>
              Save & Start Chat
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setShowAddContact(false)}
            style={styles.cancelContactButton}
          >
            <Text style={styles.cancelContactText}>
              Back to Contacts
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.contactListContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.contactListLabel}>
            Select a Contact
          </Text>

          {conversations.map((contact) => (
            <Pressable
              key={contact.id}
              style={styles.contactSelectRow}
              onPress={() => openContactConversation(contact.id)}
            >
              <View style={styles.contactAvatar}>
                <Text style={styles.contactAvatarText}>
                  {contact.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.contactSelectName}>
                  {contact.name}
                </Text>
                <Text style={styles.contactSelectRole}>
                  {contact.role}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#B53166"
              />
            </Pressable>
          ))}

          <Pressable
            style={styles.addNewContactRow}
            onPress={() => setShowAddContact(true)}
          >
            <Ionicons
              name="add-circle-outline"
              size={24}
              color="#B53166"
            />
            <Text style={styles.addNewContactText}>
              Add New Contact
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  </View>
</Modal>

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
    flexShrink: 1,
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
    minHeight: 68,
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
    minHeight: 44,
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

  newMessageOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.4)",
  justifyContent: "center",
  paddingHorizontal: 18,
},
newMessagePanel: {
  backgroundColor: "#FFF8FB",
  borderRadius: 22,
  overflow: "hidden",
  maxHeight: "80%",
},
newMessageHeader: {
  backgroundColor: "#D45A88",
  paddingHorizontal: 20,
  paddingVertical: 18,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},
newMessageTitle: {
  color: "#FFFFFF",
  fontSize: 19,
  fontWeight: "700",
},
contactListContent: {
  padding: 18,
},
contactListLabel: {
  fontSize: 15,
  fontWeight: "700",
  color: "#49303C",
  marginBottom: 14,
},
contactSelectRow: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#FFFFFF",
  borderWidth: 1,
  borderColor: "#F4B7CD",
  borderRadius: 14,
  padding: 12,
  marginBottom: 10,
},
contactAvatar: {
  width: 42,
  height: 42,
  borderRadius: 21,
  backgroundColor: "#B53166",
  justifyContent: "center",
  alignItems: "center",
  marginRight: 12,
},
contactAvatarText: {
  color: "#FFFFFF",
  fontWeight: "700",
  fontSize: 18,
},
contactSelectName: {
  color: "#49303C",
  fontWeight: "700",
  fontSize: 14,
},
contactSelectRole: {
  color: "#775465",
  fontSize: 12,
  marginTop: 3,
},
addNewContactRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderStyle: "dashed",
  borderColor: "#B53166",
  borderRadius: 14,
  padding: 16,
  marginTop: 8,
},
addNewContactText: {
  color: "#B53166",
  fontWeight: "700",
  marginLeft: 8,
},
addContactForm: {
  padding: 20,
},
contactLabel: {
  fontSize: 13,
  fontWeight: "700",
  color: "#49303C",
  marginBottom: 8,
},
contactInput: {
  backgroundColor: "#FFFFFF",
  borderWidth: 1,
  borderColor: "#F4B7CD",
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 12,
  color: "#49303C",
  marginBottom: 18,
},
addContactSaveButton: {
  backgroundColor: "#B53166",
  borderRadius: 14,
  paddingVertical: 14,
  alignItems: "center",
},
addContactSaveText: {
  color: "#FFFFFF",
  fontWeight: "700",
  fontSize: 14,
},
cancelContactButton: {
  alignItems: "center",
  paddingVertical: 14,
  marginTop: 8,
},
cancelContactText: {
  color: "#B53166",
  fontWeight: "600",
},

conversationNameRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
},
lastMessageTime: {
  color: "#775465",
  fontSize: 10,
  flexShrink: 0,
},

deleteConversationButton: {
  alignSelf: "center",
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  paddingHorizontal: 14,
  paddingVertical: 9,
  borderWidth: 1,
  borderColor: "#F4B7CD",
  borderRadius: 20,
  marginBottom: 18,
},
deleteConversationText: {
  color: "#B53166",
  fontSize: 12,
  fontWeight: "600",
},
});