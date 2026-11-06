
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

import { COLORS, SIZES, RADIUS } from "../../constants/theme";
import { resetPassword } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

export default function ResetPasswordScreen({ navigation, route }) {
  const email = route.params?.email || "";

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { completeAuthentication } = useAuth();

  const handleResetPassword = async () => {
    if (!code || !password || !confirmPassword) {
      Alert.alert("Missing details", "Please complete all fields.");
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      Alert.alert("Invalid OTP", "Enter the six-digit verification code.");
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        "Weak password",
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "The passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await resetPassword({
        email,
        code,
        password,
        confirmPassword,
      });

      if (response.success && response.data?.token) {
        completeAuthentication(response);

        Alert.alert(
          "Password reset successful",
          "Your password has been updated. You are now signed in.",
          [
            {
              text: "Continue",
              onPress: () => {
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
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Reset failed",
          response.message || "Unable to reset your password."
        );
      }
    } catch (error) {
      Alert.alert(
        "Reset failed",
        error.response?.data?.message ||
          error.message ||
          "The verification code may have expired or be incorrect. Please try again."
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
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔒</Text>
        </View>

        <Text style={styles.title}>Reset Your Password</Text>

        <Text style={styles.description}>
          Enter the verification code sent to your registered email
          and create a new password.
        </Text>

        <View style={styles.emailContainer}>
          <Text style={styles.emailLabel}>Registered Email</Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        <Text style={styles.label}>Verification Code</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter 6-digit OTP"
          placeholderTextColor={COLORS.textSecondary}
          value={code}
          onChangeText={(value) =>
            setCode(value.replace(/\D/g, "").slice(0, 6))
          }
          keyboardType="number-pad"
          maxLength={6}
        />

        <Text style={styles.label}>New Password</Text>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter new password"
            placeholderTextColor={COLORS.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.showText}>
              {showPassword ? "Hide" : "Show"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Confirm New Password</Text>

        <TextInput
          style={styles.input}
          placeholder="Confirm new password"
          placeholderTextColor={COLORS.textSecondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitText}>RESET PASSWORD</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SIZES.lg,
  },
  iconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: SIZES.lg,
  },
  icon: {
    fontSize: 34,
  },
  title: {
    fontSize: 25,
    fontWeight: "900",
    color: COLORS.primary,
    textAlign: "center",
  },
  description: {
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginTop: SIZES.md,
    marginBottom: SIZES.lg,
  },
  emailContainer: {
    backgroundColor: COLORS.primaryLight,
    padding: SIZES.md,
    borderRadius: RADIUS.md,
    marginBottom: SIZES.lg,
  },
  emailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "700",
  },
  email: {
    color: COLORS.primary,
    fontWeight: "800",
    marginTop: 5,
  },
  label: {
    color: COLORS.text,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    color: COLORS.text,
  },
  passwordContainer: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    color: COLORS.text,
  },
  showText: {
    color: COLORS.primary,
    fontWeight: "800",
    padding: 6,
  },
  submitButton: {
    height: 54,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: SIZES.xl,
  },
  submitText: {
    color: COLORS.white,
    fontWeight: "900",
    letterSpacing: 1,
  },
  backButton: {
    alignItems: "center",
    marginTop: SIZES.lg,
  },
  backText: {
    color: COLORS.primary,
    fontWeight: "700",
  },
});
