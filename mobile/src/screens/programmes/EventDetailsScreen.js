import React, { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { getEventBySlug } from "../../services/eventService";

import { COLORS, SIZES, RADIUS } from "../../constants/theme";

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Unable to load event details. Please try again.";

const formatDate = (date) => {
  if (!date) return "To be announced";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "To be announced";

  return parsed.toLocaleDateString("en-KE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatCategory = (value) =>
  value
    ? value.replace(/_/g, " ").replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      )
    : "JVP Event";

const getEventImage = (event) =>
  event?.coverImage?.url ||
  event?.coverImage?.secure_url ||
  event?.coverImage ||
  null;

export default function EventDetailsScreen({ route }) {
  const { slug } = route.params || {};

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadEvent = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      if (!slug) {
        throw new Error("Event link is incomplete.");
      }

      const response = await getEventBySlug(slug);

      if (!response?.success || !response?.data) {
        throw new Error("Event details could not be found.");
      }

      setEvent(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [slug]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  if (loading && !event) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </SafeAreaView>
    );
  }

  if (error && !event) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons
          name="cloud-offline-outline"
          size={44}
          color={COLORS.danger}
        />

        <Text style={styles.errorTitle}>
          Unable to load event
        </Text>

        <Text style={styles.errorMessage}>{error}</Text>

        <Pressable
          style={styles.retryButton}
          onPress={() => loadEvent()}
        >
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const image = getEventImage(event);
  const venue = event?.venue || {};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadEvent(true)}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.coverImage, styles.imagePlaceholder]}>
            <Ionicons
              name="calendar-outline"
              size={54}
              color={COLORS.primary}
            />
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {formatCategory(event?.category)}
            </Text>
          </View>

          <Text style={styles.title}>
            {event?.title || "JVP Event"}
          </Text>

          {!!event?.shortDescription && (
            <Text style={styles.shortDescription}>
              {event.shortDescription}
            </Text>
          )}

          <View style={styles.informationCard}>
            <View style={styles.informationRow}>
              <View style={styles.informationIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.informationText}>
                <Text style={styles.informationLabel}>Start Date</Text>
                <Text style={styles.informationValue}>
                  {formatDate(event?.startDate)}
                </Text>
              </View>
            </View>

            <View style={styles.informationDivider} />

            <View style={styles.informationRow}>
              <View style={styles.informationIcon}>
                <Ionicons
                  name="calendar-number-outline"
                  size={20}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.informationText}>
                <Text style={styles.informationLabel}>End Date</Text>
                <Text style={styles.informationValue}>
                  {formatDate(event?.endDate)}
                </Text>
              </View>
            </View>

            <View style={styles.informationDivider} />

            <View style={styles.informationRow}>
              <View style={styles.informationIcon}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.informationText}>
                <Text style={styles.informationLabel}>Venue</Text>
                <Text style={styles.informationValue}>
                  {event?.eventType === "virtual"
                    ? "Online Event"
                    : venue?.name || "Venue to be announced"}
                </Text>

                {!!venue?.address && (
                  <Text style={styles.informationSubtext}>
                    {venue.address}
                  </Text>
                )}

                {!!venue?.county && (
                  <Text style={styles.informationSubtext}>
                    {venue.county}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.informationDivider} />

            <View style={styles.informationRow}>
              <View style={styles.informationIcon}>
                <Ionicons
                  name="laptop-outline"
                  size={20}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.informationText}>
                <Text style={styles.informationLabel}>Event Format</Text>
                <Text style={styles.informationValue}>
                  {formatCategory(event?.eventType)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>About This Event</Text>

            <Text style={styles.description}>
              {event?.description ||
                event?.shortDescription ||
                "More information about this event will be available soon."}
            </Text>
          </View>

          {Array.isArray(event?.tags) && event.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.sectionTitle}>Topics</Text>

              <View style={styles.tagsList}>
                {event.tags.map((tag, index) => (
                  <View
                    key={`${tag}-${index}`}
                    style={styles.tag}
                  >
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {!!event?.virtualLink && (
            <View style={styles.virtualNotice}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={COLORS.primary}
              />

              <Text style={styles.virtualNoticeText}>
                This event has an online participation link. Registration
                information will be provided through the event registration
                process.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  centered: {
    flex: 1,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    padding: SIZES.xl,
  },

  loadingText: {
    marginTop: SIZES.md,
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  coverImage: {
    width: "100%",
    height: 235,
    backgroundColor: COLORS.primaryLight,
  },

  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },

  content: {
    padding: SIZES.md,
    paddingBottom: SIZES.xxl,
  },

  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.round,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  categoryText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  title: {
    color: COLORS.text,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "900",
    marginTop: SIZES.md,
  },

  shortDescription: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginTop: SIZES.sm,
  },

  informationCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SIZES.md,
    marginTop: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  informationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SIZES.sm,
    gap: SIZES.md,
  },

  informationIcon: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },

  informationText: {
    flex: 1,
  },

  informationLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },

  informationValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 3,
  },

  informationSubtext: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },

  informationDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  descriptionSection: {
    marginTop: SIZES.xl,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: SIZES.sm,
  },

  description: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 23,
  },

  tagsSection: {
    marginTop: SIZES.xl,
  },

  tagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SIZES.sm,
  },

  tag: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.round,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  tagText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "700",
  },

  virtualNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SIZES.sm,
    backgroundColor: COLORS.primaryLight,
    padding: SIZES.md,
    borderRadius: RADIUS.md,
    marginTop: SIZES.lg,
  },

  virtualNoticeText: {
    flex: 1,
    color: COLORS.primaryDark,
    fontSize: 12,
    lineHeight: 19,
  },

  errorTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
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
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SIZES.lg,
    paddingVertical: 11,
    marginTop: SIZES.md,
  },

  retryText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 12,
  },
});
