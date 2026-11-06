
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TabNavigator from "./TabNavigator";

import WelcomeScreen from "../screens/home/WelcomeScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import VerifyOTPScreen from "../screens/auth/VerifyOTPScreen";
import CreatePasswordScreen from "../screens/auth/CreatePasswordScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/auth/ResetPasswordScreen";

import MembershipPaymentScreen from "../screens/membership/MembershipPaymentScreen";
import ArticleDetailsScreen from "../screens/community/ArticleDetailsScreen";
import EventDetailsScreen from "../screens/programmes/EventDetailsScreen";
import ConversationScreen from "../screens/messages/ConversationScreen";

import { useAuth } from "../context/AuthContext";
import { COLORS } from "../constants/theme";

const Stack = createNativeStackNavigator();

function SessionLoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

export default function RootNavigator() {
  const {
    isLoading,
    isAuthenticated,
    requiresMembershipPayment,
  } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: COLORS.white },
        headerTintColor: COLORS.primary,
        headerTitleStyle: { fontWeight: "800" },
        contentStyle: { backgroundColor: COLORS.white },
      }}
    >
      {isLoading ? (
        <Stack.Screen
          name="SessionLoading"
          component={SessionLoadingScreen}
          options={{ headerShown: false }}
        />
      ) : !isAuthenticated ? (
        <>
          <Stack.Screen
            name="Welcome"
            component={WelcomeScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: "Member Login" }}
          />

          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: "Membership Registration" }}
          />

          <Stack.Screen
            name="VerifyOTP"
            component={VerifyOTPScreen}
            options={{ title: "Email Verification" }}
          />

          <Stack.Screen
            name="CreatePassword"
            component={CreatePasswordScreen}
            options={{ title: "Create Password" }}
          />

          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ title: "Forgot Password" }}
          />

          <Stack.Screen
            name="ResetPassword"
            component={ResetPasswordScreen}
            options={{ title: "Reset Password" }}
          />
        </>
      ) : requiresMembershipPayment ? (
        <Stack.Screen
          name="MembershipPayment"
          component={MembershipPaymentScreen}
          options={{
            title: "Membership Payment",
            headerBackVisible: false,
          }}
        />
      ) : (
        <>
          <Stack.Screen
            name="MainTabs"
            component={TabNavigator}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="NewsArticle"
            component={ArticleDetailsScreen}
            options={{ title: "JVP News" }}
          />

          <Stack.Screen
            name="EventDetails"
            component={EventDetailsScreen}
            options={{ title: "Event Details" }}
          />

          <Stack.Screen
            name="Conversation"
            component={ConversationScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="MembershipPayment"
            component={MembershipPaymentScreen}
            options={{
              title: "Membership Payment",
              headerBackVisible: false,
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
});
