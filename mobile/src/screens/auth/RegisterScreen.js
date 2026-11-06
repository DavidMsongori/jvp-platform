
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { Picker } from "@react-native-picker/picker";
import { COLORS, SIZES, RADIUS } from "../../constants/theme";
import { register } from "../../services/authService";
import { getCoastGeography } from "../../services/geographyService";

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    nationalId: "",
    phone: "",
    email: "",
    occupation: "",
    county: "",
    constituency: "",
    ward: "",
    hasDisability: false,
    disabilityType: "",
    membershipType: "ordinary",
  });

  const [geography, setGeography] = useState({});
  const [loadingGeography, setLoadingGeography] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadGeography();
  }, []);

  const loadGeography = async () => {
    try {
      const response = await getCoastGeography();

      if (response.success && response.data?.geography) {
        setGeography(response.data.geography);
      } else {
        Alert.alert("Error", "Unable to load county information.");
      }
    } catch (error) {
  const details = {
    message: error.message,
    code: error.code,
    status: error.response?.status,
    response: error.response?.data,
    baseURL: error.config?.baseURL,
    requestURL: error.config?.url,
  };

  console.log("GEOGRAPHY REQUEST FAILED:", details);

  Alert.alert(
    "Geography Error",
    [
      `Message: ${error.message || "Unknown error"}`,
      `Code: ${error.code || "Not available"}`,
      `Status: ${error.response?.status || "No response"}`,
      `URL: ${(error.config?.baseURL || "") + (error.config?.url || "")}`,
    ].join("\n")
  );
}
     finally {
      setLoadingGeography(false);
    }
  };

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const counties = Object.keys(geography);

  const constituencies = form.county
    ? Object.keys(geography[form.county]?.constituencies || {})
    : [];

  const wards =
    form.county && form.constituency
      ? geography[form.county]?.constituencies[form.constituency]?.wards || []
      : [];

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

  const handleSubmit = async () => {
    const requiredFields = [
      ["firstName", "First name"],
      ["lastName", "Last name"],
      ["gender", "Gender"],
      ["dateOfBirth", "Date of birth"],
      ["nationalId", "National ID"],
      ["phone", "Phone number"],
      ["email", "Email address"],
      ["occupation", "Occupation"],
      ["county", "County"],
      ["constituency", "Constituency"],
      ["ward", "Ward"],
      ["membershipType", "Membership type"],
    ];

    for (const [field, label] of requiredFields) {
      if (!String(form[field] || "").trim()) {
        Alert.alert("Missing information", `Please enter ${label}.`);
        return;
      }
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!datePattern.test(form.dateOfBirth)) {
      Alert.alert(
        "Invalid date",
        "Enter your date of birth in YYYY-MM-DD format."
      );
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    if (!/^(?:07|01)\d{8}$/.test(form.phone.replace(/[\s-]/g, ""))) {
      Alert.alert(
        "Invalid phone number",
        "Enter a valid Kenyan number, for example 0712345678."
      );
      return;
    }

    const payload = {
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim(),
      lastName: form.lastName.trim(),
      gender: form.gender,
      dateOfBirth: form.dateOfBirth,
      nationalId: form.nationalId.trim(),
      phone: form.phone.trim(),
      email: form.email.trim().toLowerCase(),
      occupation: form.occupation.trim(),
      county: form.county,
      constituency: form.constituency,
      ward: form.ward,
      disability: {
        hasDisability: form.hasDisability,
        type: form.hasDisability ? form.disabilityType.trim() : "",
      },
      membershipType: form.membershipType,
    };

    if (form.hasDisability && !form.disabilityType.trim()) {
      Alert.alert(
        "Disability information",
        "Please specify the disability type."
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await register(payload);

      if (response.success) {
        Alert.alert(
          "Registration successful",
          response.message ||
            "An OTP has been sent to your email address."
        );

        navigation.navigate("VerifyOTP", {
          email: form.email.trim().toLowerCase(),
          purpose: "ACCOUNT_ACTIVATION",
        });
      } else {
        Alert.alert(
          "Registration failed",
          response.message || "Please try again."
        );
      }
    } catch (error) {
      Alert.alert(
        "Registration failed",
        error.response?.data?.message ||
          "Unable to complete registration. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
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
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
        value={form[field]}
        onChangeText={(value) => updateField(field, value)}
        keyboardType={options.keyboardType || "default"}
        autoCapitalize={options.autoCapitalize || "sentences"}
        autoCorrect={false}
        maxLength={options.maxLength}
      />
    </View>
  );

  const renderPicker = (label, value, items, onChange, placeholder) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={value}
          onValueChange={onChange}
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Back to Login</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>Membership Registration</Text>
        <Text style={styles.subtitle}>
          Join the JVP community and become part of a network
          connecting young people across the Coast.
        </Text>

        {/* PERSONAL INFORMATION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Personal Information</Text>

          {renderInput("First Name *", "firstName", "Enter first name")}
          {renderInput("Middle Name", "middleName", "Enter middle name (optional)")}
          {renderInput("Last Name *", "lastName", "Enter last name")}

          {renderPicker(
            "Gender *",
            form.gender,
            ["male", "female"],
            (value) => updateField("gender", value),
            "Select gender"
          )}

          {renderInput(
            "Date of Birth *",
            "dateOfBirth",
            "YYYY-MM-DD",
            { maxLength: 10 }
          )}
        </View>

        {/* IDENTIFICATION AND CONTACT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Identification & Contact</Text>

          {renderInput(
            "National ID Number *",
            "nationalId",
            "Enter national ID number",
            { keyboardType: "numeric", maxLength: 20 }
          )}

          {renderInput(
            "Phone Number *",
            "phone",
            "0712345678",
            { keyboardType: "phone-pad", maxLength: 13 }
          )}

          {renderInput(
            "Email Address *",
            "email",
            "example@email.com",
            {
              keyboardType: "email-address",
              autoCapitalize: "none",
            }
          )}
        </View>

        {/* LOCATION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Location Information</Text>

          {loadingGeography ? (
            <ActivityIndicator
              color={COLORS.primary}
              style={styles.loader}
            />
          ) : (
            <>
              {renderPicker(
                "County *",
                form.county,
                counties,
                handleCountyChange,
                "Select county"
              )}

              {renderPicker(
                "Constituency *",
                form.constituency,
                constituencies,
                handleConstituencyChange,
                form.county ? "Select constituency" : "Select county first"
              )}

              {renderPicker(
                "Ward *",
                form.ward,
                wards,
                (value) => updateField("ward", value),
                form.constituency ? "Select ward" : "Select constituency first"
              )}
            </>
          )}
        </View>

        {/* OTHER INFORMATION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Other Information</Text>

          {renderInput(
            "Occupation *",
            "occupation",
            "e.g. Student, Entrepreneur, Employed"
          )}

          <Text style={styles.label}>Do you have a disability? *</Text>

          <View style={styles.choiceRow}>
            <TouchableOpacity
              style={[
                styles.choiceButton,
                form.hasDisability && styles.selectedChoice,
              ]}
              onPress={() => updateField("hasDisability", true)}
            >
              <Text
                style={[
                  styles.choiceText,
                  form.hasDisability && styles.selectedChoiceText,
                ]}
              >
                Yes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.choiceButton,
                !form.hasDisability && styles.selectedChoice,
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
                  !form.hasDisability && styles.selectedChoiceText,
                ]}
              >
                No
              </Text>
            </TouchableOpacity>
          </View>

          {form.hasDisability &&
            renderInput(
              "Specify Disability *",
              "disabilityType",
              "Describe your disability"
            )}
        </View>

        {/* MEMBERSHIP TYPE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Membership Type</Text>

          {renderPicker(
            "Select Membership Type *",
            form.membershipType,
            ["ordinary", "leadership"],
            (value) => updateField("membershipType", value),
            "Select membership type"
          )}

          <Text style={styles.helper}>
            Choose Ordinary Membership or Leadership Membership.
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (submitting || loadingGeography) && styles.disabledButton,
          ]}
          onPress={handleSubmit}
          disabled={submitting || loadingGeography}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitText}>
              SUBMIT REGISTRATION
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.loginLinkContainer}>
          <Text style={styles.loginText}>Already a member? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
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
    padding: SIZES.lg,
    paddingBottom: 50,
  },
  backButton: {
    marginBottom: SIZES.lg,
  },
  backText: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  heading: {
    fontSize: 25,
    fontWeight: "900",
    color: COLORS.primary,
  },
  subtitle: {
    color: COLORS.textSecondary,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: SIZES.lg,
  },
  section: {
    backgroundColor: COLORS.surface,
    padding: SIZES.md,
    borderRadius: RADIUS.lg,
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: SIZES.sm,
  },
  field: {
    marginTop: 12,
  },
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 7,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 13,
    backgroundColor: COLORS.white,
    color: COLORS.text,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    overflow: "hidden",
  },
  picker: {
    color: COLORS.text,
    height: 52,
  },
  loader: {
    margin: SIZES.lg,
  },
  choiceRow: {
    flexDirection: "row",
    gap: SIZES.sm,
  },
  choiceButton: {
    flex: 1,
    padding: 14,
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
  },
  selectedChoiceText: {
    color: COLORS.white,
  },
  helper: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: 17,
    borderRadius: RADIUS.md,
    alignItems: "center",
    marginTop: SIZES.md,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitText: {
    color: COLORS.white,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: SIZES.lg,
  },
  loginText: {
    color: COLORS.textSecondary,
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: "800",
  },
});
