
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";

import { COLORS, SIZES, RADIUS } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import {
  getMyProfile,
  updateMyProfile,
  uploadProfilePhoto,
} from "../../services/profileService";
import { getCoastGeography } from "../../services/geographyService";

export default function ProfileScreen({ navigation }) {
  const {
    user,
    member,
    isLoading,
    isAuthenticated,
    signOut,
    refreshUser,
  } = useAuth();

  const [profile, setProfile] = useState(member || null);
  const [geography, setGeography] = useState({});
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingGeography, setLoadingGeography] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    occupation: "",
    county: "",
    constituency: "",
    ward: "",
    hasDisability: false,
    disabilityType: "",
  });

const [expandedSections, setExpandedSections] = useState({
  membership: false,
  personal: false,
  contact: false,
  security: false,
});

  const email =
    profile?.user?.email ||
    profile?.email ||
    user?.email ||
    "Email not available";

  const fullName = [
    profile?.firstName,
    profile?.middleName,
    profile?.lastName,
  ]
    .filter(Boolean)
    .join(" ") || "JVP Member";

  const membershipNumber =
    profile?.memberNumber ||
    profile?.membershipNumber ||
    "Not available";

  const membershipStatus =
    profile?.membershipStatus || "inactive";

  const membershipType =
    profile?.membershipType || "Not available";

  const profilePhoto = profile?.profilePhoto || null;

  const counties = useMemo(
    () => Object.keys(geography || {}),
    [geography]
  );

  const constituencies = useMemo(() => {
    if (!form.county) return [];

    return Object.keys(
      geography[form.county]?.constituencies || {}
    );
  }, [geography, form.county]);

  const wards = useMemo(() => {
    if (!form.county || !form.constituency) return [];

    return (
      geography[form.county]?.constituencies[
        form.constituency
      ]?.wards || []
    );
  }, [geography, form.county, form.constituency]);

  const loadProfile = useCallback(async () => {
    try {
      setLoadingProfile(true);

      const response = await getMyProfile();

      if (!response?.success || !response?.data) {
        throw new Error(
          response?.message || "Unable to retrieve your profile."
        );
      }

      setProfile(response.data);
    } catch (error) {
      Alert.alert(
        "Profile",
        error.response?.data?.message ||
          error.message ||
          "Unable to load your profile."
      );
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  const loadGeography = useCallback(async () => {
    try {
      setLoadingGeography(true);

      const response = await getCoastGeography();

      if (response?.success && response.data?.geography) {
        setGeography(response.data.geography);
      } else {
        throw new Error("Unable to load county information.");
      }
    } catch (error) {
      Alert.alert(
        "Location information",
        error.response?.data?.message ||
          error.message ||
          "Unable to load county information."
      );
    } finally {
      setLoadingGeography(false);
    }
  }, []);

  useEffect(() => {
    if (member) {
      setProfile(member);
    }
  }, [member]);

  useEffect(() => {
    if (isAuthenticated) {
      loadProfile();
      loadGeography();
    }
  }, [isAuthenticated, loadProfile, loadGeography]);

  useEffect(() => {
    if (!profile) return;

    setForm({
      firstName: profile.firstName || "",
      middleName: profile.middleName || "",
      lastName: profile.lastName || "",
      phone: profile.phone || "",
      occupation: profile.occupation || "",
      county: profile.county || "",
      constituency: profile.constituency || "",
      ward: profile.ward || "",
      hasDisability:
        profile.disability?.hasDisability === true,
      disabilityType: profile.disability?.type || "",
    });
  }, [profile]);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const toggleSection = (section) => {
    setExpandedSections((previous) => ({
      ...previous,
      [section]: !previous[section],
    }));
  };

  const handleCountyChange = (county) => {
    setForm((previous) => ({
      ...previous,
      county,
      constituency: "",
      ward: "",
    }));
  };

  const handleConstituencyChange = (constituency) => {
    setForm((previous) => ({
      ...previous,
      constituency,
      ward: "",
    }));
  };

  const profileCompletion = useMemo(() => {
    if (typeof profile?.profileCompletion === "number") {
      return Math.min(
        100,
        Math.max(0, profile.profileCompletion)
      );
    }

    const checks = [
      Boolean(profilePhoto),
      Boolean(profile?.phone),
      Boolean(profile?.occupation),
      Boolean(profile?.county),
      Boolean(profile?.firstName && profile?.lastName),
    ];

    return Math.round(
      (checks.filter(Boolean).length / checks.length) * 100
    );
  }, [profile, profilePhoto]);

  const completionItems = [
    {
      label: "Profile Photo",
      complete: Boolean(profilePhoto),
    },
    {
      label: "Phone Number",
      complete: Boolean(profile?.phone),
    },
    {
      label: "Occupation",
      complete: Boolean(profile?.occupation),
    },
    {
      label: "County",
      complete: Boolean(profile?.county),
    },
    {
      label: "Personal Information",
      complete: Boolean(
        profile?.firstName && profile?.lastName
      ),
    },
  ];

  const formatDate = (value) => {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleDateString("en-KE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const membershipStanding = () => {
    switch (membershipStatus) {
      case "active":
        return "In Good Standing";
      case "expired":
        return "Renewal Required";
      case "pending_payment":
        return "Awaiting Payment";
      default:
        return "Inactive";
    }
  };

  
  const handleSaveProfile = async () => {
    const requiredFields = [
      ["firstName", "First name"],
      ["lastName", "Last name"],
      ["phone", "Phone number"],
      ["county", "County"],
      ["constituency", "Constituency"],
      ["ward", "Ward"],
    ];

    for (const [field, label] of requiredFields) {
      if (!String(form[field] || "").trim()) {
        Alert.alert(
          "Missing information",
          `Please provide your ${label.toLowerCase()}.`
        );
        return;
      }
    }

    const normalizedPhone = form.phone.replace(/[\s-]/g, "");

    if (!/^\+?\d{10,15}$/.test(normalizedPhone)) {
      Alert.alert(
        "Invalid phone number",
        "Enter a valid phone number containing 10 to 15 digits."
      );
      return;
    }

    if (form.hasDisability && !form.disabilityType.trim()) {
      Alert.alert(
        "Disability information",
        "Please specify the disability type."
      );
      return;
    }

    const payload = {
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim(),
      lastName: form.lastName.trim(),
      phone: normalizedPhone,
      occupation: form.occupation.trim(),
      county: form.county,
      constituency: form.constituency,
      ward: form.ward,
      disability: {
        hasDisability: form.hasDisability,
        type: form.hasDisability
          ? form.disabilityType.trim()
          : "",
      },
    };

    const matchesSavedProfile = (saved) =>
      saved &&
      saved.firstName === payload.firstName &&
      (saved.middleName || "") === payload.middleName &&
      saved.lastName === payload.lastName &&
      saved.phone === payload.phone &&
      (saved.occupation || "") === payload.occupation &&
      saved.county === payload.county &&
      saved.constituency === payload.constituency &&
      saved.ward === payload.ward &&
      Boolean(saved.disability?.hasDisability) ===
        payload.disability.hasDisability &&
      (saved.disability?.type || "") === payload.disability.type;

    try {
      setSaving(true);

      let response;

      try {
        response = await updateMyProfile(payload);
      } catch (updateError) {
        const verification = await getMyProfile();
        const savedProfile = verification?.data;

        if (!verification?.success || !matchesSavedProfile(savedProfile)) {
          throw updateError;
        }

        setProfile(savedProfile);
        await refreshUser();
        setEditing(false);

        Alert.alert(
          "Profile updated",
          "Your changes were saved successfully."
        );
        return;
      }

      if (!response?.success) {
        throw new Error(
          response?.message || "Profile update failed."
        );
      }

      const refreshedMember = await refreshUser();

      setProfile(
        refreshedMember || response.data
      );

      setEditing(false);

      Alert.alert(
        "Profile updated",
        response.message || "Your profile has been updated successfully."
      );
    } catch (error) {
      Alert.alert(
        "Update failed",
        error.response?.data?.message ||
          error.message ||
          "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };


 
  const handlePhotoUpload = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Allow JVP Connect to access your photos to update your profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const image = result.assets[0];

      if (
        typeof image.fileSize === "number" &&
        image.fileSize > 10 * 1024 * 1024
      ) {
        Alert.alert(
          "Image too large",
          "Choose an image smaller than 10 MB."
        );
        return;
      }

      setUploadingPhoto(true);

      const previousPhoto = profile?.profilePhoto || "";

      let response;

      try {
        response = await uploadProfilePhoto(image);

        if (!response?.success) {
          throw new Error(
            response?.message || "Photo upload failed."
          );
        }
      } catch (uploadError) {
        const verification = await getMyProfile();
        const savedProfile = verification?.data;
        const newPhoto = savedProfile?.profilePhoto || "";

        if (
          !verification?.success ||
          !newPhoto ||
          newPhoto === previousPhoto
        ) {
          throw uploadError;
        }

        setProfile(savedProfile);
        await refreshUser();

        Alert.alert(
          "Photo updated",
          "Your profile picture was saved successfully."
        );
        return;
      }

      const refreshedMember = await refreshUser();

      setProfile(
        refreshedMember || response.data
      );

      Alert.alert(
        "Photo updated",
        "Your profile picture has been updated successfully."
      );
    } catch (error) {
      Alert.alert(
        "Photo upload failed",
        error.response?.data?.message ||
          error.message ||
          "Unable to upload your profile picture."
      );
    } finally {
      setUploadingPhoto(false);
    }
  };


  const handleLogout = () => {
    Alert.alert(
      "Log out",
      "Are you sure you want to log out of JVP Connect?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              setLoggingOut(true);
              await signOut();
            } catch (error) {
              Alert.alert(
                "Logout",
                error.response?.data?.message ||
                  "Your local session has been cleared, but the server logout could not be confirmed."
              );
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const renderInput = (
    label,
    field,
    placeholder,
    options = {}
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={styles.input}
        value={form[field]}
        onChangeText={(value) => updateField(field, value)}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
        keyboardType={options.keyboardType || "default"}
        autoCapitalize={options.autoCapitalize || "sentences"}
        maxLength={options.maxLength}
        editable={editing}
      />
    </View>
  );

  const renderReadOnly = (label, value) => (
    <View style={styles.readOnlyField}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.readOnlyValue}>
        {value || "Not available"}
      </Text>
    </View>
  );

  const renderPicker = (
    label,
    value,
    items,
    onChange,
    placeholder,
    disabled = false
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.pickerContainer,
          (!editing || disabled) && styles.readOnlyPicker,
        ]}
      >
        <Picker
          selectedValue={value}
          onValueChange={onChange}
          enabled={editing && !disabled}
          style={styles.picker}
        >
          <Picker.Item label={placeholder} value="" />

          {items.map((item) => (
            <Picker.Item
              key={item}
              label={item}
              value={item}
            />
          ))}
        </Picker>
      </View>
    </View>
  );

  const renderSectionHeader = (title, section, icon) => (
    <Pressable
      style={styles.sectionHeader}
      onPress={() => toggleSection(section)}
    >
      <View style={styles.sectionHeaderLeft}>
        <View style={styles.sectionIcon}>
          <Ionicons
            name={icon}
            size={20}
            color={COLORS.primary}
          />
        </View>

        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      <Ionicons
        name={
          expandedSections[section]
            ? "chevron-up"
            : "chevron-down"
        }
        size={20}
        color={COLORS.textSecondary}
      />
    </Pressable>
  );

  const membershipBenefits = [
    {
      icon: "people-outline",
      title: "Youth Networking",
      description: "Connect with young leaders across the Coast.",
    },
    {
      icon: "calendar-outline",
      title: "Events and Programmes",
      description: "Participate in JVP activities and initiatives.",
    },
    {
      icon: "briefcase-outline",
      title: "Opportunities",
      description: "Access leadership, training and development opportunities.",
    },
    {
      icon: "megaphone-outline",
      title: "Your Voice Matters",
      description: "Engage in conversations shaping our communities.",
    },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            Loading your account...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.white}
      />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Account</Text>
            <Text style={styles.headerSubtitle}>
              {isAuthenticated
                ? "Manage your JVP Connect membership and personal information."
                : "Your JVP Connect membership starts here."}
            </Text>
          </View>

          {isAuthenticated ? (
            <>
              {loadingProfile && !profile ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size="large"
                    color={COLORS.primary}
                  />
                  <Text style={styles.loadingText}>
                    Loading your profile...
                  </Text>
                </View>
              ) : (
                <>
                  {/* PROFILE HEADER */}
                  <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                      {profilePhoto ? (
                        <Image
                          source={{ uri: profilePhoto }}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <View style={styles.avatar}>
                          <Ionicons
                            name="person"
                            size={43}
                            color={COLORS.primary}
                          />
                        </View>
                      )}

                      <Pressable
                        style={styles.cameraButton}
                        onPress={handlePhotoUpload}
                        disabled={uploadingPhoto}
                      >
                        {uploadingPhoto ? (
                          <ActivityIndicator
                            size="small"
                            color={COLORS.white}
                          />
                        ) : (
                          <Ionicons
                            name="camera"
                            size={17}
                            color={COLORS.white}
                          />
                        )}
                      </Pressable>
                    </View>

                    <Text style={styles.memberName}>
                      {fullName}
                    </Text>

                    <Text style={styles.memberEmail}>
                      {email}
                    </Text>

                    <View style={styles.statusBadge}>
                      <View
                        style={[
                          styles.statusDot,
                          membershipStatus === "active"
                            ? styles.activeDot
                            : styles.inactiveDot,
                        ]}
                      />

                      <Text style={styles.statusText}>
                        {membershipStatus.replace(/_/g, " ")}
                      </Text>
                    </View>

                    <Text style={styles.memberNumber}>
                      Member No: {membershipNumber}
                    </Text>

                    <Text style={styles.memberCounty}>
                      <Ionicons
                        name="location-outline"
                        size={13}
                        color={COLORS.textSecondary}
                      />{" "}
                      {profile?.county || "County not provided"}
                    </Text>

                    <Pressable
                      style={styles.photoButton}
                      onPress={handlePhotoUpload}
                      disabled={uploadingPhoto}
                    >
                      <Ionicons
                        name="image-outline"
                        size={17}
                        color={COLORS.primary}
                      />
                      <Text style={styles.photoButtonText}>
                        {uploadingPhoto
                          ? "Uploading..."
                          : "Update Profile Picture"}
                      </Text>
                    </Pressable>
                  </View>

                  {/* PROFILE COMPLETION */}
                  <View style={styles.card}>
                    <View style={styles.completionHeading}>
                      <Text style={styles.sectionTitle}>
                        Profile Completion
                      </Text>
                      <Text style={styles.completionPercentage}>
                        {profileCompletion}%
                      </Text>
                    </View>

                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${profileCompletion}%` },
                        ]}
                      />
                    </View>

                    <Text style={styles.helperText}>
                      Complete your information to keep your member
                      profile up to date.
                    </Text>

                    {completionItems.map((item) => (
                      <View
                        key={item.label}
                        style={styles.checklistRow}
                      >
                        <Ionicons
                          name={
                            item.complete
                              ? "checkmark-circle"
                              : "ellipse-outline"
                          }
                          size={18}
                          color={
                            item.complete
                              ? COLORS.success
                              : COLORS.textSecondary
                          }
                        />

                        <Text
                          style={[
                            styles.checklistText,
                            item.complete && styles.completedText,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* EDIT PROFILE ACTIONS */}
                  <View style={styles.editActions}>
                    <Text style={styles.editHint}>
                      Update your personal and contact details below.
                    </Text>

                    <Pressable
                      style={styles.editButton}
                    onPress={() => {
  setEditing((previous) => {
    const nextEditing = !previous;

    if (nextEditing) {
      setExpandedSections((sections) => ({
        ...sections,
        personal: true,
        contact: true,
      }));
    }

    return nextEditing;
  });
}}
                    >
                      <Ionicons
                        name={editing ? "close-outline" : "create-outline"}
                        size={18}
                        color={COLORS.white}
                      />
                      <Text style={styles.editButtonText}>
                        {editing ? "CANCEL EDITING" : "EDIT PROFILE"}
                      </Text>
                    </Pressable>
                  </View>

                  {/* MEMBERSHIP INFORMATION */}
                  <View style={styles.card}>
                    {renderSectionHeader(
                      "Membership Information",
                      "membership",
                      "card-outline"
                    )}

                    {expandedSections.membership && (
                      <View style={styles.sectionBody}>
                        {renderReadOnly(
                          "Membership Number",
                          membershipNumber
                        )}

                        {renderReadOnly(
                          "Membership Type",
                          membershipType
                        )}

                        {renderReadOnly(
                          "Membership Status",
                          membershipStatus.replace(/_/g, " ")
                        )}

                        {renderReadOnly(
                          "Membership Standing",
                          membershipStanding()
                        )}

                        {renderReadOnly(
                          "Membership Fee Paid",
                          profile?.membershipFeePaid ? "Yes" : "No"
                        )}

                        {renderReadOnly(
                          "Date Joined",
                          formatDate(profile?.joinedAt || profile?.createdAt)
                        )}

                        {renderReadOnly(
                          "Membership Expiry",
                          profile?.membershipExpiry
                            ? formatDate(profile.membershipExpiry)
                            : "Lifetime"
                        )}

                        {renderReadOnly(
                          "Account Activated",
                          profile?.accountActivated ? "Yes" : "No"
                        )}
                      </View>
                    )}
                  </View>

                  {/* PERSONAL INFORMATION */}
                  <View style={styles.card}>
                    {renderSectionHeader(
                      "Personal Information",
                      "personal",
                      "person-outline"
                    )}

                    {expandedSections.personal && (
                      <View style={styles.sectionBody}>
                        {renderInput(
                          "First Name",
                          "firstName",
                          "Enter first name"
                        )}

                        {renderInput(
                          "Middle Name",
                          "middleName",
                          "Enter middle name (optional)"
                        )}

                        {renderInput(
                          "Last Name",
                          "lastName",
                          "Enter last name"
                        )}

                        {renderReadOnly(
                          "Gender",
                          profile?.gender
                        )}

                        {renderReadOnly(
                          "Date of Birth",
                          formatDate(profile?.dateOfBirth)
                        )}

                        {renderReadOnly(
                          "National ID",
                          profile?.nationalId
                        )}

                        {renderInput(
                          "Occupation",
                          "occupation",
                          "Enter your occupation"
                        )}

                        <View style={styles.field}>
                          <Text style={styles.label}>
                            Do you have a disability?
                          </Text>

                          <View style={styles.choiceRow}>
                            <Pressable
                              disabled={!editing}
                              style={[
                                styles.choiceButton,
                                form.hasDisability && styles.selectedChoice,
                              ]}
                              onPress={() => {
                                setForm((previous) => ({
                                  ...previous,
                                  hasDisability: true,
                                }));
                              }}
                            >
                              <Text
                                style={[
                                  styles.choiceText,
                                  form.hasDisability &&
                                    styles.selectedChoiceText,
                                ]}
                              >
                                Yes
                              </Text>
                            </Pressable>

                            <Pressable
                              disabled={!editing}
                              style={[
                                styles.choiceButton,
                                !form.hasDisability &&
                                  styles.selectedChoice,
                              ]}
                              onPress={() => {
                                setForm((previous) => ({
                                  ...previous,
                                  hasDisability: false,
                                  disabilityType: "",
                                }));
                              }}
                            >
                              <Text
                                style={[
                                  styles.choiceText,
                                  !form.hasDisability &&
                                    styles.selectedChoiceText,
                                ]}
                              >
                                No
                              </Text>
                            </Pressable>
                          </View>
                        </View>

                        {form.hasDisability &&
                          renderInput(
                            "Disability Type",
                            "disabilityType",
                            "Specify disability"
                          )}
                      </View>
                    )}
                  </View>

                  {/* CONTACT AND LOCATION */}
                  <View style={styles.card}>
                    {renderSectionHeader(
                      "Contact and Location",
                      "contact",
                      "location-outline"
                    )}

                    {expandedSections.contact && (
                      <View style={styles.sectionBody}>
                        {renderReadOnly("Email Address", email)}

                        {renderInput(
                          "Phone Number",
                          "phone",
                          "Enter phone number",
                          { keyboardType: "phone-pad" }
                        )}

                        {loadingGeography ? (
                          <ActivityIndicator
                            color={COLORS.primary}
                            style={styles.loader}
                          />
                        ) : (
                          <>
                            {renderPicker(
                              "County",
                              form.county,
                              counties,
                              handleCountyChange,
                              "Select county"
                            )}

                            {renderPicker(
                              "Constituency",
                              form.constituency,
                              constituencies,
                              handleConstituencyChange,
                              form.county
                                ? "Select constituency"
                                : "Select county first",
                              !form.county
                            )}

                            {renderPicker(
                              "Ward",
                              form.ward,
                              wards,
                              (value) => updateField("ward", value),
                              form.constituency
                                ? "Select ward"
                                : "Select constituency first",
                              !form.constituency
                            )}
                          </>
                        )}
                      </View>
                    )}
                  </View>

                  {/* SAVE PROFILE */}
                  {editing && (
                    <Pressable
                      style={[
                        styles.saveButton,
                        saving && styles.disabledButton,
                      ]}
                      onPress={handleSaveProfile}
                      disabled={saving || loadingGeography}
                    >
                      {saving ? (
                        <ActivityIndicator color={COLORS.white} />
                      ) : (
                        <>
                          <Ionicons
                            name="save-outline"
                            size={19}
                            color={COLORS.white}
                          />
                          <Text style={styles.saveButtonText}>
                            SAVE PROFILE CHANGES
                          </Text>
                        </>
                      )}
                    </Pressable>
                  )}

                  {/* SECURITY AND ACCOUNT */}
                  <View style={styles.card}>
                    {renderSectionHeader(
                      "Account and Security",
                      "security",
                      "shield-checkmark-outline"
                    )}

                    {expandedSections.security && (
                      <View style={styles.sectionBody}>
                        {renderReadOnly(
                          "Registered Email",
                          email
                        )}

                        {renderReadOnly(
                          "Email Verification",
                          profile?.user?.emailVerified
                            ? "Verified"
                            : "Not verified / unavailable"
                        )}

                        {renderReadOnly(
                          "Account Status",
                          profile?.user?.isActive
                            ? "Active"
                            : "Inactive"
                        )}

                        <Text style={styles.securityNote}>
                          Password management and additional security
                          features are not currently available in this
                          profile screen.
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* LOGOUT */}
                  <Pressable
                    style={[
                      styles.logoutButton,
                      loggingOut && styles.disabledButton,
                    ]}
                    onPress={handleLogout}
                    disabled={loggingOut}
                  >
                    {loggingOut ? (
                      <ActivityIndicator color={COLORS.danger} />
                    ) : (
                      <>
                        <Ionicons
                          name="log-out-outline"
                          size={20}
                          color={COLORS.danger}
                        />
                        <Text style={styles.logoutText}>
                          LOG OUT
                        </Text>
                      </>
                    )}
                  </Pressable>
                </>
              )}
            </>
          ) : (
            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                <Ionicons
                  name="person"
                  size={43}
                  color={COLORS.primary}
                />
              </View>

              <Text style={styles.welcomeTitle}>
                Welcome to JVP Connect
              </Text>

              <Text style={styles.welcomeDescription}>
                Access your membership, connect with other young
                people and participate in opportunities across
                the Coast.
              </Text>

              <Pressable
                style={styles.loginButton}
                onPress={() => navigation.navigate("Login")}
              >
                <Ionicons
                  name="log-in-outline"
                  size={19}
                  color={COLORS.white}
                />
                <Text style={styles.loginButtonText}>
                  MEMBER LOGIN
                </Text>
              </Pressable>

              <Pressable
                style={styles.registerButton}
                onPress={() => navigation.navigate("Register")}
              >
                <Text style={styles.registerButtonText}>
                  REGISTER AS A MEMBER
                </Text>
              </Pressable>
            </View>
          )}

         {!isAuthenticated && (
  <>
    {/* MEMBERSHIP BENEFITS */}
    <View style={styles.benefitsHeading}>
      <Text style={styles.sectionTitle}>
        Membership Benefits
      </Text>
    </View>

    {membershipBenefits.map((item) => (
      <View key={item.title} style={styles.benefitCard}>
        <View style={styles.benefitIcon}>
          <Ionicons
            name={item.icon}
            size={23}
            color={COLORS.primary}
          />
        </View>

        <View style={styles.benefitContent}>
          <Text style={styles.benefitTitle}>
            {item.title}
          </Text>
          <Text style={styles.benefitDescription}>
            {item.description}
          </Text>
        </View>
      </View>
    ))}
  </>
)}

          {/* SUPPORT */}
          <View style={styles.supportCard}>
            <Ionicons
              name="help-circle-outline"
              size={27}
              color={COLORS.primary}
            />

            <View style={styles.supportContent}>
              <Text style={styles.supportTitle}>
                Need Assistance?
              </Text>

              <Text style={styles.supportDescription}>
                Contact the JVP Connect team for membership
                and account support.
              </Text>
            </View>
          </View>

          <Text style={styles.footer}>
            JUMUIYA YA VIJANA WA PWANI
            {"\n"}Connecting Youth, Empowering Communities.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  keyboardContainer: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 35,
  },

  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },

  headerTitle: {
    fontSize: 25,
    fontWeight: "900",
    color: COLORS.primary,
  },

  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 5,
    lineHeight: 18,
  },

  loadingContainer: {
    padding: 45,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 13,
  },

  profileCard: {
    backgroundColor: COLORS.white,
    margin: 18,
    padding: 22,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  avatarContainer: {
    position: "relative",
    marginBottom: 15,
  },

  avatar: {
    width: 85,
    height: 85,
    borderRadius: 43,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryLight,
  },

  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },

  memberName: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "center",
  },

  memberEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
  },

  memberNumber: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 12,
  },

  memberCounty: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.round,
    marginTop: 13,
    gap: 7,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  activeDot: {
    backgroundColor: COLORS.success,
  },

  inactiveDot: {
    backgroundColor: COLORS.warning,
  },

  statusText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "capitalize",
  },

  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    marginTop: 16,
  },

  photoButtonText: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 11,
  },

  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 18,
    marginBottom: 14,
    padding: 17,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  completionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
  },

  completionPercentage: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.primary,
  },

  progressTrack: {
    height: 9,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 13,
  },

  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },

  helperText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginTop: 10,
    marginBottom: 8,
  },

  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingVertical: 6,
  },

  checklistText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  completedText: {
    color: COLORS.text,
    fontWeight: "700",
  },

  editActions: {
    marginHorizontal: 18,
    marginBottom: 14,
    gap: 10,
  },

  editHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  editButton: {
    minHeight: 47,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  editButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 42,
  },

  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  sectionIcon: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },

  sectionBody: {
    marginTop: 12,
  },

  field: {
    marginTop: 12,
  },

  label: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 7,
  },

  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    fontSize: 13,
  },

  readOnlyField: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
  },

  readOnlyValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
    textTransform: "capitalize",
  },

  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    overflow: "hidden",
  },

  readOnlyPicker: {
    backgroundColor: COLORS.surface,
  },

  picker: {
    color: COLORS.text,
    height: 52,
  },

  choiceRow: {
    flexDirection: "row",
    gap: SIZES.sm,
  },

  choiceButton: {
    flex: 1,
    padding: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    alignItems: "center",
  },

  selectedChoice: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  choiceText: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 12,
  },

  selectedChoiceText: {
    color: COLORS.white,
  },

  loader: {
    margin: SIZES.lg,
  },

  saveButton: {
    marginHorizontal: 18,
    marginBottom: 16,
    minHeight: 52,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
  },

  saveButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  disabledButton: {
    opacity: 0.6,
  },

  securityNote: {
    fontSize: 11,
    lineHeight: 18,
    color: COLORS.textSecondary,
    marginTop: 14,
  },

  logoutButton: {
    marginHorizontal: 18,
    marginBottom: 18,
    height: 52,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  logoutText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },

  benefitsHeading: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 13,
  },

  benefitCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 18,
    marginBottom: 10,
    padding: 15,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  benefitIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },

  benefitContent: {
    flex: 1,
  },

  benefitTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },

  benefitDescription: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginTop: 4,
  },

  supportCard: {
    margin: 18,
    padding: 16,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  supportContent: {
    flex: 1,
  },

  supportTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.primary,
  },

  supportDescription: {
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  loginButton: {
    width: "100%",
    height: 51,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
  },

  loginButtonText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 1,
  },

  registerButton: {
    width: "100%",
    height: 49,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },

  registerButtonText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.5,
  },

  welcomeTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "center",
  },

  welcomeDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 9,
    marginBottom: 20,
  },

  footer: {
    textAlign: "center",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    lineHeight: 19,
    color: COLORS.textSecondary,
    marginTop: 5,
    marginBottom: 25,
  },
});
