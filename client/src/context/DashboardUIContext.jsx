import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/* ==========================================
   CONTEXT
========================================== */

const DashboardUIContext = createContext(null);

/* ==========================================
   PROVIDER
========================================== */

export function DashboardUIProvider({
  children,
}) {

  /* ======================================
     SIDEBAR
  ====================================== */

  const [sidebarOpen, setSidebarOpen] =
    useState(() => window.innerWidth >= 1200);

  /* ======================================
     THEME
  ====================================== */

  const [theme, setTheme] = useState(() =>
    localStorage.getItem("dashboard-theme") ||
    "light"
  );

  /* ======================================
     SEARCH
  ====================================== */

  const [search, setSearch] =
    useState("");

  /* ======================================
     PROFILE MENU
  ====================================== */

  const [

    profileMenuOpen,

    setProfileMenuOpen,

  ] = useState(false);

  /* ======================================
     NOTIFICATIONS
  ====================================== */

  const [

    notificationsOpen,

    setNotificationsOpen,

  ] = useState(false);

  /* ======================================
     RESPONSIVE SIDEBAR
  ====================================== */

  useEffect(() => {

    const handleResize = () => {

      setSidebarOpen(

        window.innerWidth >= 1200

      );

    };

    window.addEventListener(

      "resize",

      handleResize

    );

    return () =>

      window.removeEventListener(

        "resize",

        handleResize

      );

  }, []);

  /* ======================================
     APPLY THEME
  ====================================== */

  useEffect(() => {

    document.documentElement.setAttribute(

      "data-theme",

      theme

    );

    localStorage.setItem(

      "dashboard-theme",

      theme

    );

  }, [theme]);

  /* ======================================
     SIDEBAR ACTIONS
  ====================================== */

  const toggleSidebar = () =>

    setSidebarOpen(

      (previous) => !previous

    );

  const openSidebar = () =>

    setSidebarOpen(true);

  const closeSidebar = () =>

    setSidebarOpen(false);

  /* ======================================
     THEME ACTIONS
  ====================================== */

  const toggleTheme = () =>

    setTheme(

      (previous) =>

        previous === "light"

          ? "dark"

          : "light"

    );

  /* ======================================
     SEARCH ACTIONS
  ====================================== */

  const clearSearch = () =>

    setSearch("");

  /* ======================================
     PROFILE MENU
  ====================================== */

  const toggleProfileMenu = () =>

    setProfileMenuOpen(

      (previous) => !previous

    );

  /* ======================================
     NOTIFICATIONS
  ====================================== */

  const toggleNotifications = () =>

    setNotificationsOpen(

      (previous) => !previous

    );

  /* ======================================
     CLOSE ALL MENUS
  ====================================== */

  const closeMenus = () => {

    setProfileMenuOpen(false);

    setNotificationsOpen(false);

  };

  /* ======================================
     CONTEXT VALUE
  ====================================== */

  const value = useMemo(() => ({

    /* Sidebar */

    sidebarOpen,

    toggleSidebar,

    openSidebar,

    closeSidebar,

    /* Theme */

    theme,

    toggleTheme,

    /* Search */

    search,

    setSearch,

    clearSearch,

    /* Profile Menu */

    profileMenuOpen,

    setProfileMenuOpen,

    toggleProfileMenu,

    /* Notifications */

    notificationsOpen,

    setNotificationsOpen,

    toggleNotifications,

    /* Helpers */

    closeMenus,

  }), [

    sidebarOpen,

    theme,

    search,

    profileMenuOpen,

    notificationsOpen,

  ]);

  return (

    <DashboardUIContext.Provider
      value={value}
    >

      {children}

    </DashboardUIContext.Provider>

  );

}

/* ==========================================
   HOOK
========================================== */

export function useDashboardUI() {

  const context =

    useContext(

      DashboardUIContext

    );

  if (!context) {

    throw new Error(

      "useDashboardUI must be used inside DashboardUIProvider."

    );

  }

  return context;

}

export default DashboardUIContext;