
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
} from "react-native";

import { COLORS, SIZES, RADIUS } from "../../constants/theme";
import { forgotPassword } from "../../services/authService";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      Alert.alert("Missing email", "Please enter your registered email.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await forgotPassword({
        email: cleanEmail,
      });

      if (response.success) {
        Alert.alert(
          "OTP sent",
          response.message ||
            "A password-reset code has been sent to your email.",
          [
            {
              text: "Continue",
              onPress: () =>
                navigation.navigate("ResetPassword", {
                  email: cleanEmail,
                }),
            },
          ]
        );
      } else {
        Alert.alert(
          "Request failed",
          response.message || "Please try again."
        );
      }
    } catch (error) {
      Alert.alert(
        "Request failed",
        error.response?.data?.message ||
          "Unable to process your request. Please try again."
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
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔑</Text>
        </View>

        <Text style={styles.title}>Forgot Password?</Text>

        <Text style={styles.description}>
          Enter the email address associated with your JVP Connect
          account. We'll send you a verification code to reset your password.
        </Text>

        <Text style={styles.label}>Registered Email Address</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your email address"
          placeholderTextColor={COLORS.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitText}>SEND RESET CODE</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
  },
  content: {
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
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.primary,
    textAlign: "center",
  },
  description: {
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginTop: SIZES.md,
    marginBottom: SIZES.xl,
  },
  label: {
    color: COLORS.text,
    fontWeight: "700",
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
  submitButton: {
    height: 54,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: SIZES.lg,
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
