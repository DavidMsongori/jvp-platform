
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
  getNews,
  getFeaturedNews,
  getNewsCategories,
} from "../../services/newsService";

import { COLORS, SIZES, RADIUS } from "../../constants/theme";

const PAGE_SIZE = 8;

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

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Unable to load news. Please try again.";

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
  article?.publishedAt || article?.createdAt || article?.updatedAt;

const getCategoryLabel = (category) =>
  CATEGORY_LABELS[category] ||
  category?.replace(/_/g, " ") ||
  "JVP News";

export default function NewsScreen({ navigation }) {
  const [articles, setArticles] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [categories, setCategories] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
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

  const loadCategories = useCallback(async () => {
    try {
      const response = await getNewsCategories();

      setCategories(
        Array.isArray(response?.categories)
          ? response.categories
          : []
      );
    } catch (err) {
      console.warn("News categories could not be loaded:", err);
    }
  }, []);

  const loadNews = useCallback(
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
          sort: "latest",
        };

        if (selectedCategory !== "all") {
          params.category = selectedCategory;
        }

        if (search.length >= 2) {
          params.search = search;
        }

        const [newsResponse, featuredResponse] = await Promise.all([
          getNews(params),
          getFeaturedNews(1),
        ]);

        setArticles(
          Array.isArray(newsResponse?.articles)
            ? newsResponse.articles
            : []
        );

        setPagination(
          newsResponse?.pagination || {
            page: 1,
            pages: 1,
            hasNextPage: false,
          }
        );

        const featuredArticles = Array.isArray(
          featuredResponse?.articles
        )
          ? featuredResponse.articles
          : [];

        setFeatured(
          selectedCategory === "all" && !search
            ? featuredArticles[0] || null
            : null
        );
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedCategory, search]
  );

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

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
        sort: "latest",
      };

      if (selectedCategory !== "all") {
        params.category = selectedCategory;
      }

      if (search.length >= 2) {
        params.search = search;
      }

      const response = await getNews(params);

      const nextArticles = Array.isArray(response?.articles)
        ? response.articles
        : [];

      setArticles((current) => {
        const existingIds = new Set(
          current.map((item) => item._id || item.id || item.slug)
        );

        return [
          ...current,
          ...nextArticles.filter(
            (item) =>
              !existingIds.has(item._id || item.id || item.slug)
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
    search,
  ]);

  const openArticle = useCallback(
    (article) => {
      if (!article?.slug) return;

      navigation.navigate("NewsArticle", {
        slug: article.slug,
      });
    },
    [navigation]
  );

  const visibleArticles = useMemo(() => {
    if (!featured?.slug) return articles;

    return articles.filter(
      (article) => article.slug !== featured.slug
    );
  }, [articles, featured]);

  const categoryOptions = useMemo(
    () => [
      { value: "all", label: "All News" },
      ...categories.map((item) => ({
        value: item._id,
        label: getCategoryLabel(item._id),
        count: item.count,
      })),
    ],
    [categories]
  );

  const renderCategory = ({ item }) => {
    const selected = selectedCategory === item.value;

    return (
      <Pressable
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

        {item.count !== undefined && item.value !== "all" && (
          <Text
            style={[
              styles.categoryCount,
              selected && styles.categoryCountActive,
            ]}
          >
            {item.count}
          </Text>
        )}
      </Pressable>
    );
  };

  const renderArticle = ({ item }) => (
    <Pressable
      style={styles.articleCard}
      onPress={() => openArticle(item)}
    >
      {item.featuredImage ? (
        <Image
          source={{ uri: item.featuredImage }}
          style={styles.articleImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.articleImage, styles.imagePlaceholder]}>
          <Ionicons
            name="newspaper-outline"
            size={27}
            color={COLORS.primary}
          />
        </View>
      )}

      <View style={styles.articleContent}>
        <Text style={styles.articleCategory} numberOfLines={1}>
          {getCategoryLabel(item.category)}
        </Text>

        <Text style={styles.articleTitle} numberOfLines={2}>
          {item.title || "Untitled Story"}
        </Text>

        {!!item.excerpt && (
          <Text style={styles.articleExcerpt} numberOfLines={2}>
            {item.excerpt}
          </Text>
        )}

        <View style={styles.articleMeta}>
          <Text style={styles.metaText}>
            {formatDate(getArticleDate(item))}
          </Text>

          <View style={styles.readMore}>
            <Text style={styles.readMoreText}>Read story</Text>
            <Ionicons
              name="arrow-forward"
              size={13}
              color={COLORS.primary}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );

  const listHeader = (
    <View>
      {/* ORGANISATION HEADER */}
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

        <View style={styles.newsLabel}>
          <View style={styles.newsLabelDot} />
          <Text style={styles.newsLabelText}>JVP NEWSROOM</Text>
        </View>

        <Text style={styles.headingTitle}>News & Stories</Text>

        <Text style={styles.headingSubtitle}>
          Stay informed with the latest updates, opportunities,
          programmes and stories from across JVP.
        </Text>
      </View>

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <Ionicons
          name="search-outline"
          size={19}
          color={COLORS.textSecondary}
        />

        <TextInput
          style={styles.searchInput}
          placeholder="Search news and stories..."
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

      {/* CATEGORIES */}
      <View style={styles.categorySection}>
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionTitle}>Explore Categories</Text>
          <Text style={styles.sectionHint}>Swipe to explore</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {categoryOptions.map((item, index) => (
            <View key={`${item.value || item.label}-${index}`}>
              {renderCategory({ item })}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* FEATURED STORY */}
      {featured && (
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionTitle}>Featured Story</Text>

            <View style={styles.featuredBadge}>
              <Ionicons
                name="star"
                size={11}
                color={COLORS.secondary}
              />
              <Text style={styles.featuredBadgeText}>FEATURED</Text>
            </View>
          </View>

          <Pressable
            style={styles.featuredCard}
            onPress={() => openArticle(featured)}
          >
            {featured.featuredImage ? (
              <Image
                source={{ uri: featured.featuredImage }}
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
                  name="newspaper-outline"
                  size={36}
                  color={COLORS.primary}
                />
              </View>
            )}

            <View style={styles.featuredContent}>
              <Text style={styles.featuredCategory}>
                {getCategoryLabel(featured.category)}
              </Text>

              <Text style={styles.featuredTitle} numberOfLines={2}>
                {featured.title}
              </Text>

              {!!featured.excerpt && (
                <Text style={styles.featuredExcerpt} numberOfLines={2}>
                  {featured.excerpt}
                </Text>
              )}

              <View style={styles.featuredBottom}>
                <Text style={styles.featuredDate}>
                  {formatDate(getArticleDate(featured))}
                </Text>

                <View style={styles.featuredReadMore}>
                  <Text style={styles.featuredReadMoreText}>
                    Read story
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={13}
                    color={COLORS.white}
                  />
                </View>
              </View>
            </View>
          </Pressable>
        </View>
      )}

      {/* LATEST NEWS */}
      <View style={styles.latestHeading}>
        <Text style={styles.sectionTitle}>
          {search.length >= 2
            ? "Search Results"
            : selectedCategory === "all"
              ? "Latest News"
              : getCategoryLabel(selectedCategory)}
        </Text>

        <Text style={styles.latestSubtitle}>
          {search.length >= 2
            ? `Results for "${search}"`
            : "Discover what's happening across JVP"}
        </Text>
      </View>
    </View>
  );

  const emptyState = (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name="newspaper-outline"
          size={32}
          color={COLORS.primary}
        />
      </View>

      <Text style={styles.emptyTitle}>
        {search.length >= 2 ? "No Results Found" : "No News Available"}
      </Text>

      <Text style={styles.emptyMessage}>
        {search.length >= 2
          ? "We couldn't find any stories matching your search. Try another keyword."
          : "Published JVP news and stories will appear here."}
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
    >
      {loading && articles.length === 0 && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading JVP Newsroom...</Text>
        </View>
      ) : error && articles.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons
            name="cloud-offline-outline"
            size={40}
            color={COLORS.danger}
          />

          <Text style={styles.errorTitle}>Unable to load news</Text>
          <Text style={styles.errorMessage}>{error}</Text>

          <Pressable
            style={styles.retryButton}
            onPress={() => loadNews()}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={visibleArticles}
          keyExtractor={(item, index) =>
            String(item._id || item.id || item.slug || index)
          }
          renderItem={renderArticle}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={emptyState}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadNews({ refresh: true })}
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

  topHeader: {
    paddingHorizontal: SIZES.md,
    paddingTop: 22,
    paddingBottom: SIZES.lg,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  logoContainer: {
    width: 55,
    height: 55,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    padding: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
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

  newsLabel: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.round,
    marginBottom: 10,
  },

  newsLabelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 6,
  },

  newsLabelText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },

  headingTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.6,
  },

  headingSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 6,
    maxWidth: 330,
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
    height: 48,
  },

  searchInput: {
    flex: 1,
    marginLeft: 9,
    color: COLORS.text,
    fontSize: 13,
  },

  categorySection: {
    marginTop: 25,
  },

  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SIZES.sm,
    paddingHorizontal: SIZES.md,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.text,
  },

  sectionHint: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },

  categoryList: {
    paddingHorizontal: SIZES.md,
    paddingTop: 4,
    paddingBottom: 4,
    gap: 8,
  },

  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.round,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 6,
  },

  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  categoryText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },

  categoryTextActive: {
    color: COLORS.white,
  },

  categoryCount: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: "800",
  },

  categoryCountActive: {
    color: COLORS.white,
  },

  featuredSection: {
    marginTop: 24,
    paddingHorizontal: SIZES.md,
  },

  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.secondaryLight,
    borderRadius: RADIUS.round,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  featuredBadgeText: {
    color: COLORS.text,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  featuredCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  featuredImage: {
    width: "100%",
    height: 175,
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

  featuredCategory: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  featuredTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 23,
    marginTop: 5,
  },

  featuredExcerpt: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },

  featuredBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 13,
    flexWrap: "wrap",
    gap: 6,
  },

  featuredDate: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },

  featuredReadMore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },

  featuredReadMoreText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "800",
  },

  latestHeading: {
    paddingHorizontal: SIZES.md,
    marginTop: 27,
    marginBottom: SIZES.md,
  },

  latestSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },

  articleCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.md,
    marginBottom: 12,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  articleImage: {
    width: 108,
    minHeight: 130,
    backgroundColor: COLORS.primaryLight,
  },

  articleContent: {
    flex: 1,
    padding: SIZES.sm,
    justifyContent: "center",
  },

  articleCategory: {
    color: COLORS.primary,
    fontSize: 8,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 5,
  },

  articleTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },

  articleExcerpt: {
    color: COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5,
  },

  articleMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 9,
    gap: 4,
  },

  metaText: {
    color: COLORS.textSecondary,
    fontSize: 9,
  },

  readMore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  readMoreText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: "800",
  },

  emptyState: {
    alignItems: "center",
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.xl,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SIZES.md,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },

  emptyMessage: {
    color: COLORS.textSecondary,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7,
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
    fontSize: 13,
  },

  errorTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
    marginTop: SIZES.md,
  },

  errorMessage: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
  },

  retryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SIZES.lg,
    paddingVertical: 10,
    marginTop: SIZES.md,
  },

  retryText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 12,
  },

  footerLoader: {
    marginVertical: SIZES.md,
  },
});
