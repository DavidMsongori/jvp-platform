
import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";

import { COLORS } from "../constants/theme";

export default function PlaceholderScreen({ route }) {
  const title = route?.params?.title || "Coming Soon";
  const subtitle =
    route?.params?.subtitle ||
    "This section is currently being developed.";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },

  title: {
    fontSize: 25,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
