
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";

import { COLORS, SIZES, RADIUS } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen({ navigation }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    signIn,
    refreshUser,
  } = useAuth();

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      Alert.alert(
        "Missing details",
        "Please enter your email/phone and password."
      );
      return;
    }

    try {
      setLoading(true);

      await signIn({
        identifier: identifier.trim(),
        password,
      });

      // Always retrieve the latest membership status from the backend.
      const member = await refreshUser();

      const hasPaidMembership =
        member?.membershipFeePaid === true &&
        member?.membershipStatus === "active";

      const destination = hasPaidMembership
        ? "MainTabs"
        : "MembershipPayment";

      Alert.alert(
        hasPaidMembership
          ? "Welcome back"
          : "Membership payment required",
        hasPaidMembership
          ? "You have logged in successfully."
          : "Your account is not yet fully activated. Please complete your membership payment to access JVP Connect.",
        [
          {
            text: "Continue",
            onPress: () => {
              if (hasPaidMembership) {
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: "MainTabs",
                      state: {
                        routes: [{ name: "Profile" }],
                      },
                    },
                  ],
                });
              } else {
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: "MembershipPayment",
                    },
                  ],
                });
              }
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      Alert.alert(
        "Login failed",
        error.response?.data?.message ||
          error.message ||
          "Unable to connect. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>JVP</Text>
          </View>

          <Text style={styles.brand}>JVP CONNECT</Text>
          <Text style={styles.tagline}>
            Connecting Youth, Empowering Communities.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to access your JVP membership account.
          </Text>

          <Text style={styles.label}>
            Email Address or Phone Number
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter email or phone number"
            placeholderTextColor={COLORS.textSecondary}
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor={COLORS.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />

            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.showPassword}>
                {showPassword ? "Hide" : "Show"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => navigation.navigate("ForgotPassword")}
          >
            <Text style={styles.forgotText}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.loginButtonText}>
                SIGN IN
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>
              Don't have an account?{" "}
            </Text>

            <TouchableOpacity
              onPress={() => navigation.navigate("Register")}
            >
              <Text style={styles.registerLink}>
                Register Now
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footer}>
          JVP Connect © 2026
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SIZES.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: SIZES.xl,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SIZES.md,
  },
  logoText: {
    color: COLORS.white,
    fontSize: 27,
    fontWeight: "900",
  },
  brand: {
    fontSize: 23,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: 2,
  },
  tagline: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },
  form: {
    backgroundColor: COLORS.surface,
    padding: SIZES.lg,
    borderRadius: RADIUS.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.text,
  },
  subtitle: {
    color: COLORS.textSecondary,
    marginTop: 7,
    marginBottom: SIZES.lg,
    lineHeight: 21,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
    color: COLORS.text,
  },
  passwordContainer: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    color: COLORS.text,
  },
  showPassword: {
    color: COLORS.primary,
    fontWeight: "700",
    padding: 6,
  },
  forgotButton: {
    alignSelf: "flex-end",
    marginTop: 14,
  },
  forgotText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  loginButton: {
    height: 54,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: SIZES.lg,
  },
  loginButtonText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 1,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: SIZES.lg,
    flexWrap: "wrap",
  },
  registerText: {
    color: COLORS.textSecondary,
  },
  registerLink: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  footer: {
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: SIZES.xl,
  },
});
