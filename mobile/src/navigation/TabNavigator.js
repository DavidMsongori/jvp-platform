import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/home/HomeScreen";
import ProfileScreen from "../screens/membership/ProfileScreen";
import NewsScreen from "../screens/community/NewsScreen";
import ProgrammesScreen from "../screens/programmes/ProgrammesScreen";
import MessagesScreen from "../screens/messages/MessagesScreen";

import { COLORS } from "../constants/theme";

const Tab = createBottomTabNavigator();

const screens = [
  {
    name: "Home",
    title: "Home",
    icon: "home-outline",
    activeIcon: "home",
    component: HomeScreen,
  },
  {
    name: "Programmes",
    title: "Programmes",
    icon: "calendar-outline",
    activeIcon: "calendar",
    component: ProgrammesScreen,
  },
  {
    name: "Community",
    title: "Community",
    icon: "people-outline",
    activeIcon: "people",
    component: NewsScreen,
  },
  {
    name: "Messages",
    title: "Messages",
    icon: "chatbubbles-outline",
    activeIcon: "chatbubbles",
    component: MessagesScreen,
  },
  {
    name: "Profile",
    title: "Profile",
    icon: "person-circle-outline",
    activeIcon: "person-circle",
    component: ProfileScreen,
  },
];

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          height: 65,
          paddingBottom: 8,
          paddingTop: 7,
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      {screens.map((screen) => (
        <Tab.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={{
            tabBarLabel: screen.title,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? screen.activeIcon : screen.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}
