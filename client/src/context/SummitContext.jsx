import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  getPublicSummitBySlug,
  getPublicSummitById,
  registerSummitParticipant,

  getSummitRegistrationByTicket,
  getSummitRegistrationByEmail,
  getSummitRegistrationByPhone,

  verifySummitTicket,
  downloadSummitTicket,
  openSummitTicket,
  getAdminSummitDashboard,
  getAdminSummitRegistrations,
  getAdminSummitRegistration,
  updateSummitRegistrationStatus,
  updateSummitTicketStatus,
  checkInSummitParticipant,
  generateRegistrationTicket,
  regenerateSummitTicket,
  sendRegistrationTicketEmail,
  resendRegistrationTicketEmail,
  sendRegistrationLogisticsEmail,
} from "../services/summit.service";

/* ==========================================
   CONTEXT
========================================== */

const SummitContext = createContext(null);

/* ==========================================
   INITIAL STATE
========================================== */

const initialPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const initialRegistrationFilters = {
  page: 1,
  limit: 20,
  county: "",
  countyCode: "",
  participantType: "",
  status: "",
  ticketStatus: "",
  checkedIn: "",
  search: "",
  sortBy: "registeredAt",
  sortOrder: "desc",
};

/* ==========================================
   HELPERS
========================================== */

const extractErrorMessage = (
  error,
  fallbackMessage =
    "Something went wrong. Please try again."
) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage
  );
};

const extractValidationErrors = (error) => {
  const errors =
    error?.response?.data?.errors;

  return Array.isArray(errors)
    ? errors
    : [];
};

const getPayloadData = (response) => {
  return response?.data || response || null;
};

const getSummitFromResponse = (
  response
) => {
  const payload = getPayloadData(
    response
  );

  return (
    payload?.summitEvent ||
    payload?.summit ||
    payload?.event ||
    payload
  );
};

const getRegistrationFromResponse = (
  response
) => {
  const payload = getPayloadData(
    response
  );

  return (
    payload?.registration ||
    payload
  );
};

const getRegistrationsFromResponse = (
  response
) => {
  const payload = getPayloadData(
    response
  );

  return (
    payload?.registrations ||
    payload?.items ||
    []
  );
};

const getPaginationFromResponse = (
  response
) => {
  const payload = getPayloadData(
    response
  );

  const pagination =
    payload?.pagination || {};

  return {
    page:
      pagination.page ??
      initialPagination.page,

    limit:
      pagination.limit ??
      initialPagination.limit,

    total:
      pagination.total ??
      pagination.totalRecords ??
      pagination.totalItems ??
      0,

    totalPages:
      pagination.totalPages ?? 0,

    hasNextPage:
      pagination.hasNextPage ??
      false,

    hasPreviousPage:
      pagination.hasPreviousPage ??
      false,
  };
};

/* ==========================================
   PROVIDER
========================================== */

export const SummitProvider = ({
  children,
}) => {
  /* ========================================
     PUBLIC SUMMIT STATE
  ======================================== */

  const [
    summit,
    setSummit,
  ] = useState(null);

  const [
    summitLoading,
    setSummitLoading,
  ] = useState(false);

  const [
    summitError,
    setSummitError,
  ] = useState(null);

  /* ========================================
     PUBLIC REGISTRATION STATE
  ======================================== */

  const [
    registrationResult,
    setRegistrationResult,
  ] = useState(null);

  const [
    registrationLoading,
    setRegistrationLoading,
  ] = useState(false);

  const [
    registrationError,
    setRegistrationError,
  ] = useState(null);

  const [
    registrationValidationErrors,
    setRegistrationValidationErrors,
  ] = useState([]);

  /* ========================================
     TICKET LOOKUP AND VERIFICATION
  ======================================== */

  const [
    ticketRegistration,
    setTicketRegistration,
  ] = useState(null);

  const [
    ticketVerification,
    setTicketVerification,
  ] = useState(null);

  const [
    ticketLoading,
    setTicketLoading,
  ] = useState(false);

  const [
    ticketError,
    setTicketError,
  ] = useState(null);

  /* ========================================
     ADMIN DASHBOARD
  ======================================== */

  const [
    adminDashboard,
    setAdminDashboard,
  ] = useState(null);

  const [
    dashboardLoading,
    setDashboardLoading,
  ] = useState(false);

  const [
    dashboardError,
    setDashboardError,
  ] = useState(null);

  /* ========================================
     ADMIN REGISTRATIONS
  ======================================== */

  const [
    registrations,
    setRegistrations,
  ] = useState([]);

  const [
    selectedRegistration,
    setSelectedRegistration,
  ] = useState(null);

  const [
    registrationFilters,
    setRegistrationFilters,
  ] = useState(
    initialRegistrationFilters
  );

  const [
    pagination,
    setPagination,
  ] = useState(initialPagination);

  const [
    registrationsLoading,
    setRegistrationsLoading,
  ] = useState(false);

  const [
    registrationsError,
    setRegistrationsError,
  ] = useState(null);

  const [
    selectedRegistrationLoading,
    setSelectedRegistrationLoading,
  ] = useState(false);

  /* ========================================
     ADMIN ACTION STATE
  ======================================== */

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const [
    actionError,
    setActionError,
  ] = useState(null);

  const [
    actionSuccess,
    setActionSuccess,
  ] = useState(null);

  /* ========================================
     PUBLIC SUMMIT ACTIONS
  ======================================== */

  const fetchPublicSummitBySlug =
    useCallback(async (slug) => {
      setSummitLoading(true);
      setSummitError(null);

      try {
        const response =
          await getPublicSummitBySlug(
            slug
          );

        const summitData =
          getSummitFromResponse(
            response
          );

        setSummit(summitData);

        return {
          success: true,
          data: summitData,
          response,
        };
      } catch (error) {
        const message =
          extractErrorMessage(
            error,
            "The summit could not be loaded."
          );

        setSummitError(message);

        return {
          success: false,
          message,
          error,
        };
      } finally {
        setSummitLoading(false);
      }
    }, []);

  const fetchPublicSummitById =
    useCallback(
      async (summitEventId) => {
        setSummitLoading(true);
        setSummitError(null);

        try {
          const response =
            await getPublicSummitById(
              summitEventId
            );

          const summitData =
            getSummitFromResponse(
              response
            );

          setSummit(summitData);

          return {
            success: true,
            data: summitData,
            response,
          };
        } catch (error) {
          const message =
            extractErrorMessage(
              error,
              "The summit could not be loaded."
            );

          setSummitError(message);

          return {
            success: false,
            message,
            error,
          };
        } finally {
          setSummitLoading(false);
        }
      },
      []
    );

  const submitSummitRegistration =
    useCallback(
      async (registrationData) => {
        setRegistrationLoading(true);
        setRegistrationError(null);
        setRegistrationValidationErrors(
          []
        );
        setRegistrationResult(null);

        try {
          const response =
            await registerSummitParticipant(
              registrationData
            );

          const result =
            getPayloadData(response);

          setRegistrationResult(result);

          return {
            success: true,
            data: result,
            response,
          };
        } catch (error) {
          const message =
            extractErrorMessage(
              error,
              "The summit registration could not be completed."
            );

          const validationErrors =
            extractValidationErrors(
              error
            );

          setRegistrationError(message);
          setRegistrationValidationErrors(
            validationErrors
          );

          return {
            success: false,
            message,
            errors: validationErrors,
            error,
          };
        } finally {
          setRegistrationLoading(false);
        }
      },
      []
    );

  /* ========================================
     PUBLIC TICKET ACTIONS
  ======================================== */

  const lookupRegistrationByTicket =
    useCallback(
      async (ticketNumber) => {
        setTicketLoading(true);
        setTicketError(null);
        setTicketRegistration(null);

        try {
          const response =
            await getSummitRegistrationByTicket(
              ticketNumber
            );

          const registration =
            getRegistrationFromResponse(
              response
            );

          setTicketRegistration(
            registration
          );

          return {
            success: true,
            data: registration,
            response,
          };
        } catch (error) {
          const message =
            extractErrorMessage(
              error,
              "The summit registration could not be found."
            );

          setTicketError(message);

          return {
            success: false,
            message,
            error,
          };
        } finally {
          setTicketLoading(false);
        }
      },
      []
    );

  const lookupRegistrationByEmail =
  useCallback(
    async (
      email,
      nationalIdLastFour
    ) => {
      setTicketLoading(true);
      setTicketError(null);
      setTicketRegistration(null);

      try {
        const response =
          await getSummitRegistrationByEmail(
            email,
            nationalIdLastFour
          );

        const registration =
          getRegistrationFromResponse(
            response
          );

        setTicketRegistration(
          registration
        );

        return {
          success: true,
          data: registration,
          response,
        };
      } catch (error) {
        const message =
          extractErrorMessage(
            error,
            "The summit registration could not be found using that email address."
          );

        setTicketError(message);

        return {
          success: false,
          message,
          error,
        };
      } finally {
        setTicketLoading(false);
      }
    },
    []
  );

const lookupRegistrationByPhone =
  useCallback(
    async (
      phone,
      nationalIdLastFour
    ) => {
      setTicketLoading(true);
      setTicketError(null);
      setTicketRegistration(null);

      try {
        const response =
          await getSummitRegistrationByPhone(
            phone,
            nationalIdLastFour
          );

        const registration =
          getRegistrationFromResponse(
            response
          );

        setTicketRegistration(
          registration
        );

        return {
          success: true,
          data: registration,
          response,
        };
      } catch (error) {
        const message =
          extractErrorMessage(
            error,
            "The summit registration could not be found using that phone number."
          );

        setTicketError(message);

        return {
          success: false,
          message,
          error,
        };
      } finally {
        setTicketLoading(false);
      }
    },
    []
  );
    

  const verifyTicket =
    useCallback(
      async ({
        ticketNumber,
        code,
      }) => {
        setTicketLoading(true);
        setTicketError(null);
        setTicketVerification(null);

        try {
          const response =
            await verifySummitTicket({
              ticketNumber,
              code,
            });

          const payload =
            getPayloadData(response);

          const verification =
            payload?.verification ||
            payload;

          setTicketVerification(
            verification
          );

          return {
            success: true,
            data: verification,
            response,
          };
        } catch (error) {
          const message =
            extractErrorMessage(
              error,
              "The summit ticket could not be verified."
            );

          setTicketError(message);

          return {
            success: false,
            message,
            error,
          };
        } finally {
          setTicketLoading(false);
        }
      },
      []
    );

  const downloadTicket =
    useCallback(
      async (ticketNumber) => {
        setTicketLoading(true);
        setTicketError(null);

        try {
          const response =
            await downloadSummitTicket(
              ticketNumber
            );

          return {
            success: true,
            data: response,
          };
        } catch (error) {
          const message =
            extractErrorMessage(
              error,
              "The summit ticket could not be downloaded."
            );

          setTicketError(message);

          return {
            success: false,
            message,
            error,
          };
        } finally {
          setTicketLoading(false);
        }
      },
      []
    );

  const openTicket =
    useCallback(
      async (ticketNumber) => {
        setTicketLoading(true);
        setTicketError(null);

        try {
          const response =
            await openSummitTicket(
              ticketNumber
            );

          return {
            success: true,
            data: response,
          };
        } catch (error) {
          const message =
            extractErrorMessage(
              error,
              "The summit ticket could not be opened."
            );

          setTicketError(message);

          return {
            success: false,
            message,
            error,
          };
        } finally {
          setTicketLoading(false);
        }
      },
      []
    );

  /* ========================================
     ADMIN DASHBOARD ACTIONS
  ======================================== */

  const fetchAdminDashboard =
    useCallback(
      async (summitEventId) => {
        setDashboardLoading(true);
        setDashboardError(null);

        try {
          const response =
            await getAdminSummitDashboard(
              summitEventId
            );

          const dashboard =
            getPayloadData(response);

          setAdminDashboard(dashboard);

          return {
            success: true,
            data: dashboard,
            response,
          };
        } catch (error) {
          const message =
            extractErrorMessage(
              error,
              "The summit dashboard could not be loaded."
            );

          setDashboardError(message);

          return {
            success: false,
            message,
            error,
          };
        } finally {
          setDashboardLoading(false);
        }
      },
      []
    );

  /* ========================================
     ADMIN REGISTRATION ACTIONS
  ======================================== */

  const fetchAdminRegistrations =
    useCallback(
      async (
        summitEventId,
        filters = registrationFilters
      ) => {
        setRegistrationsLoading(true);
        setRegistrationsError(null);

        try {
          const response =
            await getAdminSummitRegistrations(
              summitEventId,
              filters
            );

          const list =
            getRegistrationsFromResponse(
              response
            );

          const paginationData =
            getPaginationFromResponse(
              response
            );

          setRegistrations(list);
          setPagination(
            paginationData
          );

          return {
            success: true,
            data: list,
            pagination:
              paginationData,
            response,
          };
        } catch (error) {
          const message =
            extractErrorMessage(
              error,
              "Summit registrations could not be loaded."
            );

          setRegistrationsError(
            message
          );

          return {
            success: false,
            message,
            error,
          };
        } finally {
          setRegistrationsLoading(
            false
          );
        }
      },
      [registrationFilters]
    );

  const fetchAdminRegistration =
    useCallback(
      async (registrationId) => {
        setSelectedRegistrationLoading(
          true
        );
        setRegistrationsError(null);

        try {
          const response =
            await getAdminSummitRegistration(
              registrationId
            );

          const registration =
            getRegistrationFromResponse(
              response
            );

          setSelectedRegistration(
            registration
          );

          return {
            success: true,
            data: registration,
            response,
          };
        } catch (error) {
          const message =
            extractErrorMessage(
              error,
              "The summit registration could not be loaded."
            );

          setRegistrationsError(
            message
          );

          return {
            success: false,
            message,
            error,
          };
        } finally {
          setSelectedRegistrationLoading(
            false
          );
        }
      },
      []
    );

  const updateRegistrationInState =
    useCallback(
      (updatedRegistration) => {
        if (!updatedRegistration?._id) {
          return;
        }

        setRegistrations(
          (currentRegistrations) =>
            currentRegistrations.map(
              (registration) =>
                registration._id ===
                updatedRegistration._id
                  ? {
                      ...registration,
                      ...updatedRegistration,
                    }
                  : registration
            )
        );

        setSelectedRegistration(
          (currentRegistration) => {
            if (
              currentRegistration?._id !==
              updatedRegistration._id
            ) {
              return currentRegistration;
            }

            return {
              ...currentRegistration,
              ...updatedRegistration,
            };
          }
        );
      },
      []
    );

  const changeRegistrationStatus =
    useCallback(
      async (
        registrationId,
        statusData
      ) => {
        setActionLoading(true);
        setActionError(null);
        setActionSuccess(null);

        try {
          const response =
            await updateSummitRegistrationStatus(
              registrationId,
              statusData
            );

          const updatedRegistration =
            getRegistrationFromResponse(
              response
            );

          updateRegistrationInState(
            updatedRegistration
          );

          const message =
            response?.message ||
            "Registration status updated successfully.";

          setActionSuccess(message);

          return {
            success: true,
            data: updatedRegistration,
            response,
          };
        } catch (error) {
          const message =
            extractErrorMessage(
              error,
              "The registration status could not be updated."
            );

          setActionError(message);

          return {
            success: false,
            message,
            error,
          };
        } finally {
          setActionLoading(false);
        }
      },
      [updateRegistrationInState]
    );

  const changeTicketStatus =
    useCallback(
      async (
        registrationId,
        statusData
      ) => {
        setActionLoading(true);
        setActionError(null);
        setActionSuccess(null);

        try {
          const response =
            await updateSummitTicketStatus(
              registrationId,
              statusData
            );

          const updatedRegistration =
            getRegistrationFromResponse(
              response
            );

          updateRegistrationInState(
            updatedRegistration
          );

          const message =
            response?.message ||
            "Ticket status updated successfully.";

          setActionSuccess(message);

          return {
            success: true,
            data: updatedRegistration,
            response,
          };
        } catch (error) {
          const message =
            extractErrorMessage(
              error,
              "The ticket status could not be updated."
            );

          setActionError(message);

          return {
            success: false,
            message,
            error,
          };
        } finally {
          setActionLoading(false);
        }
      },
      [updateRegistrationInState]
    );

  /* ========================================
     ADMIN CHECK-IN
  ======================================== */

  const checkInParticipant =
    useCallback(
      async (checkInData) => {
        setActionLoading(true);
        setActionError(null);
        setActionSuccess(null);

        try {
          const response =
            await checkInSummitParticipant(
              checkInData
            );

          const payload =
            getPayloadData(response);

          const registration =
            payload?.registration ||
            payload?.participant ||
            payload;

          updateRegistrationInState(
            registration
          );

          const message =
            response?.message ||
            "Participant checked in successfully.";

          setActionSuccess(message);

          return {
            success: true,
            data: payload,
            response,
          };
        } catch (error) {
          const message =
            extractErrorMessage(
              error,
              "The participant could not be checked in."
            );

          setActionError(message);

          return {
            success: false,
            message,
            error,
          };
        } finally {
          setActionLoading(false);
        }
      },
      [updateRegistrationInState]
    );

  const checkInByTicket =
    useCallback(
      async (
        ticketNumber,
        verificationCode
      ) => {
        const payload = {
          ticketNumber:
            String(
              ticketNumber || ""
            ).trim(),
        };

        if (verificationCode) {
          payload.verificationCode =
            String(
              verificationCode
            ).trim();
        }

        return checkInParticipant(
          payload
        );
      },
      [checkInParticipant]
    );

  /* ========================================
     ADMIN TICKET ACTIONS
  ======================================== */

  const generateTicket =
    useCallback(
      async (registrationId) => {
        setActionLoading(true);
        setActionError(null);
        setActionSuccess(null);

        try {
          const response =
            await generateRegistrationTicket(
              registrationId
            );

          const payload =
            getPayloadData(response);

          const message =
            response?.message ||
            "Summit ticket generated successfully.";

          setActionSuccess(message);

          return {
            success: true,
            data: payload,
            response,
          };
        } catch (error) {
          const message =
            extractErrorMessage(
              error,
              "The summit ticket could not be generated."
            );

          setActionError(message);

          return {
            success: false,
            message,
            error,
          };
        } finally {
          setActionLoading(false);
        }
      },
      []
    );

  const regenerateTicket =
    useCallback(
      async (registrationId) => {
        setActionLoading(true);
        setActionError(null);
        setActionSuccess(null);

        try {
          const response =
            await regenerateSummitTicket(
              registrationId
            );

          const payload =
            getPayloadData(response);

          const message =
            response?.message ||
            "Summit ticket regenerated successfully.";

          setActionSuccess(message);

          return {
            success: true,
            data: payload,
            response,
          };
        } catch (error) {
          const message =
            extractErrorMessage(
              error,
              "The summit ticket could not be regenerated."
            );

          setActionError(message);

          return {
            success: false,
            message,
            error,
          };
        } finally {
          setActionLoading(false);
        }
      },
      []
    );

  /* ========================================
     ADMIN EMAIL ACTIONS
  ======================================== */

  const sendTicketEmail =
    useCallback(
      async (registrationId) => {
        setActionLoading(true);
        setActionError(null);
        setActionSuccess(null);

        try {
          const response =
            await sendRegistrationTicketEmail(
              registrationId
            );

          const payload =
            getPayloadData(response);

          const message =
            response?.message ||
            "Ticket email sent successfully.";

          setActionSuccess(message);

          return {
            success: true,
            data: payload,
            response,
          };
        } catch (error) {
          const message =
            extractErrorMessage(
              error,
              "The ticket email could not be sent."
            );

          setActionError(message);

          return {
            success: false,
            message,
            error,
          };
        } finally {
          setActionLoading(false);
        }
      },
      []
    );

  const resendTicketEmail =
    useCallback(
      async (
        registrationId,
        payload = {}
      ) => {
        setActionLoading(true);
        setActionError(null);
        setActionSuccess(null);

        try {
          const response =
            await resendRegistrationTicketEmail(
              registrationId,
              payload
            );

          const result =
            getPayloadData(response);

          const message =
            response?.message ||
            "Ticket email resent successfully.";

          setActionSuccess(message);

          return {
            success: true,
            data: result,
            response,
          };
        } catch (error) {
          const message =
            extractErrorMessage(
              error,
              "The ticket email could not be resent."
            );

          setActionError(message);

          return {
            success: false,
            message,
            error,
          };
        } finally {
          setActionLoading(false);
        }
      },
      []
    );

  const sendLogisticsEmail =
    useCallback(
      async (
        registrationId,
        logisticsData
      ) => {
        setActionLoading(true);
        setActionError(null);
        setActionSuccess(null);

        try {
          const response =
            await sendRegistrationLogisticsEmail(
              registrationId,
              logisticsData
            );

          const payload =
            getPayloadData(response);

          const message =
            response?.message ||
            "Logistics email sent successfully.";

          setActionSuccess(message);

          return {
            success: true,
            data: payload,
            response,
          };
        } catch (error) {
          const message =
            extractErrorMessage(
              error,
              "The logistics email could not be sent."
            );

          setActionError(message);

          return {
            success: false,
            message,
            errors:
              extractValidationErrors(
                error
              ),
            error,
          };
        } finally {
          setActionLoading(false);
        }
      },
      []
    );

  /* ========================================
     FILTER ACTIONS
  ======================================== */

  const updateRegistrationFilters =
    useCallback((updates) => {
      setRegistrationFilters(
        (currentFilters) => ({
          ...currentFilters,
          ...updates,
        })
      );
    }, []);

  const resetRegistrationFilters =
    useCallback(() => {
      setRegistrationFilters(
        initialRegistrationFilters
      );
    }, []);

  /* ========================================
     CLEAR ACTIONS
  ======================================== */

  const clearSummitError =
    useCallback(() => {
      setSummitError(null);
    }, []);

  const clearRegistrationState =
    useCallback(() => {
      setRegistrationResult(null);
      setRegistrationError(null);
      setRegistrationValidationErrors(
        []
      );
    }, []);

  const clearTicketState =
    useCallback(() => {
      setTicketRegistration(null);
      setTicketVerification(null);
      setTicketError(null);
    }, []);

  const clearSelectedRegistration =
    useCallback(() => {
      setSelectedRegistration(null);
    }, []);

  const clearActionState =
    useCallback(() => {
      setActionError(null);
      setActionSuccess(null);
    }, []);

  const resetSummitContext =
    useCallback(() => {
      setSummit(null);
      setSummitError(null);

      setRegistrationResult(null);
      setRegistrationError(null);
      setRegistrationValidationErrors(
        []
      );

      setTicketRegistration(null);
      setTicketVerification(null);
      setTicketError(null);

      setAdminDashboard(null);
      setDashboardError(null);

      setRegistrations([]);
      setSelectedRegistration(null);
      setRegistrationsError(null);

      setRegistrationFilters(
        initialRegistrationFilters
      );

      setPagination(
        initialPagination
      );

      setActionError(null);
      setActionSuccess(null);
    }, []);

  /* ========================================
     COMPUTED VALUES
  ======================================== */

  const isLoading =
    summitLoading ||
    registrationLoading ||
    ticketLoading ||
    dashboardLoading ||
    registrationsLoading ||
    selectedRegistrationLoading ||
    actionLoading;

  /* ========================================
     CONTEXT VALUE
  ======================================== */

  const contextValue = useMemo(
    () => ({
      // Public summit state
      summit,
      summitLoading,
      summitError,

      // Registration state
      registrationResult,
      registrationLoading,
      registrationError,
      registrationValidationErrors,

      // Ticket state
      ticketRegistration,
      ticketVerification,
      ticketLoading,
      ticketError,

      // Admin dashboard state
      adminDashboard,
      dashboardLoading,
      dashboardError,

      // Admin registration state
      registrations,
      selectedRegistration,
      registrationFilters,
      pagination,
      registrationsLoading,
      registrationsError,
      selectedRegistrationLoading,

      // Shared admin action state
      actionLoading,
      actionError,
      actionSuccess,
      isLoading,

      // Public summit actions
      fetchPublicSummitBySlug,
      fetchPublicSummitById,
      submitSummitRegistration,

      // Public ticket actions
lookupRegistrationByTicket,
lookupRegistrationByEmail,
lookupRegistrationByPhone,
verifyTicket,
downloadTicket,
openTicket,

      // Admin dashboard actions
      fetchAdminDashboard,

      // Admin registration actions
      fetchAdminRegistrations,
      fetchAdminRegistration,
      changeRegistrationStatus,
      changeTicketStatus,

      // Check-in actions
      checkInParticipant,
      checkInByTicket,

      // Ticket management actions
      generateTicket,
      regenerateTicket,

      // Email actions
      sendTicketEmail,
      resendTicketEmail,
      sendLogisticsEmail,

      // Filter actions
      setRegistrationFilters,
      updateRegistrationFilters,
      resetRegistrationFilters,

      // Direct state setters
      setSummit,
      setRegistrations,
      setSelectedRegistration,

      // Clear/reset actions
      clearSummitError,
      clearRegistrationState,
      clearTicketState,
      clearSelectedRegistration,
      clearActionState,
      resetSummitContext,
    }),
    [
      summit,
      summitLoading,
      summitError,
      registrationResult,
      registrationLoading,
      registrationError,
      registrationValidationErrors,
      ticketRegistration,
      ticketVerification,
      ticketLoading,
      ticketError,
      adminDashboard,
      dashboardLoading,
      dashboardError,
      registrations,
      selectedRegistration,
      registrationFilters,
      pagination,
      registrationsLoading,
      registrationsError,
      selectedRegistrationLoading,
      actionLoading,
      actionError,
      actionSuccess,
      isLoading,
      fetchPublicSummitBySlug,
      fetchPublicSummitById,
      submitSummitRegistration,
      lookupRegistrationByTicket,
lookupRegistrationByEmail,
lookupRegistrationByPhone,
verifyTicket,
downloadTicket,
openTicket,
      fetchAdminDashboard,
      fetchAdminRegistrations,
      fetchAdminRegistration,
      changeRegistrationStatus,
      changeTicketStatus,
      checkInParticipant,
      checkInByTicket,
      generateTicket,
      regenerateTicket,
      sendTicketEmail,
      resendTicketEmail,
      sendLogisticsEmail,
      updateRegistrationFilters,
      resetRegistrationFilters,
      clearSummitError,
      clearRegistrationState,
      clearTicketState,
      clearSelectedRegistration,
      clearActionState,
      resetSummitContext,
    ]
  );

  return (
    <SummitContext.Provider
      value={contextValue}
    >
      {children}
    </SummitContext.Provider>
  );
};

/* ==========================================
   CUSTOM HOOK
========================================== */

export const useSummit = () => {
  const context =
    useContext(SummitContext);

  if (!context) {
    throw new Error(
      "useSummit must be used inside a SummitProvider."
    );
  }

  return context;
};

export default SummitContext;