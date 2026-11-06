
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
import {
  verifyOTP,
  resendOTP,
} from "../../services/authService";

export default function VerifyOTPScreen({ navigation, route }) {
  const email = route.params?.email || "";
  const purpose = route.params?.purpose || "ACCOUNT_ACTIVATION";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(code)) {
      Alert.alert("Invalid OTP", "Please enter the six-digit code.");
      return;
    }

    try {
      setLoading(true);

      const response = await verifyOTP({
        email,
        code,
        purpose,
      });

      if (response.success) {
        navigation.replace("CreatePassword", {
          email,
          setupToken: response.data?.setupToken || "",
        });
      } else {
        Alert.alert(
          "Verification failed",
          response.message || "Please check your OTP and try again."
        );
      }
    } catch (error) {
      Alert.alert(
        "Verification failed",
        error.response?.data?.message ||
          "Unable to verify your OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);

      const response = await resendOTP({
        email,
        purpose,
      });

      Alert.alert(
        response.success ? "OTP sent" : "Unable to resend",
        response.message || "Please check your email."
      );
    } catch (error) {
      Alert.alert(
        "Resend failed",
        error.response?.data?.message ||
          "Unable to resend OTP. Please try again."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✉</Text>
        </View>

        <Text style={styles.title}>Verify Your Email</Text>

        <Text style={styles.description}>
          We've sent a six-digit verification code to:
        </Text>

        <Text style={styles.email}>{email}</Text>

        <Text style={styles.label}>Enter Verification Code</Text>

        <TextInput
          style={styles.otpInput}
          value={code}
          onChangeText={(value) =>
            setCode(value.replace(/\D/g, "").slice(0, 6))
          }
          keyboardType="number-pad"
          maxLength={6}
          placeholder="000000"
          placeholderTextColor={COLORS.textSecondary}
          textAlign="center"
        />

        <TouchableOpacity
          style={styles.verifyButton}
          onPress={handleVerify}
          disabled={loading || resending}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.verifyText}>VERIFY EMAIL</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendDescription}>
            Didn't receive the code?
          </Text>

          <TouchableOpacity
            onPress={handleResend}
            disabled={resending || loading}
          >
            {resending ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Text style={styles.resendText}>Resend OTP</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>Back to Registration</Text>
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
    alignItems: "center",
  },
  iconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SIZES.lg,
  },
  icon: {
    fontSize: 34,
    color: COLORS.primary,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.primary,
  },
  description: {
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: SIZES.md,
  },
  email: {
    color: COLORS.text,
    fontWeight: "800",
    marginTop: 6,
    marginBottom: SIZES.xl,
  },
  label: {
    alignSelf: "flex-start",
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  otpInput: {
    width: "100%",
    height: 62,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: 12,
    color: COLORS.primary,
  },
  verifyButton: {
    width: "100%",
    height: 54,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: SIZES.lg,
  },
  verifyText: {
    color: COLORS.white,
    fontWeight: "900",
    letterSpacing: 1,
  },
  resendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: SIZES.xl,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  resendDescription: {
    color: COLORS.textSecondary,
  },
  resendText: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  backButton: {
    marginTop: SIZES.xl,
  },
  backText: {
    color: COLORS.primary,
    fontWeight: "700",
  },
});
