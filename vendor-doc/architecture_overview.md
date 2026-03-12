# Vendor Onboarding Refactoring Documentation

## Overview
The vendor onboarding form has been refactored from a messy, prop-drilling-heavy implementation to a modern, centralized, and type-safe architecture using **React Hook Form**, **Zod**, and **React Context**.

## Key Improvements

### 1. Centralized Configuration (`config.ts`)
- **Single Source of Truth**: All default values, session keys, regex patterns, and business constants are now in one file.
- **Unified Step 1 & 2**: Both the initial modal and the main form consume the same configuration, ensuring consistency in field mapping and session storage.

### 2. Schema-Driven Validation (`schema.ts`)
- **Complex Logic in Zod**: Conditional validations (like CIN being mandatory only for companies) are now part of the schema using `superRefine`.
- **Integrated Dependencies**: Field interaction rules (like PAN extraction from GSTIN) are mapped directly into the schema for unified error handling.

### 3. Smart Data Loading (`useVendorDataLoader` & `LOVContext`)
- **Efficient Fetching**: All LOVs (List of Values) are fetched once at the container level.
- **Context API**: Droplet options are provided via `LOVContext`, eliminating prop drilling and ensuring all sections have access to real-time SAP data.
- **Dynamic Filtering**: Logic for filtering states based on country is now encapsulated in pure utility functions (`lov-utils.ts`).

### 4. Automated Field Logic (`useFormDependencies`)
- **Business Brain**: All "auto-magic" field updates are centralized in a dedicated hook.
- **Mappings**:
    - **GSTIN -> PAN**: Automatically extracts the PAN part of the GSTIN.
    - **Account Group -> Planning Group**: Automatically sets the planning group based on SAP account mappings.
    - **WT Indicator -> Receipt Type**: Automatically derived based on tax configuration.

### 5. Premium UI Components
- **Dynamic Selects**: Hand-coded dropdowns replaced with accessible, theme-aware `Select` components.
- **Section Isolation**: Each form section is a clean, focused component that consumes form state via `useFormContext`.

## Recommendations for Future Work

### 1. File Upload Lifecycle
- **Refinement**: implement a unified `useVendorFileUpload` hook that handles temporary uploads, draft preservation, and final commitment on submit.
- **Validation**: Add server-side size/type validation to the Zod schema for attachments.

### 2. Error Focus Protocol
- **UX Improvement**: Implement a helper that automatically scrolls to and focuses the first field with a validation error across tabs.

### 3. Draft Auto-Save
- **Reliability**: Add a debounce effect to save the form state to the backend/local storage every 30 seconds to prevent data loss.

### 4. SAP Integration Testing
- **Validation**: Create a mock API suite that mimics SAP's various error responses (e.g., "PAN already exists") to ensure the UI handles external business errors gracefully.

---
*Refactored with ❤️ by Antigravity*
