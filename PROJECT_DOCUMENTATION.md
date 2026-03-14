# Project Documentation: Vendor Onboarding System

This document provides a comprehensive overview of the Vendor Onboarding project, its architecture, structure, and development guidelines. It is designed to help new developers understand the system quickly and efficiently.

---

## 1. Project Overview

### **What this project does**
The Vendor Onboarding System is a web-based application designed to streamline the process of collecting, validating, and submitting vendor information for ERP integration (such as SAP). It handles a complex multi-step form workflow involving general details, tax information (GST/PAN), bank details, and file attachments.

### **Main Purpose**
- **Digitization**: Replace manual/paper-based vendor onboarding with a structured digital flow.
- **Validation**: Ensure all vendor data (GSTIN, PAN, IFSC, etc.) is valid before it reaches the backend.
- **Integration**: Prepare and map vendor data into a format required by downstream ERP systems.
- **State Persistence**: Allow users to save drafts and return to them later using a unique Transaction ID.

### **Key Technologies**
- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **UI & Styling**: [Tailwind CSS 4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/) (via shadcn/ui patterns), [Lucide React](https://lucide.dev/) (icons)
- **Form Management**: [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/) (validation)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **API Client**: [Axios](https://axios-http.com/)
- **Utility Libraries**: [TanStack Table](https://tanstack.com/table) (data display), [Date-fns](https://date-fns.org/), [ExcelJS](https://github.com/exceljs/exceljs)

---

## 2. System Architecture

### **High-Level Architecture**
The system follows a modern **Client-Server** architecture:

1.  **Frontend (SPA)**: A React-based Single Page Application that handles UI rendering, client-side validation, and state management.
2.  **API Layer**: A RESTful API (hosted on Azure) that handles database persistence, authentication, and file storage.
3.  **Database**: Stores vendor records, form statuses, and metadata.
4.  **Storage**: Handles physical file attachments (using SAS URLs for temporary access and permanent links after submission).

### **Data Flow**
- **Initialization**: User starts Step 1 → Frontend generates/retrieves a `transaction_id` → Data is saved as a "Draft".
- **Interaction**: User fills sections → Real-time validation (Zod) → Field dependencies (e.g., GSTIN extracts PAN) → Periodic "Save" calls.
- **Mapping**: Since the UI uses a **Flat State** for easy binding but the Backend requires a **Nested structure**, a mapping layer (`mapper.ts`) converts data in both directions.
- **Submission**: Final validation → JSON mapping → PUT request to `/update_form_data_api` → Success triggers file synchronization.

---

## 3. Folder Structure Explanation

```text
d:/seprate-form/
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── common/            # Shared components (Buttons, Inputs, Tables)
│   │   └── vendorOnboarding/  # NEW: Modular vendor form implementation
│   │       ├── form/          # Form logic, schemas, and orchestrator
│   │       │   ├── sections/  # Individual form segments (General, Bank, etc.)
│   │       │   ├── schema.ts  # Zod validation rules
│   │       │   ├── mapper.ts  # Logic to convert UI <-> API JSON
│   │       │   └── VendorFormContainer.tsx # Main Form State Manager
│   ├── hooks/                 # Custom React hooks (Data fetching, File uploads)
│   ├── pages/                 # Main route entries
│   │   ├── vendor/            # OLD: Legacy vendor form (30KB monolithic file)
│   │   └── vendorOnboarding/  # NEW: Modernized vendor onboarding routes
│   ├── services/              # API communication layer
│   │   └── vendor-onboarding/ # Services for the new onboarding flow
│   ├── types/                 # TypeScript interfaces and types
│   ├── lib/                   # Utility functions (shadcn/ui setup)
│   └── App.tsx                # Routing and global providers
├── public/                    # Static assets
└── package.json               # Dependencies and scripts
```

---

## 4. Old System vs New System

### **The Old System (`src/pages/vendor`)**
- **Structure**: Monolithic. The entire form was often in one or two massive files (`vendor-form.tsx`).
- **State**: Large, flat objects with manual change handlers (`handleInputChange`).
- **Validation**: Manual regex checks or custom logic scattered throughout the component.
- **Maintenance**: Extremely difficult to debug or extend due to the high number of lines and complex dependencies in one place.

### **The New System (`src/pages/vendorOnboarding`)**
- **Structure**: Modular. Each form section is its own component (`AddressDetails.tsx`, `BankDetails.tsx`).
- **State**: Uses `react-hook-form` for efficient re-rendering and centralized state control.
- **Validation**: Centralized `schema.ts` using Zod. Validation is decoupled from the UI components.
- **Mapping**: Dedicated `mapper.ts` handles the complex transformation from UI fields to the nested JSON structure required by the API.
- **Improvements**:
    - **Strong Typing**: Full TypeScript support for form data.
    - **Reusability**: Sections can be easily rearranged or reused in a "View Mode".
    - **Performance**: Reduced re-renders by splitting the form into smaller components.

---

## 5. Core Modules / Features

### **Vendor Onboarding Module**
The primary module consists of several sub-sections:
1.  **Type of Vendor**: Determines the vendor group (e.g., XK01 vs FK01) and triggers specific rules like GST requirement.
2.  **General Details**: Name, Search Term, and account groups.
3.  **Key Details**: Critical IDs like PAN, GSTIN, MSME, and CIN.
4.  **Address Details**: Country, Region, and contact info with country-specific dependencies.
5.  **Bank Details**: IFSC-based bank identification and account details.
6.  **Internal Details**: Purchasing organization, currency, and payment terms.
7.  **Attachments**: Handling of mandatory and optional document uploads.

### **File Sync Mechanism**
- **Temporary Upload**: Files are uploaded to a temporary SAS URL.
- **Safe Delete**: Deletions are buffered in the UI and only physically deleted from storage after a successful "Save" of the metadata.

---

## 6. Important Workflows

### **API Calling Flow**
1.  Components call functions in `src/services/vendor-onboarding/form-data.ts`.
2.  `callFormApi` helper checks for a JWT token in `sessionStorage`.
3.  If missing/expired, it calls `getFormAuthToken` to re-authenticate.
4.  The request is sent with the appropriate headers (`authorize_token`).

### **Form Life Cycle**
1.  **Mount**: `VendorFormContainer` loads existing draft data using `transaction_id`.
2.  **Load**: `mapAPIToFormData` flattens the nested backend JSON for `react-hook-form`.
3.  **Edit**: User modifies fields; `FieldReactors` handle logic (e.g., IFSC auto-filling bank info).
4.  **Save/Submit**: `mapFormDataToAPI` nests the data → Zod validates → `updateFormData` (PUT) sends it to the server.

---

## 7. Setup Instructions

### **Prerequisites**
- Node.js (v18.0.0 or higher)
- npm or yarn

### **Installation**
1.  **Clone the project**: `git clone <repo-url>`
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Set Environment Variables**: Create a `.env` file in the root based on `.env.example`.
    - `VITE_API_BASE_URL`: The URL of the backend API.

### **Run Commands**
- **Development**: `npm run dev` (Runs on `http://localhost:5173`)
- **Build**: `npm run build` (Generates production bundle in `/dist`)
- **Lint**: `npm run lint`

---

## 8. Development Guidelines

### **Coding Patterns**
- **Functional Components**: Use arrow functions for components.
- **Hooks**: Keep logic out of the JSX; use custom hooks (e.g., `useVendorFormState`).
- **Immutability**: Always use stable state updates; avoid direct mutations.

### **Folder Conventions**
- New form sections should go in `src/components/vendorOnboarding/form/sections/`.
- Logic shared across forms should go in `src/hooks/`.
- All API types should be defined in `src/types/`.

### **API Handling**
- Never call `axios.post` directly from a component. Always use the service layer.
- Use the `APIResponse<T>` pattern to handle errors consistently.

---

## 9. Key Files to Understand First

If you are new to the project, read these files in order:

1.  **`src/pages/vendorOnboarding/VendorFormPage.tsx`**: The entry point for the onboarding form.
2.  **`src/components/vendorOnboarding/form/VendorFormContainer.tsx`**: The "brain" that orchestrates the form steps and state.
3.  **`src/components/vendorOnboarding/form/schema.ts`**: To understand the data structure and validation rules.
4.  **`src/components/vendorOnboarding/form/mapper.ts`**: To understand how UI data relates to backend JSON.
5.  **`src/services/vendor-onboarding/form-data.ts`**: To understand how the frontend communicates with the server.

---

*Generated by Antigravity AI on 2026-03-14*
