
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { COLORS, SIZES, RADIUS } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import {
  initiateManualMembershipPayment,
  confirmManualMpesaPayment,
  getPaymentHistory,
} from "../../services/paymentService";

const JVP_MPESA_TILL_NUMBER =
  process.env.EXPO_PUBLIC_JVP_MPESA_TILL_NUMBER || "";

const getPaymentFromResponse = (response) =>
  response?.data?.payment ||
  response?.payment ||
  response?.data?.data?.payment ||
  null;

const getPaymentsFromResponse = (response) =>
  response?.data?.payments ||
  response?.data?.items ||
  response?.payments ||
  response?.data?.data?.payments ||
  [];

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

export default function MembershipPaymentScreen({ navigation }) {
  const { member, refreshUser } = useAuth();

  const [payment, setPayment] = useState(null);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [paymentState, setPaymentState] = useState("idle");
  const [message, setMessage] = useState("");

  const membershipType = member?.membershipType || "ordinary";
  const defaultFee = membershipType === "leadership" ? 100 : 50;
  const fee = Number(payment?.amount) || defaultFee;

  const paymentReference = payment?.reference || "";
  const tillNumber = JVP_MPESA_TILL_NUMBER;

  const fullName = [
    member?.firstName,
    member?.middleName,
    member?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const openDashboard = async () => {
    const updatedMember = await refreshUser();

    if (
      updatedMember?.membershipFeePaid !== true ||
      updatedMember?.membershipStatus !== "active"
    ) {
      throw new Error(
        "Your payment has not yet been verified. Please wait and check again."
      );
    }

    navigation.reset({
      index: 0,
      routes: [
        {
          name: "MainTabs",
          params: { screen: "Home" },
        },
      ],
    });
  };

  const loadPaymentHistory = async () => {
    try {
      const response = await getPaymentHistory({
        paymentFor: "membership",
        limit: 10,
      });

      const payments = getPaymentsFromResponse(response);

      const manualPayment = payments.find(
        (item) =>
          item?.provider === "manual" &&
          String(item?.paymentMethod).toLowerCase() === "mpesa" &&
          ["pending", "submitted", "successful"].includes(
            item?.status
          )
      );

      if (manualPayment) {
        setPayment(manualPayment);
        setPaymentState(manualPayment.status);

        if (manualPayment.status === "submitted") {
          setMessage(
            "Your M-Pesa confirmation code has been submitted. Awaiting administrator verification."
          );
        } else if (manualPayment.status === "successful") {
          await openDashboard();
        } else {
          setMessage(
            "Your membership payment is ready. Complete the M-Pesa Till payment and submit your confirmation code."
          );
        }
      }
    } catch (error) {
      console.error("Payment history error:", error);
      setMessage(
        "Unable to load your payment history. You can try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const handleStartPayment = async () => {
    if (initiating || submitting || checking) return;

    setInitiating(true);
    setMessage("");

    try {
      const response = await initiateManualMembershipPayment();

      if (response?.success === false) {
        throw new Error(
          response?.message || "Unable to prepare your membership payment."
        );
      }

      const newPayment = getPaymentFromResponse(response);

      if (!newPayment) {
        throw new Error(
          "The payment details were not returned. Please try again or contact support."
        );
      }

      setPayment(newPayment);
      setPaymentState(newPayment.status || "pending");
      setMessage(
        "Your membership payment is ready. Follow the M-Pesa instructions below."
      );
    } catch (error) {
      Alert.alert("Payment error", getErrorMessage(error));
    } finally {
      setInitiating(false);
    }
  };

  const handleSubmitCode = async () => {
    const code = confirmationCode.trim().toUpperCase();

    if (!paymentReference) {
      Alert.alert(
        "Payment not ready",
        "Please prepare your membership payment first."
      );
      return;
    }

    if (!/^[A-Z0-9]{8,20}$/.test(code)) {
      Alert.alert(
        "Invalid confirmation code",
        "Enter the M-Pesa confirmation code exactly as shown in your M-Pesa message. It must contain 8–20 letters or numbers."
      );
      return;
    }

    if (submitting || checking) return;

    setSubmitting(true);
    setMessage("");

    try {
      const response = await confirmManualMpesaPayment({
        reference: paymentReference,
        confirmationCode: code,
      });

      if (response?.success === false) {
        throw new Error(
          response?.message || "Unable to submit your confirmation code."
        );
      }

      setConfirmationCode("");
      setPaymentState("submitted");
      setMessage(
        response?.message ||
          "Your M-Pesa confirmation code has been submitted successfully. Your payment is awaiting administrator verification."
      );

      Alert.alert(
        "Confirmation submitted",
        "Your payment is now awaiting verification by the JVP administration."
      );
    } catch (error) {
      Alert.alert(
        "Submission error",
        getErrorMessage(error)
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!paymentReference || checking || submitting) return;

    setChecking(true);

    try {
      const response = await getPaymentHistory({
        paymentFor: "membership",
        limit: 20,
      });

      const payments = getPaymentsFromResponse(response);

      const latestPayment = payments.find(
        (item) => item?.reference === paymentReference
      );

      if (!latestPayment) {
        setMessage(
          "We could not find an updated record for this payment. Please try again shortly."
        );
        return;
      }

      setPayment(latestPayment);
      setPaymentState(latestPayment.status);

      if (latestPayment.status === "successful") {
        setMessage("Your membership payment has been approved.");

        try {
          await openDashboard();
        } catch (error) {
          Alert.alert(
            "Membership verification",
            getErrorMessage(error)
          );
        }
      } else if (latestPayment.status === "failed") {
        setMessage(
          latestPayment.statusMessage ||
            "Your payment was not approved. Please contact JVP support for assistance."
        );
      } else if (latestPayment.status === "submitted") {
        setMessage(
          "Your payment is awaiting administrator verification. Please check again later."
        );
      } else {
        setMessage(
          "Your payment is still pending. Complete the M-Pesa transaction and submit its confirmation code."
        );
      }
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setChecking(false);
    }
  };

  const isSubmitted = paymentState === "submitted";
  const isSuccessful = paymentState === "successful";
  const isFailed = paymentState === "failed";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name="wallet-outline"
            size={42}
            color={COLORS.primary}
          />
        </View>

        <Text style={styles.title}>Activate Your Membership</Text>

        <Text style={styles.subtitle}>
          Complete your membership payment to unlock your JVP Connect
          member dashboard and benefits.
        </Text>

        <View style={styles.memberCard}>
          <Text style={styles.sectionLabel}>MEMBERSHIP DETAILS</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Member</Text>
            <Text style={styles.detailValue}>
              {fullName || "JVP Member"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Membership type</Text>
            <Text style={styles.detailValue}>
              {membershipType.toUpperCase()}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={styles.pendingStatus}>
              {member?.membershipStatus || "pending_payment"}
            </Text>
          </View>

          <View style={styles.feeDivider} />

          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Membership fee</Text>
            <Text style={styles.feeAmount}>KES {fee}</Text>
          </View>

          <Text style={styles.feeNote}>
            Your payment amount is confirmed by the JVP payment system.
          </Text>
        </View>

        <View style={styles.paymentCard}>
          <Text style={styles.sectionLabel}>M-PESA TILL PAYMENT</Text>

          <View style={styles.instructionHeader}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.instructionTitle}>
              How to pay
            </Text>
          </View>

          <Text style={styles.instructionText}>
            1. Open your M-Pesa menu.
          </Text>
          <Text style={styles.instructionText}>
            2. Select Lipa na M-Pesa.
          </Text>
          <Text style={styles.instructionText}>
            3. Select Buy Goods and Services.
          </Text>
          <Text style={styles.instructionText}>
            4. Enter the JVP Till number below.
          </Text>
          <Text style={styles.instructionText}>
            5. Enter the membership amount and your M-Pesa PIN.
          </Text>
          <Text style={styles.instructionText}>
            6. Keep the M-Pesa confirmation message.
          </Text>

          <View style={styles.tillBox}>
            <Text style={styles.tillLabel}>JVP M-PESA TILL NUMBER</Text>
            <Text style={styles.tillNumber}>
              {tillNumber || "Till number not configured"}
            </Text>
          </View>

          {!tillNumber && (
            <Text style={styles.warningText}>
              The Till number is not available in the mobile configuration.
              Please contact support before making a payment.
            </Text>
          )}

          {!paymentReference && (
            <Pressable
              style={[
                styles.payButton,
                (initiating || loading || !tillNumber) &&
                  styles.disabledButton,
              ]}
              onPress={handleStartPayment}
              disabled={initiating || loading || !tillNumber}
            >
              {initiating || loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons
                    name="wallet-outline"
                    size={19}
                    color={COLORS.white}
                  />
                  <Text style={styles.payButtonText}>
                    Prepare Membership Payment
                  </Text>
                </>
              )}
            </Pressable>
          )}

          {paymentReference ? (
            <>
              <View style={styles.referenceBox}>
                <Text style={styles.tillLabel}>
                  PAYMENT REFERENCE
                </Text>
                <Text style={styles.referenceText}>
                  {paymentReference}
                </Text>
              </View>

              {!isSubmitted && !isSuccessful && !isFailed && (
                <>
                  <View style={styles.feeDivider} />

                  <Text style={styles.inputLabel}>
                    M-Pesa confirmation code
                  </Text>

                  <TextInput
                    style={styles.codeInput}
                    value={confirmationCode}
                    onChangeText={(value) =>
                      setConfirmationCode(value.toUpperCase())
                    }
                    placeholder="e.g. QWE1234567"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={20}
                    editable={!submitting && !checking}
                  />

                  <Text style={styles.helperText}>
                    Enter the transaction code from the M-Pesa message
                    received after paying.
                  </Text>

                  <Pressable
                    style={[
                      styles.payButton,
                      (submitting || checking) &&
                        styles.disabledButton,
                    ]}
                    onPress={handleSubmitCode}
                    disabled={submitting || checking}
                  >
                    {submitting ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <>
                        <Ionicons
                          name="send-outline"
                          size={18}
                          color={COLORS.white}
                        />
                        <Text style={styles.payButtonText}>
                          Submit Confirmation Code
                        </Text>
                      </>
                    )}
                  </Pressable>
                </>
              )}

              <View style={styles.statusCard}>
                <Text style={styles.sectionLabel}>
                  PAYMENT STATUS
                </Text>

                <View style={styles.statusRow}>
                  <Ionicons
                    name={
                      isSuccessful
                        ? "checkmark-circle"
                        : isFailed
                        ? "close-circle"
                        : isSubmitted
                        ? "time"
                        : "hourglass-outline"
                    }
                    size={21}
                    color={
                      isSuccessful
                        ? COLORS.success
                        : isFailed
                        ? COLORS.danger
                        : COLORS.warning
                    }
                  />

                  <Text style={styles.statusTitle}>
                    {isSuccessful
                      ? "Payment approved"
                      : isFailed
                      ? "Payment unsuccessful"
                      : isSubmitted
                      ? "Awaiting verification"
                      : "Payment pending"}
                  </Text>
                </View>

                {!!message && (
                  <Text style={styles.statusMessage}>
                    {message}
                  </Text>
                )}

                {checking && (
                  <ActivityIndicator
                    color={COLORS.primary}
                    style={styles.statusLoader}
                  />
                )}

                {!isSuccessful && !isFailed && (
                  <Pressable
                    style={[
                      styles.checkButton,
                      checking && styles.disabledButton,
                    ]}
                    onPress={handleCheckStatus}
                    disabled={checking || submitting}
                  >
                    <Text style={styles.checkButtonText}>
                      {checking
                        ? "Checking..."
                        : "Check Payment Status"}
                    </Text>
                  </Pressable>
                )}

                {isSuccessful && (
                  <Pressable
                    style={styles.payButton}
                    onPress={openDashboard}
                  >
                    <Text style={styles.payButtonText}>
                      Continue to Dashboard
                    </Text>
                  </Pressable>
                )}
              </View>
            </>
          ) : (
            !!message && (
              <Text style={styles.statusMessage}>{message}</Text>
            )
          )}

          <View style={styles.securityNote}>
            <Ionicons
              name="shield-checkmark-outline"
              size={17}
              color={COLORS.success}
            />
            <Text style={styles.securityText}>
              Your membership activates only after administrator
              verification and approval.
            </Text>
          </View>
        </View>

        <Text style={styles.footerText}>
          Need assistance? Contact the JVP Connect support team.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: SIZES.md,
    paddingBottom: SIZES.xxl,
  },
  iconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: SIZES.md,
    marginBottom: SIZES.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },
  subtitle: {
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginTop: SIZES.sm,
    marginBottom: SIZES.lg,
  },
  memberCard: {
    backgroundColor: COLORS.surface,
    padding: SIZES.md,
    borderRadius: RADIUS.lg,
    marginBottom: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paymentCard: {
    backgroundColor: COLORS.white,
    padding: SIZES.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color: COLORS.textSecondary,
    marginBottom: SIZES.md,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.sm,
  },
  detailLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  detailValue: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 13,
  },
  pendingStatus: {
    color: COLORS.warning,
    fontWeight: "700",
    fontSize: 12,
  },
  feeDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SIZES.md,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feeLabel: {
    color: COLORS.text,
    fontWeight: "700",
  },
  feeAmount: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: "900",
  },
  feeNote: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: SIZES.xs,
  },
  instructionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.xs,
    marginBottom: SIZES.sm,
  },
  instructionTitle: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 14,
  },
  instructionText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 3,
  },
  tillBox: {
    backgroundColor: COLORS.primaryLight,
    padding: SIZES.md,
    borderRadius: RADIUS.md,
    marginTop: SIZES.md,
    alignItems: "center",
  },
  tillLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: SIZES.xs,
  },
  tillNumber: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 1,
  },
  warningText: {
    color: COLORS.danger,
    fontSize: 12,
    lineHeight: 18,
    marginTop: SIZES.sm,
  },
  payButton: {
    minHeight: 52,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    marginTop: SIZES.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SIZES.sm,
    paddingHorizontal: SIZES.md,
  },
  disabledButton: {
    opacity: 0.6,
  },
  payButtonText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 14,
    textAlign: "center",
  },
  referenceBox: {
    backgroundColor: COLORS.surface,
    padding: SIZES.md,
    borderRadius: RADIUS.md,
    marginTop: SIZES.md,
    alignItems: "center",
  },
  referenceText: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  codeInput: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SIZES.md,
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 1,
  },
  helperText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    marginTop: SIZES.sm,
  },
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SIZES.md,
    marginTop: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.sm,
  },
  statusTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },
  statusMessage: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: SIZES.sm,
  },
  statusLoader: {
    marginTop: SIZES.md,
  },
  checkButton: {
    backgroundColor: COLORS.primaryLight,
    padding: SIZES.md,
    borderRadius: RADIUS.md,
    alignItems: "center",
    marginTop: SIZES.md,
  },
  checkButtonText: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: SIZES.lg,
    gap: SIZES.xs,
  },
  securityText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    flexShrink: 1,
    lineHeight: 15,
  },
  footerText: {
    color: COLORS.textSecondary,
    textAlign: "center",
    fontSize: 11,
    marginTop: SIZES.lg,
  },
});
