# JVP Connect
## User Roles & Permissions

**Version:** 1.0

---

# Overview

JVP Connect uses Role-Based Access Control (RBAC).

Every authenticated user is assigned a role.

Permissions are granted based on the assigned role.

---

# User Roles

Version 1.0 includes the following roles:

1. Ordinary Member
2. President
3. Secretary General
4. Treasurer

Future versions may introduce additional leadership roles without changing the core system architecture.

---

# Ordinary Member

An Ordinary Member can:

- Register an account
- Login
- Update their profile
- Renew membership
- Download their membership card
- Register for events
- View programs
- View news
- View gallery
- Receive notifications
- Contact JVP

Ordinary Members cannot access administration functions.

---

# President

The President serves as the Super Administrator of JVP Connect.

The President has unrestricted access to all modules.

The President can:

- Manage members
- Promote members to leadership
- Remove leadership status
- Manage all website content
- Publish news
- Manage programs
- Manage events
- Manage the Summit
- View reports
- Manage payments
- Configure system settings
- Manage users and permissions
- View audit logs
- Access analytics dashboards
- Perform system administration

---

# Secretary General

The Secretary General manages administrative operations.

Permissions include:

- View members
- Edit member information
- Promote members to leadership
- Manage news
- Manage events
- Manage gallery
- Manage notifications
- View reports
- View payments
- Manage CMS content

The Secretary General cannot:

- Change system settings
- Delete system administrators
- Manage user roles
- Access system configuration

---

# Treasurer

The Treasurer manages financial operations.

Permissions include:

- View members
- View payment history
- Verify payments
- Generate receipts
- Export financial reports
- View financial analytics

The Treasurer cannot:

- Modify website content
- Manage users
- Change system settings
- Publish news
# Permission Matrix

| Feature | Member | President | Secretary General | Treasurer |
|----------|--------|-----------|-------------------|------------|
| Login | ✅ | ✅ | ✅ | ✅ |
| Member Dashboard | ✅ | ✅ | ✅ | ✅ |
| Edit Own Profile | ✅ | ✅ | ✅ | ✅ |
| View Members | ❌ | ✅ | ✅ | ✅ |
| Edit Members | ❌ | ✅ | ✅ | ❌ |
| Delete Members | ❌ | ✅ | ❌ | ❌ |
| Promote Leadership | ❌ | ✅ | ✅ | ❌ |
| Manage News | ❌ | ✅ | ✅ | ❌ |
| Manage Events | ❌ | ✅ | ✅ | ❌ |
| Manage Gallery | ❌ | ✅ | ✅ | ❌ |
| Manage Payments | ❌ | ✅ | ❌ | ✅ |
| Financial Reports | ❌ | ✅ | View | ✅ |
| CMS | ❌ | ✅ | ✅ | ❌ |
| System Settings | ❌ | ✅ | ❌ | ❌ |
| User Management | ❌ | ✅ | ❌ | ❌ |
| Audit Logs | ❌ | ✅ | View | View |