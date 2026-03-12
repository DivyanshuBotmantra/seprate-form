# 💎 The Perfect Extraction Guide: Vendor Onboarding System

This is the definitive blueprint for porting the Vendor Onboarding module. It now includes the **Main Form Orchestration** logic to ensure a seamless end-to-end migration.

---

## 🏗️ 1. Technical Stack Requirements
- **Core**: React 18, TypeScript, Tailwind CSS.
- **UI Architecture**: Shadcn/UI (Radix), Lucide Icons.
- **Form Management**: Tanstack Table (Data Display), React Hooks (Logic).
- **Communication**: Axios or Fetch (with base URL from `.env`).

---

## 📂 2. Main Form Artifacts (Copy These)

| Category | Source File Path | Role |
| :--- | :--- | :--- |
| **Mapping** | [src/services/vendor-form-mapper.ts](file:///d:/BOTIQ-FE-UAt/botiq_form_uat_fe/src/services/vendor-form-mapper.ts) | **The Brain.** Converts flat UI data to nested API JSON. |
| **Logic** | [src/components/vendor/validation.ts](file:///d:/BOTIQ-FE-UAt/botiq_form_uat_fe/src/components/vendor/validation.ts) | **The Judge.** Contains all Regex and conditional rules. |
| **Page** | [src/pages/vendor-form.tsx](file:///d:/BOTIQ-FE-UAt/botiq_form_uat_fe/src/pages/vendor-form.tsx) | **The Heart.** Orchestrates all sections and API calls. |
| **State** | [src/hooks/useVendorFormState.ts](file:///d:/BOTIQ-FE-UAt/botiq_form_uat_fe/src/hooks/useVendorFormState.ts) | **The Controller.** Manages input changes, dependencies, and validation. |
| **Uploads** | [src/hooks/useVendorFileUpload.ts](file:///d:/BOTIQ-FE-UAt/botiq_form_uat_fe/src/hooks/useVendorFileUpload.ts) | **The Sync.** Handles Base64 -> SAS URL -> Perm URL. |
| **Tracker** | [src/hooks/useDeletedFilesTracker.ts](file:///d:/BOTIQ-FE-UAt/botiq_form_uat_fe/src/hooks/useDeletedFilesTracker.ts)| **The Buffer.** Prevents premature file deletion from storage. |

---

## 📋 3. Main Form Orchestration Logic

The **Main Form** ([vendor-form.tsx](file:///d:/BOTIQ-FE-UAt/botiq_form_uat_fe/src/pages/vendor-form.tsx)) isn't just a UI; it's a state machine.

### **A. Component sections**
The form is divided into 7 functional tabs. Each must receive [formData](file:///d:/BOTIQ-FE-UAt/botiq_form_uat_fe/src/components/form-data/column.tsx#109-330), [handleInputChange](file:///d:/BOTIQ-FE-UAt/botiq_form_uat_fe/src/components/vendor/VendorForm.tsx#310-478), and `errors`:
1.  **Type of Vendor Section** (Handles XK01 vs FK01 logic).
2.  **Vendor Details Section** (Basic info like Name, Employee ID).
3.  **Key Details Section** (Complex IDs: PAN, GSTIN, MSME, CIN).
4.  **Address Details Section** (Region, Country, Contact details).
5.  **Bank Details Section** (IFSC, Account Number).
6.  **Internal Details Section** (Purchasing Org, Currency).
7.  **System Fields Section** (Read-only auto-calculated fields).

### **B. Field Dependencies (Live Logic)**
Your [useVendorFormState](file:///d:/BOTIQ-FE-UAt/botiq_form_uat_fe/src/hooks/useVendorFormState.ts#27-579) hook must implement these real-time "Reactors":
- **IFSC Reactor**: Entering the first 4 chars of an IFSC should auto-populate the Bank Country Key.
- **PAN Reactor**: Updating PAN must trigger the "PAN-Aadhar Linked Status" calculation and reset Withholding Tax types.
- **Company Code Reactor**: For XK01, changing Company Code must auto-set the **Purchasing Organization**.
- **Region Filter**: `region` selection must reset if `countryKey` changes.

### **C. Error Auto-Focus Protocol**
When "Submit" is clicked, if any section is invalid, implement [focusOnFirstError](file:///d:/BOTIQ-FE-UAt/botiq_form_uat_fe/src/pages/vendor-form.tsx#47-89):
- Use `document.querySelector` to find the field key in the DOM.
- Use `scrollIntoView({ behavior: 'smooth' })`.
- Call `.focus()` and `.select()` to guide the user.

---

## 📂 4. The "Post-Save Purge" Flow

To keep storage clean, the system uses a **Deletion Buffer**.

1.  **UI Delete**: User clicks delete. The file information is added to `useDeletedFilesTracker`.
2.  **Metadata Save**: User clicks "Save". The JSON is updated on the server (the file path is removed from the record).
3.  **Physical Purge**: **ONLY AFTER** a `200 OK` from the save API, iterate through the `DeletedFiles` list.
4.  **API Call**: Call `deleteFileApi` for each buffered file.
5.  **Clear Buffer**: Call `clearDeletedFiles()`.

*Reasoning: If the Save fails, we keep the file in storage so the user doesn't lose data.*

---

## 🔍 5. The Validation Bible (Regex & Rules)

| Field | Regex Pattern | Condition/Rule |
| :--- | :--- | :--- |
| **PAN** | `^[A-Z]{5}[0-9]{4}[A-Z]{1}$` | Domestic: Mandatory. Foreign: Can be "NOT APPLICABLE". |
| **GSTIN** | `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$` | extracting PAN (3-12). |
| **MSME** | `^[A-Za-z]{2}-\d{2}-\d{7}$` | 13 chars. If "NON-MSMED", must be "NA". |
| **IFSC** | `^[A-Z]{4}0[A-Z0-9]{6}$` | 11 Chars. 5th char = '0'. |
| **CIN (V1)** | `^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$` | PAN 4th char = 'C'. |
| **CIN (V2)** | `^[A-Z]{3}-[0-9]{1,5}$` | PAN 4th char = 'F' + "LLP" in Name. |

---

## 📡 6. Data Mapping Architecture

The [mapFormDataToAPI](file:///d:/BOTIQ-FE-UAt/botiq_form_uat_fe/src/services/vendor-form-mapper.ts#308-465) function must reconstruct the deep hierarchy:
- `vendor_details`: { name1, account_group, employee_number }
- `key_details`: { gstin, pan_number, cin_number, msme_status }
- `bank_details`: { bank_key_ifsc_code, bank_account_number }
- `attachments`: { gstin_attachment: { file_url, file_name } }

---

## 🚦 7. Status Logic
- **Draft save**: Saves even if fields are missing.
- **Submit**: Runs full sectional validation. Triggers `email_type: "Confirmation Mail"`.
