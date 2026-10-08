import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import contactService from "../services/contact.service";

const ContactContext = createContext(null);

export const ContactProvider = ({ children }) => {
  /*
  |--------------------------------------------------------------------------
  | PUBLIC CONTACT FORM
  |--------------------------------------------------------------------------
  */

  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | ADMIN CONTACTS
  |--------------------------------------------------------------------------
  */

  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);

  const [statistics, setStatistics] = useState(null);
  const [recentContacts, setRecentContacts] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [recentLoading, setRecentLoading] = useState(false);

  const [error, setError] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | CONTACT FILTERS
  |--------------------------------------------------------------------------
  */

  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: "",
    status: "",
    category: "",
    priority: "",
    assignedTo: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  /*
  |--------------------------------------------------------------------------
  | HELPERS
  |--------------------------------------------------------------------------
  */

  const extractErrorMessage = useCallback((err, fallback) => {
    return (
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      fallback
    );
  }, []);

  /*
  |--------------------------------------------------------------------------
  | PUBLIC - SUBMIT CONTACT
  |--------------------------------------------------------------------------
  */

  const submitContact = useCallback(
    async (contactData) => {
      setSubmissionLoading(true);
      setSubmissionError(null);
      setSubmissionSuccess(false);
      setSubmissionResult(null);

      try {
        const result = await contactService.createContact(
          contactData
        );

        setSubmissionResult(result);
        setSubmissionSuccess(true);

        return result;
      } catch (err) {
        const message = extractErrorMessage(
          err,
          "Unable to send your message. Please try again."
        );

        setSubmissionError(message);

        throw err;
      } finally {
        setSubmissionLoading(false);
      }
    },
    [extractErrorMessage]
  );

  /*
  |--------------------------------------------------------------------------
  | PUBLIC - RESET SUBMISSION
  |--------------------------------------------------------------------------
  */

  const resetSubmission = useCallback(() => {
    setSubmissionLoading(false);
    setSubmissionError(null);
    setSubmissionSuccess(false);
    setSubmissionResult(null);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | ADMIN - GET CONTACTS
  |--------------------------------------------------------------------------
  */

  const fetchContacts = useCallback(
    async (params = {}) => {
      setLoading(true);
      setError(null);

      try {
        const requestParams = {
          ...filters,
          ...params,
        };

        const result = await contactService.getContacts(
          requestParams
        );

        setContacts(result?.contacts || []);

        if (result?.pagination) {
          setPagination(result.pagination);
        }

        return result;
      } catch (err) {
        const message = extractErrorMessage(
          err,
          "Unable to load contact enquiries."
        );

        setError(message);

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [extractErrorMessage, filters]
  );

  /*
  |--------------------------------------------------------------------------
  | ADMIN - GET CONTACT BY ID
  |--------------------------------------------------------------------------
  */

  const fetchContact = useCallback(
    async (contactId) => {
      if (!contactId) return null;

      setDetailsLoading(true);
      setError(null);

      try {
        const result =
          await contactService.getContactById(contactId);

        const contact = result?.contact || null;

        setSelectedContact(contact);

        return contact;
      } catch (err) {
        const message = extractErrorMessage(
          err,
          "Unable to load this contact enquiry."
        );

        setError(message);

        throw err;
      } finally {
        setDetailsLoading(false);
      }
    },
    [extractErrorMessage]
  );

  /*
  |--------------------------------------------------------------------------
  | ADMIN - STATISTICS
  |--------------------------------------------------------------------------
  */

  const fetchStatistics = useCallback(async () => {
    setStatisticsLoading(true);
    setError(null);

    try {
      const result =
        await contactService.getContactStatistics();

      const data = result?.statistics || null;

      setStatistics(data);

      return data;
    } catch (err) {
      const message = extractErrorMessage(
        err,
        "Unable to load contact statistics."
      );

      setError(message);

      throw err;
    } finally {
      setStatisticsLoading(false);
    }
  }, [extractErrorMessage]);

  /*
  |--------------------------------------------------------------------------
  | ADMIN - RECENT CONTACTS
  |--------------------------------------------------------------------------
  */

  const fetchRecentContacts = useCallback(
    async (limit = 5) => {
      setRecentLoading(true);
      setError(null);

      try {
        const result =
          await contactService.getRecentContacts(limit);

        const data = result?.contacts || [];

        setRecentContacts(data);

        return data;
      } catch (err) {
        const message = extractErrorMessage(
          err,
          "Unable to load recent contact enquiries."
        );

        setError(message);

        throw err;
      } finally {
        setRecentLoading(false);
      }
    },
    [extractErrorMessage]
  );

  /*
  |--------------------------------------------------------------------------
  | STATUS ACTIONS
  |--------------------------------------------------------------------------
  */

  const markAsRead = useCallback(
    async (contactId) => {
      const result =
        await contactService.markContactAsRead(contactId);

      const updatedContact = result?.contact;

      if (updatedContact) {
        setSelectedContact((current) =>
          current?._id === contactId
            ? updatedContact
            : current
        );

        setContacts((current) =>
          current.map((contact) =>
            contact._id === contactId
              ? { ...contact, ...updatedContact }
              : contact
          )
        );
      }

      return result;
    },
    []
  );

  const markInProgress = useCallback(
    async (contactId) => {
      const result =
        await contactService.markContactInProgress(
          contactId
        );

      const updatedContact = result?.contact;

      if (updatedContact) {
        setSelectedContact((current) =>
          current?._id === contactId
            ? updatedContact
            : current
        );

        setContacts((current) =>
          current.map((contact) =>
            contact._id === contactId
              ? { ...contact, ...updatedContact }
              : contact
          )
        );
      }

      return result;
    },
    []
  );

  const updateStatus = useCallback(
    async (contactId, status) => {
      const result =
        await contactService.updateContactStatus(
          contactId,
          status
        );

      const updatedContact = result?.contact;

      if (updatedContact) {
        setSelectedContact((current) =>
          current?._id === contactId
            ? updatedContact
            : current
        );

        setContacts((current) =>
          current.map((contact) =>
            contact._id === contactId
              ? { ...contact, ...updatedContact }
              : contact
          )
        );
      }

      return result;
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | PRIORITY
  |--------------------------------------------------------------------------
  */

  const updatePriority = useCallback(
    async (contactId, priority) => {
      const result =
        await contactService.updateContactPriority(
          contactId,
          priority
        );

      const updatedContact = result?.contact;

      if (updatedContact) {
        setSelectedContact((current) =>
          current?._id === contactId
            ? updatedContact
            : current
        );

        setContacts((current) =>
          current.map((contact) =>
            contact._id === contactId
              ? { ...contact, ...updatedContact }
              : contact
          )
        );
      }

      return result;
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | ASSIGNMENT
  |--------------------------------------------------------------------------
  */

  const assignContact = useCallback(
    async (contactId, userId) => {
      const result =
        await contactService.assignContact(
          contactId,
          userId
        );

      const updatedContact = result?.contact;

      if (updatedContact) {
        setSelectedContact((current) =>
          current?._id === contactId
            ? updatedContact
            : current
        );

        setContacts((current) =>
          current.map((contact) =>
            contact._id === contactId
              ? { ...contact, ...updatedContact }
              : contact
          )
        );
      }

      return result;
    },
    []
  );

  const unassignContact = useCallback(
    async (contactId) => {
      const result =
        await contactService.unassignContact(contactId);

      const updatedContact = result?.contact;

      if (updatedContact) {
        setSelectedContact((current) =>
          current?._id === contactId
            ? updatedContact
            : current
        );

        setContacts((current) =>
          current.map((contact) =>
            contact._id === contactId
              ? { ...contact, ...updatedContact }
              : contact
          )
        );
      }

      return result;
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | RESPONSE
  |--------------------------------------------------------------------------
  */

  const respondToContact = useCallback(
    async (contactId, responseText) => {
      const result =
        await contactService.respondToContact(
          contactId,
          responseText
        );

      const updatedContact = result?.contact;

      if (updatedContact) {
        setSelectedContact((current) =>
          current?._id === contactId
            ? updatedContact
            : current
        );

        setContacts((current) =>
          current.map((contact) =>
            contact._id === contactId
              ? { ...contact, ...updatedContact }
              : contact
          )
        );
      }

      return result;
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | INTERNAL NOTES
  |--------------------------------------------------------------------------
  */

  const updateNotes = useCallback(
    async (contactId, internalNotes) => {
      const result =
        await contactService.updateContactNotes(
          contactId,
          internalNotes
        );

      const updatedContact = result?.contact;

      if (updatedContact) {
        setSelectedContact((current) =>
          current?._id === contactId
            ? updatedContact
            : current
        );

        setContacts((current) =>
          current.map((contact) =>
            contact._id === contactId
              ? { ...contact, ...updatedContact }
              : contact
          )
        );
      }

      return result;
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | ARCHIVE
  |--------------------------------------------------------------------------
  */

  const archiveContact = useCallback(
    async (contactId) => {
      const result =
        await contactService.archiveContact(contactId);

      const updatedContact = result?.contact;

      if (updatedContact) {
        setSelectedContact((current) =>
          current?._id === contactId
            ? updatedContact
            : current
        );

        setContacts((current) =>
          current.map((contact) =>
            contact._id === contactId
              ? { ...contact, ...updatedContact }
              : contact
          )
        );
      }

      return result;
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | RESTORE
  |--------------------------------------------------------------------------
  */

  const restoreContact = useCallback(
    async (contactId) => {
      const result =
        await contactService.restoreContact(contactId);

      const updatedContact = result?.contact;

      if (updatedContact) {
        setSelectedContact((current) =>
          current?._id === contactId
            ? updatedContact
            : current
        );

        setContacts((current) =>
          current.map((contact) =>
            contact._id === contactId
              ? { ...contact, ...updatedContact }
              : contact
          )
        );
      }

      return result;
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */

  const removeContact = useCallback(
    async (contactId) => {
      const result =
        await contactService.deleteContact(contactId);

      setContacts((current) =>
        current.filter(
          (contact) => contact._id !== contactId
        )
      );

      setRecentContacts((current) =>
        current.filter(
          (contact) => contact._id !== contactId
        )
      );

      if (selectedContact?._id === contactId) {
        setSelectedContact(null);
      }

      return result;
    },
    [selectedContact]
  );

  /*
  |--------------------------------------------------------------------------
  | FILTER MANAGEMENT
  |--------------------------------------------------------------------------
  */

  const updateFilters = useCallback((updates) => {
    setFilters((current) => ({
      ...current,
      ...updates,
      page:
        updates.page !== undefined
          ? updates.page
          : 1,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 20,
      search: "",
      status: "",
      category: "",
      priority: "",
      assignedTo: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  }, []);

  /*
  |--------------------------------------------------------------------------
  | SELECTED CONTACT
  |--------------------------------------------------------------------------
  */

  const clearSelectedContact = useCallback(() => {
    setSelectedContact(null);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CONTEXT VALUE
  |--------------------------------------------------------------------------
  */

  const value = useMemo(
    () => ({
      /*
      | Public
      */
      submitContact,
      submissionLoading,
      submissionError,
      submissionSuccess,
      submissionResult,
      resetSubmission,

      /*
      | Contacts
      */
      contacts,
      selectedContact,
      pagination,

      /*
      | Dashboard
      */
      statistics,
      recentContacts,

      /*
      | Loading
      */
      loading,
      detailsLoading,
      statisticsLoading,
      recentLoading,

      /*
      | Errors
      */
      error,
      clearError,

      /*
      | Filters
      */
      filters,
      updateFilters,
      resetFilters,

      /*
      | Fetching
      */
      fetchContacts,
      fetchContact,
      fetchStatistics,
      fetchRecentContacts,

      /*
      | Status
      */
      markAsRead,
      markInProgress,
      updateStatus,

      /*
      | Priority
      */
      updatePriority,

      /*
      | Assignment
      */
      assignContact,
      unassignContact,

      /*
      | Response
      */
      respondToContact,

      /*
      | Notes
      */
      updateNotes,

      /*
      | Archive
      */
      archiveContact,
      restoreContact,

      /*
      | Delete
      */
      removeContact,

      /*
      | Selection
      */
      clearSelectedContact,
    }),
    [
      submitContact,
      submissionLoading,
      submissionError,
      submissionSuccess,
      submissionResult,
      resetSubmission,

      contacts,
      selectedContact,
      pagination,

      statistics,
      recentContacts,

      loading,
      detailsLoading,
      statisticsLoading,
      recentLoading,

      error,
      clearError,

      filters,
      updateFilters,
      resetFilters,

      fetchContacts,
      fetchContact,
      fetchStatistics,
      fetchRecentContacts,

      markAsRead,
      markInProgress,
      updateStatus,

      updatePriority,

      assignContact,
      unassignContact,

      respondToContact,

      updateNotes,

      archiveContact,
      restoreContact,

      removeContact,

      clearSelectedContact,
    ]
  );

  return (
    <ContactContext.Provider value={value}>
      {children}
    </ContactContext.Provider>
  );
};

/*
|--------------------------------------------------------------------------
| HOOK
|--------------------------------------------------------------------------
*/

export const useContact = () => {
  const context = useContext(ContactContext);

  if (!context) {
    throw new Error(
      "useContact must be used within a ContactProvider"
    );
  }

  return context;
};

export default ContactContext;