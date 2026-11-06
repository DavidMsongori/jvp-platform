
import React, {
  useCallback,
  useState,
} from "react";

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  StatusBar,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { getNews } from "../../services/newsService";

import { COLORS, SIZES, RADIUS } from "../../constants/theme";

const getFullName = (article) => article?.title || "Latest JVP News";

const formatDate = (date) => {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getArticleDate = (article) =>
  article?.publishedAt ||
  article?.createdAt ||
  article?.updatedAt;

const CATEGORY_LABELS = {
  announcements: "Announcements",
  opportunities: "Opportunities",
  leadership: "Leadership",
  programmes: "Programmes",
  events: "Events",
  partnerships: "Partnerships",
  community: "Community",
  statements: "Statements",
  success_stories: "Success Stories",
};

export default function HomeScreen({ navigation }) {
  const [latestNews, setLatestNews] = useState(null);
  const [loadingNews, setLoadingNews] = useState(true);
  const [newsError, setNewsError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadLatestNews = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoadingNews(true);
    }

    setNewsError("");

    try {
      const response = await getNews({
        page: 1,
        limit: 1,
        sort: "latest",
      });

      const articles = Array.isArray(response?.articles)
        ? response.articles
        : [];

      setLatestNews(articles[0] || null);
    } catch (error) {
      setNewsError(
        error?.response?.data?.message ||
        "Unable to load the latest news."
      );
    } finally {
      setLoadingNews(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh the latest news whenever Home becomes active.
  useFocusEffect(
    useCallback(() => {
      loadLatestNews();
    }, [loadLatestNews])
  );

  const openLatestNews = () => {
    if (!latestNews?.slug) return;

    navigation.navigate("NewsArticle", {
      slug: latestNews.slug,
    });
  };

  const openCommunity = () => {
    navigation.navigate("Community");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.white}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadLatestNews(true)}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerBrand}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../../../assets/jvp-logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.brandDetails}>
              <Text style={styles.greeting}>WELCOME TO</Text>
              <Text style={styles.logo}>JVP CONNECT</Text>
              <Text style={styles.tagline}>
                Connecting Youth, Empowering Communities.
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.notificationButton}
            onPress={openCommunity}
          >
            <Ionicons
              name="notifications-outline"
              size={23}
              color={COLORS.primary}
            />
          </Pressable>
        </View>

        {/* WELCOME BANNER */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeContent}>
            <View style={styles.welcomeBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.welcomeBadgeText}>
                YOUR JVP COMMUNITY
              </Text>
            </View>

            <Text style={styles.welcomeTitle}>
              Your Voice.{"\n"}Your Future.
            </Text>

            <Text style={styles.welcomeDescription}>
              Connect, participate and create meaningful
              change across the Coast.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.exploreButton,
                pressed && styles.pressed,
              ]}
              onPress={() => navigation.navigate("Programmes")}
            >
              <Text style={styles.exploreButtonText}>
                Explore JVP
              </Text>

              <Ionicons
                name="arrow-forward"
                size={16}
                color={COLORS.primary}
              />
            </Pressable>
          </View>

          <View style={styles.welcomeIllustration}>
            <Ionicons
              name="people"
              size={76}
              color={COLORS.white}
            />

            <View style={styles.illustrationBadge}>
              <Ionicons
                name="star"
                size={15}
                color={COLORS.primary}
              />
            </View>
          </View>
        </View>

        {/* MEMBERSHIP */}
        <SectionTitle
          title="My Membership"
          subtitle="Your JVP membership at a glance"
        />

        <Pressable
          style={({ pressed }) => [
            styles.membershipCard,
            pressed && styles.cardPressed,
          ]}
          onPress={() => navigation.navigate("Profile")}
        >
          <View style={styles.membershipIcon}>
            <Ionicons
              name="id-card-outline"
              size={26}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.membershipDetails}>
            <Text style={styles.membershipTitle}>
              Membership Information
            </Text>

            <Text style={styles.membershipDescription}>
              View your membership details, status and registered information.
            </Text>

            <Text style={styles.membershipLink}>
              View My Membership
              <Text>  →</Text>
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={21}
            color={COLORS.textSecondary}
          />
        </Pressable>

        {/* QUICK ACCESS */}
        <SectionTitle
          title="Quick Access"
          subtitle="Explore everything JVP Connect offers"
        />

        <View style={styles.quickGrid}>
          <QuickAction
            icon="calendar-outline"
            title="Events"
            description="Upcoming activities"
            color="#EAF2EC"
            onPress={() => navigation.navigate("Programmes")}
          />

          <QuickAction
            icon="rocket-outline"
            title="Programmes"
            description="JVP initiatives"
            color="#F8F0DC"
            onPress={() => navigation.navigate("Programmes")}
          />

          <QuickAction
            icon="briefcase-outline"
            title="Opportunities"
            description="Explore opportunities"
            color="#EAF0F8"
            onPress={() => navigation.navigate("Programmes")}
          />

          <QuickAction
            icon="newspaper-outline"
            title="News & Updates"
            description="Latest JVP stories"
            color="#F7EDEE"
            onPress={openCommunity}
          />

          <QuickAction
            icon="chatbubbles-outline"
            title="Messages"
            description="Connect privately"
            color="#EEEAF8"
            onPress={() => navigation.navigate("Messages")}
          />

          <QuickAction
            icon="people-outline"
            title="Community"
            description="Stay connected"
            color="#E8F2F5"
            onPress={openCommunity}
          />
        </View>

        {/* LATEST NEWS */}
        <SectionTitle
          title="Latest News & Announcements"
          subtitle="The latest updates from JVP"
          action="View all"
          onActionPress={openCommunity}
        />

        {loadingNews ? (
          <View style={styles.newsLoading}>
            <ActivityIndicator
              size="small"
              color={COLORS.primary}
            />
            <Text style={styles.newsLoadingText}>
              Loading latest news...
            </Text>
          </View>
        ) : latestNews ? (
          <Pressable
            style={({ pressed }) => [
              styles.newsCard,
              pressed && styles.cardPressed,
            ]}
            onPress={openLatestNews}
            disabled={!latestNews.slug}
          >
            {latestNews.featuredImage ? (
              <Image
                source={{ uri: latestNews.featuredImage }}
                style={styles.newsImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.newsImage, styles.newsPlaceholder]}>
                <Ionicons
                  name="newspaper-outline"
                  size={42}
                  color={COLORS.primary}
                />
              </View>
            )}

            <View style={styles.newsContent}>
              <View style={styles.newsTopRow}>
                <View style={styles.newsBadge}>
                  <Ionicons
                    name="megaphone-outline"
                    size={13}
                    color={COLORS.primary}
                  />

                  <Text style={styles.newsBadgeText}>
                    {CATEGORY_LABELS[latestNews.category] ||
                      latestNews.category ||
                      "JVP NEWS"}
                  </Text>
                </View>

                <Text style={styles.newsDate}>
                  {formatDate(getArticleDate(latestNews))}
                </Text>
              </View>

              <Text style={styles.newsTitle} numberOfLines={2}>
                {getFullName(latestNews)}
              </Text>

              {!!latestNews.excerpt && (
                <Text
                  style={styles.newsDescription}
                  numberOfLines={3}
                >
                  {latestNews.excerpt}
                </Text>
              )}

              <View style={styles.newsReadMore}>
                <Text style={styles.newsReadMoreText}>
                  Read Full Story
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={COLORS.primary}
                />
              </View>
            </View>
          </Pressable>
        ) : (
          <View style={styles.newsEmpty}>
            <Ionicons
              name={
                newsError
                  ? "cloud-offline-outline"
                  : "newspaper-outline"
              }
              size={34}
              color={COLORS.textSecondary}
            />

            <Text style={styles.newsEmptyTitle}>
              {newsError
                ? "News temporarily unavailable"
                : "No published news yet"}
            </Text>

            <Text style={styles.newsEmptyDescription}>
              {newsError ||
                "The latest JVP news and announcements will appear here."}
            </Text>

            <Pressable
              onPress={() => loadLatestNews()}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        )}

        {/* COASTAL COUNTIES */}
        <SectionTitle
          title="Our Coastal Counties"
          subtitle="One community across six counties"
        />

        <View style={styles.countyContainer}>
          {[
            "Mombasa",
            "Kwale",
            "Kilifi",
            "Tana River",
            "Lamu",
            "Taita Taveta",
          ].map((county) => (
            <View key={county} style={styles.countyChip}>
              <Ionicons
                name="location-outline"
                size={13}
                color={COLORS.primary}
              />

              <Text style={styles.countyText}>
                {county}
              </Text>
            </View>
          ))}
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Image
            source={require("../../../assets/jvp-logo.png")}
            style={styles.footerLogo}
            resizeMode="contain"
          />

          <Text style={styles.footerTitle}>
            JUMUIYA YA VIJANA WA PWANI
          </Text>

          <Text style={styles.footerTagline}>
            Connecting Youth Across the Coast
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({
  title,
  subtitle,
  action,
  onActionPress,
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>{title}</Text>

        {!!subtitle && (
          <Text style={styles.sectionSubtitle}>
            {subtitle}
          </Text>
        )}
      </View>

      {!!action && (
        <Pressable onPress={onActionPress} hitSlop={10}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

function QuickAction({
  icon,
  title,
  description,
  color,
  onPress,
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.quickCard,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.quickIcon, { backgroundColor: color }]}>
        <Ionicons
          name={icon}
          size={25}
          color={COLORS.primary}
        />
      </View>

      <Text style={styles.quickTitle}>{title}</Text>

      <Text style={styles.quickDescription}>
        {description}
      </Text>

      <View style={styles.quickArrow}>
        <Ionicons
          name="arrow-up-forward"
          size={14}
          color={COLORS.primary}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    flex: 1,
  },

  logoContainer: {
    width: 49,
    height: 49,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  logoImage: {
    width: 45,
    height: 45,
  },

  brandDetails: {
    flex: 1,
  },

  greeting: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.6,
    color: COLORS.textSecondary,
  },

  logo: {
    fontSize: 19,
    fontWeight: "900",
    color: COLORS.primary,
    marginTop: 2,
  },

  tagline: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 3,
  },

  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  welcomeCard: {
    marginHorizontal: 18,
    marginTop: 18,
    marginBottom: 8,
    backgroundColor: COLORS.primaryDark,
    borderRadius: 23,
    padding: 19,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },

  welcomeContent: {
    flex: 1,
    zIndex: 1,
  },

  welcomeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.13)",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: RADIUS.round,
    gap: 6,
    marginBottom: 13,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
  },

  welcomeBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: 1,
  },

  welcomeTitle: {
    fontSize: 25,
    fontWeight: "900",
    color: COLORS.white,
    lineHeight: 31,
  },

  welcomeDescription: {
    fontSize: 11,
    lineHeight: 18,
    color: "#E4EEE7",
    marginTop: 8,
    marginBottom: 16,
    maxWidth: 220,
  },

  exploreButton: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  exploreButtonText: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 11,
  },

  welcomeIllustration: {
    width: 91,
    height: 91,
    borderRadius: 46,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
  },

  illustrationBadge: {
    position: "absolute",
    top: 1,
    right: 0,
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: COLORS.secondary,
    justifyContent: "center",
    alignItems: "center",
  },

  sectionHeader: {
    marginHorizontal: 20,
    marginTop: 22,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionHeading: {
    flex: 1,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.text,
  },

  sectionSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  sectionAction: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
    marginLeft: 8,
  },

  membershipCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 18,
    padding: 15,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  membershipIcon: {
    width: 49,
    height: 49,
    borderRadius: 15,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  membershipDetails: {
    flex: 1,
  },

  membershipTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.text,
  },

  membershipDescription: {
    fontSize: 10,
    lineHeight: 16,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  membershipLink: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primary,
    marginTop: 7,
  },

  quickGrid: {
    marginHorizontal: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },

  quickCard: {
    width: "48.5%",
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 137,
  },

  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 11,
  },

  quickTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.text,
  },

  quickDescription: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  quickArrow: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 25,
    height: 25,
    borderRadius: 9,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  newsLoading: {
    marginHorizontal: 18,
    padding: 28,
    backgroundColor: COLORS.white,
    borderRadius: 17,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  newsLoadingText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 9,
  },

  newsCard: {
    marginHorizontal: 18,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  newsImage: {
    width: "100%",
    height: 165,
    backgroundColor: COLORS.primaryLight,
  },

  newsPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },

  newsContent: {
    padding: 15,
  },

  newsTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 7,
  },

  newsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: RADIUS.round,
  },

  newsBadgeText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  newsDate: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },

  newsTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "900",
    color: COLORS.text,
    marginTop: 11,
  },

  newsDescription: {
    fontSize: 11,
    lineHeight: 18,
    color: COLORS.textSecondary,
    marginTop: 7,
  },

  newsReadMore: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 7,
    marginTop: 13,
  },

  newsReadMoreText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "900",
  },

  newsEmpty: {
    marginHorizontal: 18,
    padding: 24,
    backgroundColor: COLORS.white,
    borderRadius: 17,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  newsEmptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 10,
    textAlign: "center",
  },

  newsEmptyDescription: {
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 5,
  },

  retryButton: {
    marginTop: 12,
    paddingHorizontal: 17,
    paddingVertical: 9,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
  },

  retryText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "800",
  },

  countyContainer: {
    marginHorizontal: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  countyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.round,
  },

  countyText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primary,
  },

  footer: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 25,
  },

  footerLogo: {
    width: 48,
    height: 48,
    marginBottom: 9,
  },

  footerTitle: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
    color: COLORS.textSecondary,
  },

  footerTagline: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 6,
  },

  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },

  cardPressed: {
    opacity: 0.8,
  },
});
