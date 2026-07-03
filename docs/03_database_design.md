# JVP Connect
## Database Design

**Version:** 1.0

---

# Database Overview

JVP Connect uses MongoDB as its primary database.

The database is designed using a modular approach where each major feature of the platform is represented by its own collection.

The database structure prioritizes scalability, data integrity, maintainability, and security.

---

# Database Collections

Version 1.0 of JVP Connect consists of the following primary collections:

- Users
- Members
- Payments
- Membership Cards
- Events
- Event Registrations
- News
- Gallery
- Notifications
- Audit Logs
- Settings

Additional collections may be introduced in future versions as new modules are added.

---

# Collection Relationships

User
│
├── Member Profile
│
├── Membership Card
│
├── Payments
│
├── Event Registrations
│
└── Notifications

---

# Users Collection

Stores authentication and authorization information.

Fields include:

- User ID
- Email Address
- Password (Encrypted)
- Role
- Account Status
- Last Login
- Created At
- Updated At

---

# Members Collection

Stores personal information for registered members.

Fields include:

- Membership Number
- Full Name
- National ID Number
- Phone Number
- Email Address
- Gender
- Date of Birth
- County
- Sub County
- Ward
- Occupation
- Membership Category
- Membership Status
- Registration Date
- Membership Expiry Date
- Passport Photo

---

# Payments Collection

Stores all financial transactions.

Fields include:

- Payment ID
- Member ID
- Payment Type
- Amount
- Mpesa Receipt Number
- Transaction Date
- Payment Status

---

# Membership Cards Collection

Stores digital membership cards.

Fields include:

- Card Number
- Member ID
- QR Code
- Issue Date
- Expiry Date
- Card Status

---

# Events Collection

Stores all JVP events.

Fields include:

- Event Name
- Description
- Venue
- County
- Date
- Registration Deadline
- Event Banner

---

# Event Registrations Collection

Stores event attendance.

Fields include:

- Member ID
- Event ID
- Registration Date
- Attendance Status

---

# News Collection

Stores news articles and announcements.

Fields include:

- Title
- Category
- Featured Image
- Article Content
- Author
- Publish Date
- Status

---

# Gallery Collection

Stores media files.

Fields include:

- Album Name
- Photo
- Video
- Description
- Upload Date

---

# Notifications Collection

Stores notifications sent to members.

Fields include:

- Member ID
- Title
- Message
- Read Status
- Date Sent

---

# Audit Logs Collection

Stores system activity.

Examples include:

- Login
- Profile Update
- Payment
- Leadership Promotion
- Membership Renewal
- News Publication

---

# Settings Collection

Stores configurable platform settings.

Examples:

- Membership Fees
- County Codes
- System Email
- Contact Details
- Payment Configuration
- Website Settings

---

# Business Rules

The following business rules apply:

- Every user begins as an Ordinary Member.
- Leadership status is assigned only by authorized administrators.
- Membership numbers are generated automatically.
- Membership becomes active after successful payment.
- Members must belong to one of the six Coastal counties.
- Every payment generates a receipt.
- Every member receives a digital membership card.
- Membership renewal updates the expiry date.