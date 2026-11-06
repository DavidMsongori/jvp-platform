
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
import { Ionicons } from "@expo/vector-icons";

import { COLORS, SIZES, RADIUS } from "../../constants/theme";
import { createPassword } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

export default function CreatePasswordScreen({ navigation, route }) {
  const email = route.params?.email || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { completeAuthentication } = useAuth();

  const handleCreatePassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert(
        "Missing details",
        "Please enter and confirm your password."
      );
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        "Weak password",
        "Your password must contain at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "The passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await createPassword({
        email,
        password,
        confirmPassword,
      });

      if (response.success && response.data?.token) {
        completeAuthentication(response);

        Alert.alert(
          "Account created successfully",
          "Your password has been created. Complete your membership payment to activate your JVP Connect membership.",
          [
            {
              text: "Continue to Payment",
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: "MembershipPayment",
                    },
                  ],
                });
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert(
          "Password setup failed",
          response.message || "Please try again."
        );
      }
    } catch (error) {
      Alert.alert(
        "Password setup failed",
        error.response?.data?.message ||
          error.message ||
          "Unable to create your password. Please try again."
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
          <Ionicons
            name="shield-checkmark-outline"
            size={45}
            color={COLORS.primary}
          />
        </View>

        <Text style={styles.title}>Create Your Password</Text>

        <Text style={styles.subtitle}>
          Your email has been verified. Create a secure password
          to activate your JVP Connect membership account.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>New Password</Text>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter at least 8 characters"
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
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={21}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirm Password</Text>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm your password"
              placeholderTextColor={COLORS.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              onPress={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
            >
              <Ionicons
                name={
                  showConfirmPassword
                    ? "eye-off-outline"
                    : "eye-outline"
                }
                size={21}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.passwordHint}>
            Your password must contain at least 8 characters.
          </Text>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleCreatePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>
                ACTIVATE MY ACCOUNT
              </Text>
            )}
          </TouchableOpacity>
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

  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SIZES.lg,
  },

  iconContainer: {
    width: 85,
    height: 85,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: SIZES.lg,
  },

  title: {
    fontSize: 25,
    fontWeight: "900",
    color: COLORS.primary,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 10,
    marginBottom: SIZES.xl,
  },

  form: {
    backgroundColor: COLORS.surface,
    padding: SIZES.lg,
    borderRadius: RADIUS.lg,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 14,
  },

  passwordContainer: {
    height: 53,
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

  passwordHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 9,
  },

  submitButton: {
    height: 54,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: SIZES.xl,
  },

  submitButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  footer: {
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: SIZES.xl,
  },
});
