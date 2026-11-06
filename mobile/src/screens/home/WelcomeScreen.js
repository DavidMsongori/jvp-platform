
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  ScrollView,
  Image,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "../../constants/theme";

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryDark}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO SECTION */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../../../assets/jvp-logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.brandText}>
              <Text style={styles.appName}>JVP CONNECT</Text>
              <Text style={styles.brandSubtitle}>
                JUMUIYA YA VIJANA WA PWANI
              </Text>
            </View>
          </View>

          <View style={styles.heroIllustration}>
            <View style={styles.outerCircle}>
              <View style={styles.innerCircle}>
                <Ionicons
                  name="people"
                  size={90}
                  color={COLORS.white}
                />
              </View>
            </View>

            <View style={styles.floatingIconOne}>
              <Ionicons
                name="chatbubbles"
                size={23}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.floatingIconTwo}>
              <Ionicons
                name="rocket"
                size={23}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.floatingIconThree}>
              <Ionicons
                name="calendar"
                size={22}
                color={COLORS.primary}
              />
            </View>
          </View>

          <Text style={styles.heroTitle}>
            Together, We Connect.
          </Text>

          <Text style={styles.heroHighlight}>
            Together, We Transform.
          </Text>

          <Text style={styles.heroDescription}>
            One platform. Endless opportunities.
            A connected generation shaping the future
            of the Coast.
          </Text>
        </View>

        {/* MAIN CONTENT */}
        <View style={styles.content}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>
              Everything You Need to Grow
            </Text>

            <Text style={styles.sectionDescription}>
              Discover what JVP Connect makes possible.
            </Text>
          </View>

          <View style={styles.features}>
            <Feature
              icon="people-outline"
              title="Youth Connections"
              description="Connect and interact with young leaders across the Coast."
            />

            <Feature
              icon="calendar-outline"
              title="Programmes & Events"
              description="Discover activities, opportunities and upcoming events."
            />

            <Feature
              icon="megaphone-outline"
              title="News & Updates"
              description="Stay informed about the latest from JVP."
            />
          </View>

          {/* ACTION BUTTONS */}
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.primaryButtonText}>
                Get Started
              </Text>

              <Ionicons
                name="arrow-forward"
                size={21}
                color={COLORS.white}
              />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.secondaryPressed,
              ]}
              onPress={() => navigation.navigate("Register")}
            >
              <Ionicons
                name="person-add-outline"
                size={19}
                color={COLORS.primary}
              />

              <Text style={styles.secondaryButtonText}>
                Create an Account
              </Text>
            </Pressable>
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <View style={styles.footerLine} />

            <Text style={styles.footerText}>
              POWERED BY JUMUIYA YA VIJANA WA PWANI
            </Text>

            <Text style={styles.footerTagline}>
              Connecting Youth. Empowering Communities.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Feature({ icon, title, description }) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureIcon}>
        <Ionicons
          name={icon}
          size={24}
          color={COLORS.primary}
        />
      </View>

      <View style={styles.featureDetails}>
        <Text style={styles.featureTitle}>{title}</Text>

        <Text style={styles.featureDescription}>
          {description}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={19}
        color={COLORS.textSecondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  scrollContent: {
    flexGrow: 1,
  },

  hero: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 25,
    paddingTop: 25,
    paddingBottom: 35,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    alignItems: "center",
  },

  heroTop: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  logoContainer: {
    width: 57,
    height: 57,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  logoImage: {
    width: 52,
    height: 52,
    resizeMode: "contain",
  },

  brandText: {
    flex: 1,
  },

  appName: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 2,
  },

  brandSubtitle: {
    color: "#D9E9DE",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.3,
    marginTop: 5,
  },

  heroIllustration: {
    width: 190,
    height: 165,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  outerCircle: {
    width: 145,
    height: 145,
    borderRadius: 73,
    backgroundColor: "rgba(255,255,255,0.09)",
    alignItems: "center",
    justifyContent: "center",
  },

  innerCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },

  floatingIconOne: {
    position: "absolute",
    top: 13,
    right: 8,
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },

  floatingIconTwo: {
    position: "absolute",
    bottom: 10,
    left: 5,
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },

  floatingIconThree: {
    position: "absolute",
    bottom: 0,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },

  heroTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.white,
    textAlign: "center",
    marginTop: 10,
  },

  heroHighlight: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.secondary,
    textAlign: "center",
    marginTop: 4,
  },

  heroDescription: {
    fontSize: 13,
    lineHeight: 21,
    color: "#E1ECE4",
    textAlign: "center",
    marginTop: 13,
    maxWidth: 310,
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 15,
  },

  sectionHeading: {
    marginBottom: 17,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: COLORS.text,
  },

  sectionDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 5,
  },

  features: {
    gap: 11,
  },

  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 13,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },

  featureIcon: {
    width: 47,
    height: 47,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  featureDetails: {
    flex: 1,
  },

  featureTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },

  featureDescription: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginTop: 4,
  },

  actions: {
    marginTop: 25,
    gap: 12,
  },

  primaryButton: {
    minHeight: 55,
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },

  primaryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },

  secondaryButton: {
    minHeight: 53,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "800",
  },

  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  secondaryPressed: {
    backgroundColor: COLORS.primaryLight,
  },

  footer: {
    alignItems: "center",
    marginTop: 25,
  },

  footerLine: {
    width: 45,
    height: 3,
    borderRadius: 5,
    backgroundColor: COLORS.secondary,
    marginBottom: 13,
  },

  footerText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  footerTagline: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: "center",
  },
});
