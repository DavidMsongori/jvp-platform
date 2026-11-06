import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
  getNewsArticle,
  getRelatedNews,
} from "../../services/newsService";

import { COLORS, SIZES, RADIUS } from "../../constants/theme";

const formatDate = (date) => {
  if (!date) return "JVP Newsroom";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return String(date);
  }

  return parsedDate.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatContent = (content) => {
  if (!content) return [];

  return String(content)
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
};

export default function ArticleDetailsScreen({ route, navigation }) {
  const slug = route?.params?.slug;

  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  const loadArticle = useCallback(async () => {
    if (!slug) {
      setError("The article link is invalid.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setArticle(null);
      setRelatedArticles([]);
      setImageFailed(false);

      const response = await getNewsArticle(slug);
      const fetchedArticle = response?.article;

      if (!fetchedArticle) {
        throw new Error("The requested article could not be found.");
      }

      setArticle(fetchedArticle);

      try {
        const relatedResponse = await getRelatedNews(slug, 4);
        setRelatedArticles(relatedResponse?.articles || []);
      } catch (relatedError) {
        console.warn("Could not load related articles:", relatedError);
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to load this article. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadArticle();
  }, [loadArticle]);

  const shareArticle = async () => {
    if (!article) return;

    try {
      await Share.share({
        title: article.title || "JVP News",
        message: `${article.title || "JVP News"}\n\n${
          article.excerpt || "Read this story from JVP Newsroom."
        }\n\nhttps://www.jumuiyavijana.org/news/${article.slug || ""}`,
      });
    } catch (shareError) {
      console.warn("Unable to share article:", shareError);
    }
  };

  const openRelatedArticle = (item) => {
    if (!item?.slug) return;

    navigation.push("NewsArticle", {
      slug: item.slug,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={["bottom"]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading JVP story...</Text>
      </SafeAreaView>
    );
  }

  if (error || !article) {
    return (
      <SafeAreaView style={styles.centered} edges={["bottom"]}>
        <View style={styles.errorIcon}>
          <Ionicons name="newspaper-outline" size={34} color={COLORS.primary} />
        </View>

        <Text style={styles.errorTitle}>Story not found</Text>
        <Text style={styles.errorMessage}>
          {error || "The news story could not be found."}
        </Text>

        <Pressable style={styles.retryButton} onPress={loadArticle}>
          <Ionicons name="refresh-outline" size={18} color={COLORS.white} />
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>

        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to News</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const paragraphs = formatContent(article.content);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.breadcrumb}>
          <Ionicons name="newspaper-outline" size={16} color={COLORS.primary} />
          <Text style={styles.breadcrumbText}>JVP Newsroom</Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.textSecondary} />
          <Text style={styles.breadcrumbCategory} numberOfLines={1}>
            {article.category || "News"}
          </Text>
        </View>

        <View style={styles.articleHeader}>
          <Text style={styles.category}>{article.category || "News"}</Text>

          <Text style={styles.title}>{article.title}</Text>

          {!!article.excerpt && (
            <Text style={styles.excerpt}>{article.excerpt}</Text>
          )}

          <View style={styles.metadata}>
            <View style={styles.metadataItem}>
              <Ionicons
                name="calendar-outline"
                size={15}
                color={COLORS.textSecondary}
              />
              <Text style={styles.metadataText}>
                {formatDate(article.publishedAt || article.createdAt)}
              </Text>
            </View>

            {!!article.authorName && (
              <View style={styles.metadataItem}>
                <Ionicons
                  name="person-outline"
                  size={15}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.metadataText}>
                  {article.authorName}
                </Text>
              </View>
            )}

            {typeof article.views === "number" && (
              <View style={styles.metadataItem}>
                <Ionicons
                  name="eye-outline"
                  size={15}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.metadataText}>
                  {article.views.toLocaleString()} views
                </Text>
              </View>
            )}
          </View>
        </View>

        {!!article.featuredImage && !imageFailed && (
          <Image
            source={{ uri: article.featuredImage }}
            style={styles.featuredImage}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        )}

        <View style={styles.contentSection}>
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph, index) => (
              <Text
                key={`${index}-${paragraph.slice(0, 20)}`}
                style={styles.paragraph}
              >
                {paragraph}
              </Text>
            ))
          ) : (
            <Text style={styles.emptyContent}>
              No article content is available.
            </Text>
          )}

          {Array.isArray(article.tags) && article.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.tagsHeading}>Tags</Text>
              <View style={styles.tagsList}>
                {article.tags.map((tag, index) => (
                  <View key={`${tag}-${index}`} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.shareSection}>
          <View style={styles.shareCopy}>
            <Text style={styles.shareTitle}>Enjoyed this story?</Text>
            <Text style={styles.shareSubtitle}>
              Share it with your network.
            </Text>
          </View>

          <Pressable style={styles.shareButton} onPress={shareArticle}>
            <Ionicons name="share-social-outline" size={19} color={COLORS.white} />
            <Text style={styles.shareButtonText}>Share Story</Text>
          </Pressable>
        </View>

        {relatedArticles.filter((item) => item.slug !== article.slug).length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.relatedEyebrow}>CONTINUE READING</Text>
            <Text style={styles.relatedTitle}>Related Stories</Text>

            {relatedArticles
              .filter((item) => item.slug !== article.slug)
              .slice(0, 3)
              .map((item) => (
                <Pressable
                  key={item._id || item.slug}
                  style={styles.relatedCard}
                  onPress={() => openRelatedArticle(item)}
                >
                  {item.featuredImage ? (
                    <Image
                      source={{ uri: item.featuredImage }}
                      style={styles.relatedImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.relatedImage, styles.relatedImageFallback]}>
                      <Ionicons
                        name="newspaper-outline"
                        size={25}
                        color={COLORS.primary}
                      />
                    </View>
                  )}

                  <View style={styles.relatedDetails}>
                    <Text style={styles.relatedCategory}>
                      {item.category || "News"}
                    </Text>
                    <Text style={styles.relatedCardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.relatedDate}>
                      {formatDate(item.publishedAt)}
                    </Text>
                    <Text style={styles.readMore}>Read story →</Text>
                  </View>
                </Pressable>
              ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: SIZES.xxl,
  },
  centered: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    padding: SIZES.xl,
  },
  loadingText: {
    marginTop: SIZES.md,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  errorIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SIZES.lg,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  errorMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderRadius: RADIUS.md,
    marginTop: SIZES.lg,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: "700",
  },
  backButton: {
    padding: SIZES.md,
    marginTop: SIZES.sm,
  },
  backButtonText: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.lg,
    paddingBottom: SIZES.md,
  },
  breadcrumbText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  breadcrumbCategory: {
    color: COLORS.textSecondary,
    fontSize: 12,
    flex: 1,
  },
  articleHeader: {
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.lg,
  },
  category: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.primaryLight,
    color: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.round,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: SIZES.md,
  },
  title: {
    fontSize: 27,
    lineHeight: 35,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  excerpt: {
    fontSize: 16,
    lineHeight: 25,
    color: COLORS.textSecondary,
    marginBottom: SIZES.lg,
  },
  metadata: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SIZES.md,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metadataText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  featuredImage: {
    width: "100%",
    height: 235,
    backgroundColor: COLORS.surface,
  },
  contentSection: {
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.lg,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 29,
    color: COLORS.text,
    marginBottom: SIZES.lg,
    textAlign: "left",
  },
  emptyContent: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  tagsSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SIZES.lg,
    marginTop: SIZES.md,
  },
  tagsHeading: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: SIZES.sm,
  },
  tagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SIZES.sm,
  },
  tag: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: RADIUS.round,
  },
  tagText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  shareSection: {
    marginHorizontal: SIZES.md,
    marginTop: SIZES.xl,
    padding: SIZES.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryLight,
    gap: SIZES.md,
  },
  shareCopy: {
    gap: 4,
  },
  shareTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  shareSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SIZES.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SIZES.md,
  },
  shareButtonText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 14,
  },
  relatedSection: {
    paddingHorizontal: SIZES.md,
    marginTop: SIZES.xxl,
  },
  relatedEyebrow: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  relatedTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.text,
    marginTop: 5,
    marginBottom: SIZES.md,
  },
  relatedCard: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    overflow: "hidden",
    marginBottom: SIZES.md,
    minHeight: 120,
  },
  relatedImage: {
    width: 112,
    height: "100%",
    minHeight: 120,
    backgroundColor: COLORS.primaryLight,
  },
  relatedImageFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  relatedDetails: {
    flex: 1,
    padding: SIZES.md,
    justifyContent: "center",
  },
  relatedCategory: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 5,
  },
  relatedCardTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  relatedDate: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 6,
  },
  readMore: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 7,
  },
});
