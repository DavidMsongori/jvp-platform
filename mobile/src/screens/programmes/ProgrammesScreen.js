import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
  getEvents,
  getFeaturedEvents,
} from "../../services/eventService";

import {
  COLORS,
  SIZES,
  RADIUS,
} from "../../constants/theme";

const PAGE_SIZE = 10;

const CATEGORIES = [
  { value: "all", label: "All Events" },
  { value: "conference", label: "Conferences" },
  { value: "summit", label: "Summits" },
  { value: "training", label: "Training" },
  { value: "workshop", label: "Workshops" },
  { value: "forum", label: "Forums" },
  { value: "webinar", label: "Webinars" },
  { value: "networking", label: "Networking" },
  { value: "competition", label: "Competitions" },
  { value: "leadership", label: "Leadership" },
  { value: "community_service", label: "Community Service" },
  { value: "career_fair", label: "Career Fairs" },
];

const EVENT_TYPES = [
  { value: "all", label: "All Formats" },
  { value: "physical", label: "Physical" },
  { value: "virtual", label: "Virtual" },
  { value: "hybrid", label: "Hybrid" },
];

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Unable to load events. Please try again.";

const formatDate = (date) => {
  if (!date) return "Date to be announced";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Date to be announced";
  }

  return parsed.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatCategory = (category) =>
  category
    ? category.replace(/_/g, " ").replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      )
    : "JVP Event";

const getEventLocation = (event) => {
  if (event?.eventType === "virtual") {
    return "Online Event";
  }

  return (
    event?.venue?.name ||
    event?.venue?.city ||
    event?.venue?.county ||
    "Venue to be announced"
  );
};

const getEventImage = (event) =>
  event?.coverImage?.url ||
  event?.coverImage?.secure_url ||
  event?.coverImage ||
  null;

export default function ProgrammesScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [featuredEvents, setFeaturedEvents] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    hasNextPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchText.trim());
    }, 450);

    return () => clearTimeout(timer);
  }, [searchText]);

  const loadEvents = useCallback(
    async ({ refresh = false } = {}) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const params = {
          page: 1,
          limit: PAGE_SIZE,
          sort: "startDate",
          published: true,
        };

        if (selectedCategory !== "all") {
          params.category = selectedCategory;
        }

        if (selectedType !== "all") {
          params.eventType = selectedType;
        }

        if (search.length >= 2) {
          params.search = search;
        }

        const eventsResponse = await getEvents(params);

        const nextEvents = Array.isArray(eventsResponse?.data)
          ? eventsResponse.data
          : [];

        setEvents(nextEvents);

        setPagination(
          eventsResponse?.pagination || {
            page: 1,
            totalPages: 1,
            hasNextPage: false,
          }
        );

        if (
          selectedCategory === "all" &&
          selectedType === "all" &&
          !search
        ) {
          const featuredResponse = await getFeaturedEvents(5);

          const validFeaturedEvents = Array.isArray(featuredResponse?.data)
            ? featuredResponse.data.filter(
                (event) =>
                  event &&
                  event.featured === true &&
                  event.isPublished === true &&
                  event.isDeleted !== true &&
                  event.isArchived !== true
              )
            : [];

          setFeaturedEvents(validFeaturedEvents);
        } else {
          setFeaturedEvents([]);
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedCategory, selectedType, search]
  );

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const loadMore = useCallback(async () => {
    if (
      loading ||
      loadingMore ||
      !pagination?.hasNextPage
    ) {
      return;
    }

    setLoadingMore(true);

    try {
      const params = {
        page: (pagination.page || 1) + 1,
        limit: PAGE_SIZE,
        sort: "startDate",
        published: true,
      };

      if (selectedCategory !== "all") {
        params.category = selectedCategory;
      }

      if (selectedType !== "all") {
        params.eventType = selectedType;
      }

      if (search.length >= 2) {
        params.search = search;
      }

      const response = await getEvents(params);

      const nextEvents = Array.isArray(response?.data)
        ? response.data
        : [];

      setEvents((current) => {
        const existingIds = new Set(
          current.map((item) => item._id || item.id)
        );

        return [
          ...current,
          ...nextEvents.filter(
            (item) =>
              !existingIds.has(item._id || item.id)
          ),
        ];
      });

      setPagination(response?.pagination || pagination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  }, [
    loading,
    loadingMore,
    pagination,
    selectedCategory,
    selectedType,
    search,
  ]);

  const visibleEvents = useMemo(() => {
    if (!featuredEvents.length) return events;

    const featuredIds = new Set(
      featuredEvents.map((item) => String(item._id || item.id))
    );

    return events.filter(
      (event) =>
        !featuredIds.has(String(event._id || event.id))
    );
  }, [events, featuredEvents]);

  const openEvent = (item) => {
    navigation.navigate("EventDetails", {
      eventId: item._id,
      slug: item.slug,
    });
  };

  const renderFeaturedEvent = ({ item }) => {
    const image = getEventImage(item);

    return (
      <Pressable
        style={styles.featuredCard}
        onPress={() => openEvent(item)}
      >
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.featuredImage}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.featuredImage,
              styles.imagePlaceholder,
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={42}
              color={COLORS.primary}
            />
          </View>
        )}

        <View style={styles.featuredContent}>
          <View style={styles.featuredLabel}>
            <Ionicons
              name="star"
              size={12}
              color={COLORS.secondary}
            />
            <Text style={styles.featuredLabelText}>
              FEATURED EVENT
            </Text>
          </View>

          <Text style={styles.featuredTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.metaRow}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={COLORS.textSecondary}
            />
            <Text style={styles.metaText}>
              {formatDate(item.startDate)}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons
              name="location-outline"
              size={14}
              color={COLORS.textSecondary}
            />
            <Text style={styles.metaText} numberOfLines={1}>
              {getEventLocation(item)}
            </Text>
          </View>

          <View style={styles.featuredAction}>
            <Text style={styles.featuredActionText}>
              Explore Event
            </Text>
            <Ionicons
              name="arrow-forward"
              size={15}
              color={COLORS.white}
            />
          </View>
        </View>
      </Pressable>
    );
  };

  const renderEvent = ({ item }) => {
    const image = getEventImage(item);

    return (
      <Pressable
        style={styles.eventCard}
        onPress={() => openEvent(item)}
      >
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.eventImage}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.eventImage,
              styles.imagePlaceholder,
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={30}
              color={COLORS.primary}
            />
          </View>
        )}

        <View style={styles.eventContent}>
          <View style={styles.eventTopRow}>
            <Text style={styles.eventCategory}>
              {formatCategory(item.category)}
            </Text>

            {!!item.featured && (
              <Ionicons
                name="star"
                size={14}
                color={COLORS.secondary}
              />
            )}
          </View>

          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.title || "Untitled Event"}
          </Text>

          {!!item.shortDescription && (
            <Text style={styles.eventDescription} numberOfLines={2}>
              {item.shortDescription}
            </Text>
          )}

          <View style={styles.eventMeta}>
            <View style={styles.metaRow}>
              <Ionicons
                name="calendar-outline"
                size={13}
                color={COLORS.textSecondary}
              />
              <Text style={styles.metaText}>
                {formatDate(item.startDate)}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Ionicons
                name="location-outline"
                size={13}
                color={COLORS.textSecondary}
              />
              <Text style={styles.metaText} numberOfLines={1}>
                {getEventLocation(item)}
              </Text>
            </View>
          </View>

          <View style={styles.eventFooter}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {formatCategory(item.eventType || "physical")}
              </Text>
            </View>

            <View style={styles.viewEvent}>
              <Text style={styles.viewEventText}>
                View Event
              </Text>
              <Ionicons
                name="arrow-forward"
                size={14}
                color={COLORS.primary}
              />
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

 const listHeader = (
  <View>
    <View style={styles.heading}>
      <View style={styles.headingTopRow}>
        <Image
          source={require("../../../assets/jvp-logo.png")}
          style={styles.headingLogo}
          resizeMode="contain"
        />

        <Text style={styles.eyebrow}>
          JUMUIYA YA VIJANA WA PWANI
        </Text>
      </View>

        <Text style={styles.headingTitle}>
          Programmes & Events
        </Text>

        <Text style={styles.headingSubtitle}>
          Discover JVP events, leadership programmes, trainings,
          forums and opportunities to connect and make an impact.
        </Text>

        <View style={styles.headingHighlights}>
          <View style={styles.highlightItem}>
            <Ionicons
              name="people-outline"
              size={15}
              color={COLORS.primary}
            />
            <Text style={styles.highlightText}>Connect</Text>
          </View>

          <View style={styles.highlightDivider} />

          <View style={styles.highlightItem}>
            <Ionicons
              name="bulb-outline"
              size={15}
              color={COLORS.primary}
            />
            <Text style={styles.highlightText}>Learn</Text>
          </View>

          <View style={styles.highlightDivider} />

          <View style={styles.highlightItem}>
            <Ionicons
              name="trending-up-outline"
              size={15}
              color={COLORS.primary}
            />
            <Text style={styles.highlightText}>Grow</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons
          name="search-outline"
          size={20}
          color={COLORS.textSecondary}
        />

        <TextInput
          style={styles.searchInput}
          placeholder="Search events and programmes..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
        />

        {!!searchText && (
          <Pressable
            onPress={() => setSearchText("")}
            hitSlop={10}
          >
            <Ionicons
              name="close-circle"
              size={19}
              color={COLORS.textSecondary}
            />
          </Pressable>
        )}
      </View>

      <View style={styles.filterSection}>
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionTitle}>
            Explore Categories
          </Text>
          <Ionicons
            name="options-outline"
            size={18}
            color={COLORS.textSecondary}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {CATEGORIES.map((item) => {
            const selected = selectedCategory === item.value;

            return (
              <Pressable
                key={item.value}
                onPress={() => setSelectedCategory(item.value)}
                style={[
                  styles.categoryChip,
                  selected && styles.categoryChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selected && styles.categoryTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.sectionTitle}>
          Event Format
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {EVENT_TYPES.map((item) => {
            const selected = selectedType === item.value;

            return (
              <Pressable
                key={item.value}
                onPress={() => setSelectedType(item.value)}
                style={[
                  styles.categoryChip,
                  selected && styles.categoryChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selected && styles.categoryTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {featuredEvents.length > 0 && (
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionTitle}>
              Featured Events
            </Text>

            <View style={styles.featuredBadge}>
              <Ionicons
                name="star"
                size={12}
                color={COLORS.secondary}
              />
              <Text style={styles.featuredBadgeText}>
                HIGHLIGHTS
              </Text>
            </View>
          </View>

          <FlatList
            data={featuredEvents}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) =>
              String(item._id || item.id || index)
            }
            renderItem={renderFeaturedEvent}
            contentContainerStyle={styles.featuredList}
          />
        </View>
      )}

      <View style={styles.latestHeading}>
        <View>
          <Text style={styles.sectionTitle}>
            {search.length >= 2
              ? "Search Results"
              : selectedCategory === "all"
                ? "All Events"
                : formatCategory(selectedCategory)}
          </Text>

          <Text style={styles.latestSubtitle}>
            {search.length >= 2
              ? `Results for "${search}"`
              : "Explore upcoming and published JVP events"}
          </Text>
        </View>

        <View style={styles.eventCountBadge}>
          <Text style={styles.eventCountText}>
            {events.length}
          </Text>
        </View>
      </View>
    </View>
  );

  const emptyState = (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name="calendar-outline"
          size={34}
          color={COLORS.primary}
        />
      </View>

      <Text style={styles.emptyTitle}>
        No Events Found
      </Text>

      <Text style={styles.emptyMessage}>
        {search.length >= 2
          ? "We couldn't find events matching your search. Try another keyword."
          : "Published JVP events will appear here when available."}
      </Text>

      {(searchText || selectedCategory !== "all" || selectedType !== "all") && (
        <Pressable
          style={styles.clearFiltersButton}
          onPress={() => {
            setSearchText("");
            setSearch("");
            setSelectedCategory("all");
            setSelectedType("all");
          }}
        >
          <Text style={styles.clearFiltersText}>
            Clear Filters
          </Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.white}
      />

      {loading && events.length === 0 && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />

          <Text style={styles.loadingText}>
            Loading JVP Programmes...
          </Text>
        </View>
      ) : error && events.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.errorIcon}>
            <Ionicons
              name="cloud-offline-outline"
              size={38}
              color={COLORS.danger}
            />
          </View>

          <Text style={styles.errorTitle}>
            Unable to load events
          </Text>

          <Text style={styles.errorMessage}>
            {error}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={() => loadEvents()}
          >
            <Ionicons
              name="refresh"
              size={15}
              color={COLORS.white}
            />
            <Text style={styles.retryText}>
              Try Again
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={visibleEvents}
          keyExtractor={(item, index) =>
            String(item._id || item.id || item.slug || index)
          }
          renderItem={renderEvent}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={emptyState}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadEvents({ refresh: true })}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                style={styles.footerLoader}
                color={COLORS.primary}
              />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  listContent: {
    paddingBottom: SIZES.xl,
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SIZES.xl,
  },

  loadingText: {
    marginTop: SIZES.md,
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },

  heading: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
  },

  headingTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 13,
  },

 headingLogo: {
  width: 46,
  height: 46,
},

  eyebrow: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  headingTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.primaryDark,
    letterSpacing: -0.7,
    marginTop: 4,
  },

  headingSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 8,
    maxWidth: 340,
  },

  headingHighlights: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 14,
  },

  highlightItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  highlightText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.text,
  },

  highlightDivider: {
    height: 15,
    width: 1,
    backgroundColor: COLORS.border,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    marginHorizontal: SIZES.md,
    paddingHorizontal: SIZES.md,
    height: 52,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  searchInput: {
    flex: 1,
    marginLeft: 9,
    color: COLORS.text,
    fontSize: 14,
  },

  filterSection: {
    marginTop: 22,
  },

  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.md,
    marginBottom: 2,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.3,
  },

  categoryList: {
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.sm,
    paddingBottom: 3,
    gap: 8,
  },

  categoryChip: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.round,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },

  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  categoryText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },

  categoryTextActive: {
    color: COLORS.white,
  },

  featuredSection: {
    marginTop: 25,
  },

  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.secondaryLight,
    borderRadius: RADIUS.round,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  featuredBadgeText: {
    color: COLORS.text,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  featuredList: {
    paddingHorizontal: SIZES.md,
    gap: SIZES.md,
  },

  featuredCard: {
    width: 285,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  featuredImage: {
    width: "100%",
    height: 150,
    backgroundColor: COLORS.primaryLight,
  },

  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
  },

  featuredContent: {
    padding: SIZES.md,
  },

  featuredLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  featuredLabelText: {
    color: COLORS.secondary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  featuredTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 9,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },

  metaText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    flexShrink: 1,
  },

  featuredAction: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 7,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
  },

  featuredActionText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",
  },

  latestHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.md,
    marginTop: 27,
    marginBottom: 13,
  },

  latestSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 5,
  },

  eventCountBadge: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 8,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  eventCountText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
  },

  eventCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.md,
    marginBottom: SIZES.md,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  eventImage: {
    width: 112,
    minHeight: 166,
    backgroundColor: COLORS.primaryLight,
  },

  eventContent: {
    flex: 1,
    padding: 11,
    justifyContent: "center",
  },

  eventTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  eventCategory: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  eventTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 19,
    marginTop: 6,
  },

  eventDescription: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
  },

  eventMeta: {
    marginTop: 8,
  },

  eventFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 11,
  },

  typeBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.round,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  typeBadgeText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: "800",
    textTransform: "capitalize",
  },

  viewEvent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  viewEventText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "900",
  },

  emptyState: {
    alignItems: "center",
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.xxl,
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SIZES.md,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
  },

  emptyMessage: {
    color: COLORS.textSecondary,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },

  clearFiltersButton: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.round,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 17,
  },

  clearFiltersText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
  },

  errorIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },

  errorTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
    marginTop: SIZES.md,
  },

  errorMessage: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 6,
  },

  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SIZES.lg,
    paddingVertical: 12,
    marginTop: SIZES.md,
  },

  retryText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 12,
  },

  footerLoader: {
    marginVertical: SIZES.lg,
  },
});