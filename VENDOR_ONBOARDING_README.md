# 📦 Vendor Onboarding - Technical Documentation

An end-to-end guide to the logic, validation, and architecture of the Vendor Onboarding module.

---

## 📑 Table of Contents
1. [Workflow Overview](#-workflow-overview)
2. [Step 1: Initialization Logic](#-step-1-initialization-logic)
3. [Main Form: Orchestration & Mapping](#-main-form-orchestration--mapping)
4. [File Management & Storage Logic](#-file-management--storage-logic)
5. [Validation Architecture](#-validation-architecture)
6. [API Data Structure (JSON)](#-api-data-structure-json)
7. [Hooks & State Management](#-hooks--state-management)

---

## 🔄 Workflow Overview

The system follows a three-stage lifecycle:
1. **Creation (Step 1)**: Basic data entry + existence check + Transaction ID generation.
2. **Orchestration (Main Form)**: Full details entry organized by sections.
3. **Consolidation**: Final validation, multi-stage file sync, and submission.

---

## 🛠 Step 1: Initialization Logic

**Files**: `vendor-form-step1.tsx`, [VendorForm.tsx](file:///d:/BOTIQ-FE-UAt/botiq_form_uat_fe/src/components/vendor/VendorForm.tsx)

### Logic:
- **Auto-Selection**: On mount, the system auto-selects the **Vendor Type** (XK01 or FK01) based on user roles from `sessionStorage`.
- **Pre-fill Logic**: Selecting "Employee(FK01)" automatically sets the **Vendor Account Group** to `V010` and handles specific GSTIN/PAN rules.
- **Auto-Extraction**: Entering a valid **GSTIN** automatically extracts the **PAN** (characters 3 to 12) and populates the PAN field.
- **Transaction Generation**: Upon clicking "Next", the [createFormData](file:///d:/BOTIQ-FE-UAt/botiq_form_uat_fe/src/services/form-data.ts#106-130) API is called with `form_status: "Draft"`. This generates a unique `transaction_id`.
- **Session Caching**: The Step 1 data, Transaction ID, and Form ID are stored in `sessionStorage` to maintain state if the user refreshes.

---

## 📋 Main Form: Orchestration & Mapping

**Files**: [vendor-form.tsx](file:///d:/BOTIQ-FE-UAt/botiq_form_uat_fe/src/pages/vendor-form.tsx), [vendor-form-mapper.ts](file:///d:/BOTIQ-FE-UAt/botiq_form_uat_fe/src/services/vendor-form-mapper.ts)

### Flat vs. Nested Architecture:
The UI uses a **Flat State** for easy binding, but the Backend requires a **Deeply Nested Structure**.
- **Mapping (Load)**: [mapAPIToFormData](file:///d:/BOTIQ-FE-UAt/botiq_form_uat_fe/src/services/vendor-form-mapper.ts#53-303) takes the backend JSON and flattens it for the UI sections.
- **Mapping (Save)**: [mapFormDataToAPI](file:///d:/BOTIQ-FE-UAt/botiq_form_uat_fe/src/services/vendor-form-mapper.ts#308-465) takes the UI state and reconstructs the nested objects (`vendor_details`, `key_details`, etc.).

### Self-Calculating Fields (System Fields):
Certain fields are calculated in the UI during the save/submit process:
- **Vendor Classification for GST**: Calculated based on GSTIN register status.
- **GR-Based Invoice Verification**: Set to "Yes"/"No" based on the `typeOfVendor`.
- **Group for Calculation Schema**: Set to `04` for specific foreign account groups, else `03`.
- **Confirmation Control Key**: Set to `0001` if Order Acknowledgment is required.

---

## 📁 File Management & Storage Logic (CRITICAL)

**Files**: [useVendorFileUpload.ts](file:///d:/BOTIQ-FE-UAt/botiq_form_uat_fe/src/hooks/useVendorFileUpload.ts), `Upload-download.ts`

The system implements a **Safe-Sync** mechanism for files:

### 1. The Temporary State
- When a user uploads a file, it is converted to **Base64** and sent to `uploadFileApi`.
- The API returns a **Temporary SAS URL**.
- The frontend tracks this field as `"uploaded"` in the `fileActionTracker`.

### 2. The Deletion Buffer
- Clicking delete **does not** immediately remove the file from storage.
- The field is marked as `"deleted"` in the `useDeletedFilesTracker`.
- The UI replaces the file object with `null`.

### 3. Final Sync (Post-Save)
- **Step A: Submit**: The form data (including temporary URLs) is saved to the database.
- **Step B: Refresh URLs**: The frontend calls [refreshFileURLs](file:///d:/BOTIQ-FE-UAt/botiq_form_uat_fe/src/hooks/useVendorFileUpload.ts#470-545) to fetch the record again. This replaces temporary URLs with **Permanent URLs**.
- **Step C: Storage Purge**: After a successful save, [deleteFilesFromStorage](file:///d:/BOTIQ-FE-UAt/botiq_form_uat_fe/src/pages/vendor-form.tsx#193-265) iterates through the deletion buffer and calls the physical delete API for each file.

---

## 🔍 Validation Architecture

**Files**: [validation.ts](file:///d:/BOTIQ-FE-UAt/botiq_form_uat_fe/src/components/vendor/validation.ts)

### 1. Regex Standards
- **PAN**: `^[A-Z]{5}[0-9]{4}[A-Z]{1}$`
- **GSTIN**: `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$`
- **MSME**: `^[A-Za-z]{2}-\d{2}-\d{7}$` (Exactly 13 characters including hyphens).
- **IFSC**: `^[A-Z]{4}0[A-Z0-9]{6}$`

### 2. Conditional Logic (CIN Number)
- **If PAN 4th char is 'C'**: CIN is mandatory (21-char format).
- **If PAN 4th char is 'F' AND Name contains "LLP"**: CIN is mandatory (5-9 char format).
- **Otherwise**: CIN is Not Applicable (NA).

### 3. Withholding Tax Rules
- Calculated dynamically based on **Vendor Group** (V001, V003, V009) and the **4th character of PAN** (C implies Company, F implies Individual, etc.).

---

## 📡 API Data Structure (JSON)

**Main Payload Structure**:
```json
{
  "search_fields": {
    "transaction_id": "TRANS_123",
    "org_name": "Rustomjee"
  },
  "update_fields": {
    "form_status": "Draft | Submitted",
    "form_data": {
      "type_of_vendor": "XK01",
      "vendor_details": { "name1": "...", "vendor_account_group": "..." },
      "key_details": { "gstin": "...", "pan_number": "...", "cin_number": "..." },
      "bank_details": { "bank_key_ifsc_code": "..." },
      "attachments": {
        "gstin_attachment": { "file_url": "...", "file_name": "...", "file_type": "..." }
      }
    },
    "updated_attachment_fields": ["gstin_attachment"]
  }
}
```

---

## 🪝 Hooks & State Management

| Hook | Responsibility |
| :--- | :--- |
| **`useVendorFormState`** | Centralized [formData](file:///d:/BOTIQ-FE-UAt/botiq_form_uat_fe/src/components/form-data/column.tsx#109-330) object, sectional validation, and change handlers. |
| **[useVendorFileUpload](file:///d:/BOTIQ-FE-UAt/botiq_form_uat_fe/src/hooks/useVendorFileUpload.ts#42-574)** | Base64 conversion and session-based upload/delete tracking. |
| **[useVendorDataLoader](file:///d:/BOTIQ-FE-UAt/botiq_form_uat_fe/src/hooks/useVendorDataLoader.ts#26-303)** | Fetches LOVs and existing draft data by Transaction ID. |
| **`useDeletedFilesTracker`**| Buffers file keys marked for deletion until the next successful save. |
| **`useVendorOrganizationSync`**| Forces a data refresh or redirect if the user switches organizations. |

---

## 📈 Status Based Logic

- **"Draft"**: Allows saving even if some fields (non-critical) are missing. No email notifications triggered.
- **"Submitted"**: Requires **Full Validation** of all sections. Triggers internal status tracking (`form_status_trans`) and email processing (`email_type: "Confirmation Mail"`).

---
