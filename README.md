# ☁️ BOG Cloud

**One Account. Every Device. Total Control.**

BOG Cloud is a complete cloud platform that combines a Password Manager, Cloud Storage, and Enterprise DevCloud into one unified system.

---

## 📖 Table of Contents

1. [What is BOG Cloud?](#what-is-bog-cloud)
2. [Who Is It For?](#who-is-it-for)
3. [What Can You Do?](#what-can-you-do)
4. [Security & Privacy](#security--privacy)
5. [Installation & Setup](#installation--setup)
6. [API Endpoints](#api-endpoints)
7. [Project Structure](#project-structure)
8. [CLI Commands](#cli-commands)
9. [License](#license)

---

## What is BOG Cloud?

BOG Cloud combines three powerful tools into one account:

| **Tool** | **What It Does** |
|---|---|
| 🔐 **Password Manager** | Store all your passwords securely in one place |
| ☁️ **Cloud Storage** | Upload and access your files from anywhere |
| 🚀 **Enterprise DevCloud** | Manage API keys and deploy apps with one click |

**The vision:** "One account. Every device. Total control over your data, credentials, and cloud infrastructure."

---

## Who Is It For?

| **Persona** | **Description** |
|---|---|
| **Individual Users** | Anyone who wants to store passwords and files securely |
| **Startup Developers** | Solo developers building apps who need simple cloud tools |
| **Enterprise Teams** | Companies needing secure access to secrets and deployments |

---

## What Can You Do?

### 🔐 Password Manager
- ✅ Save unlimited passwords (encrypted)
- ✅ Auto-fill passwords in your browser
- ✅ Organize passwords into folders (nested)
- ✅ Star important passwords (Favorites)
- ✅ Search for any password instantly
- ✅ Generate strong passwords
- ✅ Check password strength
- ✅ Import/export passwords
- ✅ View password history
- ✅ Bulk delete/move passwords

### ☁️ Cloud Storage
- ✅ Upload any file type
- ✅ Download files to any device
- ✅ Preview images, PDFs, and documents
- ✅ Organize files into folders
- ✅ Share files with anyone (link + password)
- ✅ Search files by name
- ✅ Track storage usage
- ✅ Bulk delete/move files
- ✅ File versions and restore

### 🚀 Enterprise DevCloud
- ✅ Store API keys securely
- ✅ Manage environment variables (Dev/Staging/Production)
- ✅ Rotate API keys with one click
- ✅ Deploy apps with one click
- ✅ Auto-scaling based on load
- ✅ Custom domains with SSL
- ✅ CI/CD webhooks
- ✅ Deployment logs and rollback

### 👑 Admin Dashboard
- ✅ View all users
- ✅ Assign/remove admin privileges
- ✅ Suspend or delete users
- ✅ View platform analytics
- ✅ Export reports (JSON/CSV)
- ✅ Audit logs for all actions

### 📱 Cross-Device Sync
- ✅ Real-time sync across all devices
- ✅ Offline support
- ✅ Device management
- ✅ Push notifications

---

## Security & Privacy

### 🔒 Encryption

| **Data Type** | **Encryption** | **Who Can See It** |
|---|---|---|
| User Passwords | AES-256-GCM (encrypted) | **Only the user** |
| Files | AES-256-GCM (encrypted) | **Only the user** |
| Master Password | bcrypt (hashed) | **No one** |

### 🔐 Security Features
- **Zero-Knowledge Architecture** - Server never sees your plaintext passwords
- **Multi-Factor Authentication (MFA)** - Optional TOTP (Google Authenticator)
- **JWT Tokens** - Secure session management
- **Rate Limiting** - Prevents brute-force attacks
- **Audit Logging** - All actions are logged
- **Role-Based Access Control (RBAC)** - User vs Admin permissions

---

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Step 1: Clone the Repository
```bash
git clone  https://github.com/isaacsolomon332-cell/BOG-CLOUD.git
cd bog-cloud