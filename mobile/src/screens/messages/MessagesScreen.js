
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
  getMyConversations,
  searchMembers,
  createConversation,
} from "../../services/messagingService";

import { COLORS, SIZES, RADIUS } from "../../constants/theme";

const getFullName = (member) =>
  [member?.firstName, member?.middleName, member?.lastName]
    .filter(Boolean)
    .join(" ") || "JVP Member";

const formatTime = (date) => {
  if (!date) return "";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";

  const now = new Date();

  if (parsed.toDateString() === now.toDateString()) {
    return parsed.toLocaleTimeString("en-KE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return parsed.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
  });
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

export default function MessagesScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [openingMember, setOpeningMember] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadConversations = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await getMyConversations();
      setConversations(
        Array.isArray(response?.data) ? response.data : []
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const query = searchText.trim();

    if (query.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return undefined;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setSearching(true);

      try {
        const response = await searchMembers(query);

        if (!cancelled) {
          setSearchResults(
            Array.isArray(response?.data) ? response.data : []
          );
        }
      } catch (err) {
        if (!cancelled) {
          setSearchResults([]);
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchText]);

  const openConversation = async (member) => {
    if (!member?.userId || openingMember) return;

    setOpeningMember(member.userId);
    setError("");

    try {
      const response = await createConversation(member.userId);
      const conversation = response?.data;

      if (!conversation?._id) {
        throw new Error("Unable to open this conversation.");
      }

      navigation.navigate("Conversation", {
        conversationId: conversation._id,
        member,
      });

      setSearchText("");
      setSearchResults([]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setOpeningMember("");
    }
  };

  const openExistingConversation = (conversation) => {
    if (!conversation?._id || !conversation?.member) return;

    navigation.navigate("Conversation", {
      conversationId: conversation._id,
      member: conversation.member,
    });
  };

  const isSearching = searchText.trim().length >= 2;

  const renderAvatar = (member, size = 54) => {
    const photo = member?.profilePhoto;

    if (typeof photo === "string" && photo.trim()) {
      return (
        <Image
          source={{ uri: photo }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: COLORS.surface,
          }}
        />
      );
    }

    return (
      <View
        style={[
          styles.avatarPlaceholder,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Text style={styles.avatarInitial}>
          {member?.firstName?.charAt(0)?.toUpperCase() || "J"}
        </Text>
      </View>
    );
  };

  const renderMember = ({ item }) => (
    <Pressable
      style={styles.conversationRow}
      onPress={() => openConversation(item)}
      disabled={Boolean(openingMember)}
    >
      {renderAvatar(item)}

      <View style={styles.conversationDetails}>
        <Text style={styles.memberName} numberOfLines={1}>
          {getFullName(item)}
        </Text>

        <Text style={styles.memberMeta} numberOfLines={1}>
          {[item.county, item.memberNumber]
            .filter(Boolean)
            .join(" • ")}
        </Text>
      </View>

      {openingMember === item.userId ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : (
        <View style={styles.memberAction}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={19}
            color={COLORS.primary}
          />
        </View>
      )}
    </Pressable>
  );

  const renderConversation = ({ item }) => {
    const member = item.member;
    const lastMessage = item.lastMessage;

    return (
      <Pressable
        style={styles.conversationRow}
        onPress={() => openExistingConversation(item)}
      >
        {renderAvatar(member)}

        <View style={styles.conversationDetails}>
          <View style={styles.nameRow}>
            <Text style={styles.memberName} numberOfLines={1}>
              {getFullName(member)}
            </Text>

            <Text style={styles.timeText}>
              {formatTime(item.lastMessageAt)}
            </Text>
          </View>

          <View style={styles.previewRow}>
            <Text
              style={[
                styles.messagePreview,
                item.unreadCount > 0 && styles.unreadPreview,
              ]}
              numberOfLines={1}
            >
              {lastMessage?.content || "Start a conversation"}
            </Text>

            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {item.unreadCount > 99 ? "99+" : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  const emptyState = (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name="chatbubbles-outline"
          size={34}
          color={COLORS.primary}
        />
      </View>

      <Text style={styles.emptyTitle}>
        No conversations yet
      </Text>

      <Text style={styles.emptyText}>
        Search for an active JVP member above to start your first
        private conversation.
      </Text>
    </View>
  );

  const memberEmptyState = (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name="people-outline"
          size={34}
          color={COLORS.primary}
        />
      </View>

      <Text style={styles.emptyTitle}>
        No members found
      </Text>

      <Text style={styles.emptyText}>
        Try another name, member number or county.
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
    >
      {/* PAGE HEADER */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../../assets/jvp-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.brandTextContainer}>
            <Text style={styles.brandName}>
              JUMUIYA YA VIJANA WA PWANI
            </Text>

            <Text style={styles.brandSubtitle}>
              Unity • Leadership • Empowerment
            </Text>
          </View>
        </View>

        <View style={styles.headingRow}>
          <View style={styles.headingContent}>
            <View style={styles.pageLabel}>
              <View style={styles.pageLabelDot} />
              <Text style={styles.pageLabelText}>
                MEMBER CONNECTIONS
              </Text>
            </View>

            <Text style={styles.heading}>Messages</Text>

            <Text style={styles.subtitle}>
              Connect, communicate and engage privately with
              fellow JVP members.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="chatbubbles-outline"
              size={27}
              color={COLORS.primary}
            />
          </View>
        </View>
      </View>

      {/* MEMBER SEARCH */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color={COLORS.textSecondary}
        />

        <TextInput
          style={styles.searchInput}
          placeholder="Search JVP members..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
          returnKeyType="search"
        />

        {searchText.length > 0 && (
          <Pressable
            onPress={() => {
              setSearchText("");
              setSearchResults([]);
              setError("");
            }}
            hitSlop={10}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={COLORS.textSecondary}
            />
          </Pressable>
        )}
      </View>

      {/* ERROR MESSAGE */}
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={17}
            color={COLORS.danger}
          />

          <View style={styles.errorContent}>
            <Text style={styles.errorText}>{error}</Text>

            <Pressable
              onPress={() => {
                setError("");
                if (!isSearching) loadConversations();
              }}
            >
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* SEARCH RESULTS */}
      {isSearching ? (
        <>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Find Members</Text>
              <Text style={styles.sectionSubtitle}>
                Search results from the JVP membership
              </Text>
            </View>
          </View>

          {searching ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator
                color={COLORS.primary}
                size="large"
              />
              <Text style={styles.loaderText}>
                Searching members...
              </Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => String(item.userId)}
              renderItem={renderMember}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={
                searchResults.length === 0
                  ? styles.emptyList
                  : styles.listContent
              }
              ListEmptyComponent={memberEmptyState}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      ) : (
        <>
          {/* CONVERSATION LIST */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Recent Conversations
              </Text>

              <Text style={styles.sectionSubtitle}>
                Your private member conversations
              </Text>
            </View>

            <View style={styles.conversationCount}>
              <Text style={styles.conversationCountText}>
                {conversations.length}
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator
                color={COLORS.primary}
                size="large"
              />
              <Text style={styles.loaderText}>
                Loading your conversations...
              </Text>
            </View>
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={(item) => String(item._id)}
              renderItem={renderConversation}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => loadConversations(true)}
                  tintColor={COLORS.primary}
                  colors={[COLORS.primary]}
                />
              }
              contentContainerStyle={
                conversations.length === 0
                  ? styles.emptyList
                  : styles.listContent
              }
              ListEmptyComponent={emptyState}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  topHeader: {
    paddingHorizontal: SIZES.md,
    paddingTop: 24,
    paddingBottom: 22,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 27,
  },

  logoContainer: {
    width: 54,
    height: 54,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
  },

  logo: {
    width: "100%",
    height: "100%",
  },

  brandTextContainer: {
    flex: 1,
    marginLeft: 12,
  },

  brandName: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  brandSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 5,
  },

  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headingContent: {
    flex: 1,
    paddingRight: 10,
  },

  pageLabel: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.round,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 9,
  },

  pageLabelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 6,
  },

  pageLabelText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  heading: {
    fontSize: 29,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.5,
  },

  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  headerIcon: {
    width: 53,
    height: 53,
    borderRadius: 17,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  searchContainer: {
    marginHorizontal: SIZES.md,
    marginBottom: 23,
    paddingHorizontal: SIZES.md,
    height: 49,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
  },

  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
  },

  sectionHeader: {
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },

  conversationCount: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  conversationCountText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
  },

  conversationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.md,
    paddingVertical: 15,
    marginHorizontal: SIZES.md,
    marginBottom: 9,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SIZES.md,
  },

  avatarPlaceholder: {
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarInitial: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.primary,
  },

  conversationDetails: {
    flex: 1,
    minWidth: 0,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SIZES.sm,
  },

  memberName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },

  memberMeta: {
    marginTop: 5,
    color: COLORS.textSecondary,
    fontSize: 11,
  },

  timeText: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },

  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: SIZES.sm,
  },

  messagePreview: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 12,
  },

  unreadPreview: {
    color: COLORS.text,
    fontWeight: "800",
  },

  unreadBadge: {
    minWidth: 21,
    height: 21,
    paddingHorizontal: 5,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  unreadBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "900",
  },

  memberAction: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  loaderContainer: {
    paddingTop: 45,
    alignItems: "center",
  },

  loaderText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 10,
  },

  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },

  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: SIZES.xl,
    paddingVertical: 35,
  },

  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SIZES.md,
  },

  emptyTitle: {
    marginTop: 2,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
  },

  emptyText: {
    marginTop: SIZES.sm,
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 19,
  },

  errorContainer: {
    marginHorizontal: SIZES.md,
    marginBottom: SIZES.md,
    padding: SIZES.md,
    backgroundColor: "#FCEBEC",
    borderRadius: RADIUS.md,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  errorContent: {
    flex: 1,
  },

  errorText: {
    color: COLORS.danger,
    fontSize: 11,
    lineHeight: 16,
  },

  retryText: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 11,
    marginTop: 5,
  },

  listContent: {
    paddingBottom: SIZES.xl,
  },
});
