# 🛍️ New Desgin — Official E-Commerce Storefront & Admin Portal

[![License: Source-Available](https://img.shields.io/badge/License-Source--Available-blue.svg)](LICENSE)
[![Developer: ZerroDevs](https://img.shields.io/badge/Developer-@ZerroDevs-0284c7.svg?style=flat&logo=github)](https://github.com/ZerroDevs)
[![Build Status](https://img.shields.io/badge/Status-Production%20Ready-success.svg)]()
[![Stack](https://img.shields.io/badge/Tech-HTML5%20%7C%20CSS3%20%7C%20JavaScript%20%7C%20Firebase-orange.svg)]()

> **Custom E-Commerce Web Application & Control Engine**  
> Specially designed and engineered for the official **New Desgin** store by **[@ZerroDevs](https://github.com/ZerroDevs)**.

---

## 👨‍💻 Author & Lead Developer

Developed with precision and modern solid aesthetics by **ZerroDevs**:
- **GitHub Profile**: [@ZerroDevs](https://github.com/ZerroDevs)
- **Repository**: [Zerros/New-Desginv2](https://github.com/ZerroDevs/New-Desginv2)

---

## 🔓 Open Learning & Reuse Guidelines

> [!TIP]
> **FEEL FREE TO FORK & REUSE COMPONENTS!**  
> You are welcome to **fork** this repository, study the source code, and reuse any of the JavaScript modules, CSS styling, or UI components for **learning, education, or personal projects**.  
> 
> *Note*: The only restriction is that you may not impersonate the official **New Desgin** store or deploy a commercial business using the official store brand/logo. See the [`LICENSE`](LICENSE) for full details.

---

## ✨ Features & System Architecture

### 🛒 Storefront Engine
- **Solid Minimalist Design System**: Dark/Light mode theme engine with instant local storage persistence.
- **Bilingual i18n Support**: Seamless toggle between **English (LTR)** and **Arabic (RTL)** with complete text direction adjustments (`dir="rtl"`).
- **Dynamic Multi-Currency Converter**: Real-time USD base currency with live Firebase exchange rate syncing to Libyan Dinar (`LYD`).
- **Interactive Product Catalog**: Instant category filtering, real-time stock status, search, and responsive product modals.
- **Cart & Order Management**: Sliding drawer cart, live checkout modal, receipt upload support, and persistent customer information.
- **Support Ticket System**: Customer submission drawer with tracking and live administrator communication.
- **Instant Order Tracking**: Tracking portal allowing users to monitor their order statuses in real time.

### 🛡️ Multi-Tier Admin Control Panel (`admin.html`)
- **Hierarchical Role System**:
  - 👑 **Owner**: Un-editable rank with full control over store settings, catalog, order processing, and team role assignments (can assign Founder, Administrator, Support).
  - ⭐ **Founder**: Advanced management capabilities and team management.
  - 🛡️ **Administrator**: Catalog CRUD, currency configuration, order management, announcement management, and team assignments (can assign Administrator or Support roles).
  - 🎧 **Support**: Dedicated role restricted strictly to **Order Management (View-Only)** and **Support Tickets (View & Reply)**. Sidebar tabs for catalog, settings, and team access are automatically hidden.
- **Security & Access Gates**: Real-time Firebase Database validation checking `settings/ownerEmail` and `settings/adminEmails`.
- **Firebase Security Rules (`database.rules.json`)**: Deep index optimizations (`.indexOn`) ensuring high-throughput queries for orders, products, and support tickets.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla JavaScript (ES6+), Vanilla CSS (Custom Design Tokens, Variables, animations, RTL support)
- **Backend & Database**: Firebase Realtime Database & Firebase Authentication (v10 Compat SDK)
- **Typography & Icons**: Google Fonts (Inter & Cairo) with custom vector SVG icons (zero emoji reliance)

---

## 📄 License

Distributed under a Custom Source-Available & Non-Commercial License.  
Created and maintained with ❤️ by **[@ZerroDevs](https://github.com/ZerroDevs)**.
