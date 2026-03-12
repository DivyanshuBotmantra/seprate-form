/**
 * Custom hook for loading vendor form data from various sources
 * Handles LOV data, Step 1 data, edit mode data, and view mode data
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { getFormLov } from "@/services/form-lov";
import { getVendorDataByTransId } from "@/services/form-data";
import { mapAPILOVToDropdown } from "@/components/vendor/lov-utils";
import type { LOVData } from "@/components/vendor";
import { mapAPIToFormData, loadStep1Data } from "@/services/vendor-form-mapper";
import type { VendorFormData } from "@/components/vendor";
import { SESSION_KEYS } from "@/config/vendor-form-config";

interface UseVendorDataLoaderProps {
  orgName: string;
  hasStep1Data: boolean;
  editMode: boolean;
  viewMode: boolean;
  transId: string;
  formName?: string;
}

export const useVendorDataLoader = ({
  orgName,
  hasStep1Data,
  editMode,
  viewMode,
  transId,
  formName,
}: UseVendorDataLoaderProps) => {
  const navigate = useNavigate();
  const [lovData, setLovData] = useState<LOVData | null>(null);
  const [initialFormData, setInitialFormData] =
    useState<Partial<VendorFormData> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  console.log("Test Form", formName);

  // Fetch LOV data
  useEffect(() => {
    const fetchLOVData = async () => {
      try {
        const { data, error } = await getFormLov({
          form_name: "Vendor Onboarding",
          org_name: "Rustomjee",
        });

        if (error) {
          console.error("Error fetching LOV data:", error);
          toast.error("Failed to load form options");
        } else if (data) {
          console.log("🔍 Raw API response:", data);
          const mappedLOV = mapAPILOVToDropdown(data);
          setLovData(mappedLOV);
          // console.log("✅ LOV data loaded and mapped:", mappedLOV);
        }
      } catch (error) {
        console.error("Error fetching LOV data:", error);
        toast.error("Failed to load form options");
      }
    };

    fetchLOVData();
  }, [orgName]);

  // Load Step 1 data or edit data
  useEffect(() => {
    console.log("🔄 Data loading useEffect triggered:", {
      hasStep1Data,
      editMode,
      viewMode,
      transId,
      orgName,
      formName,
    });

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Priority 1: If we have a transaction ID, always try to load saved data first
        if (transId) {
          console.log("🔍 Loading saved data from API with transId:", transId);

          const { data, error } = await getVendorDataByTransId(
            transId,
            orgName || "Rustomjee",
            formName || "Vendor Onboarding"
          );

          if (error) {
            console.error("❌ Failed to load saved data:", error);
            toast.error(`Failed to load vendor data: ${error}`);

            // Fallback to Step 1 data if API fails
            if (hasStep1Data) {
              const step1Data = loadStep1Data();
              if (step1Data) {
                setInitialFormData(step1Data);
                console.log("✅ Fallback: Step 1 data loaded:", step1Data);
              } else {
                console.error("❌ Missing Step 1 data and API failed");
                toast.error("Missing form data. Please start over.");
                navigate("/vendor-onboarding");
              }
            }
            return;
          }

          if (data?.response_body?.[0]?.form_data) {
            const apiFormData = data.response_body[0].form_data;
            const mappedData = mapAPIToFormData(apiFormData);

            // Extract and store form_id and transaction_id from API response
            const formId = 
              (typeof apiFormData === 'object' && apiFormData !== null && 'form_id' in apiFormData 
                ? String(apiFormData.form_id) 
                : null) || 
              data.response_body[0].trans_id || 
              transId;
            const transactionId = data.response_body[0].trans_id || transId;
            
            // Store form_id and transaction_id in sessionStorage for later use
            if (formId && formId.trim()) {
              sessionStorage.setItem(SESSION_KEYS.FORM_ID, formId);
              console.log("✅ Stored form_id in sessionStorage:", formId);
            }
            if (transactionId && transactionId.trim()) {
              sessionStorage.setItem(SESSION_KEYS.TRANSACTION_ID, transactionId);
              console.log("✅ Stored transaction_id in sessionStorage:", transactionId);
            }

            // Priority 2: If we have Step 1 data, merge it with saved data (Step 1 takes precedence for those specific fields)
            if (hasStep1Data) {
              const step1Data = loadStep1Data();
              if (step1Data) {
                // console.log("🔄 Merging Step 1 data with saved data");
                // console.log("📋 Step 1 data:", step1Data);
                // console.log("💾 Saved data:", mappedData);
                
                // Merge Step 1 data with saved data, giving priority to saved data for all fields
                // but ensuring Step 1 fields are not lost if they're not in saved data
                const mergedData = {
                  ...mappedData, // Saved data takes priority
                  // Only override with Step 1 data if the saved data doesn't have these fields
                  ...(step1Data.typeOfVendor &&
                    !mappedData.typeOfVendor && {
                      typeOfVendor: step1Data.typeOfVendor,
                    }),
                  ...(step1Data.vendorAccountGroup &&
                    !mappedData.vendorAccountGroup && {
                      vendorAccountGroup: step1Data.vendorAccountGroup,
                    }),
                  ...(step1Data.name1 &&
                    !mappedData.name1 && { name1: step1Data.name1 }),
                  ...(step1Data.taxNumber3GSTIN &&
                    !mappedData.taxNumber3GSTIN && {
                      taxNumber3GSTIN: step1Data.taxNumber3GSTIN,
                    }),
                  ...(step1Data.panNumber &&
                    !mappedData.panNumber && {
                      panNumber: step1Data.panNumber,
                    }),
                  ...(step1Data.employeeNumber &&
                    !mappedData.employeeNumber && {
                      employeeNumber: step1Data.employeeNumber,
                    }),
                  // For gstinRequirement, use Step 1 data if saved data is empty or undefined
                  ...(step1Data.gstinRequirement &&
                    (!mappedData.gstinRequirement ||
                      mappedData.gstinRequirement === "") && {
                      gstinRequirement: step1Data.gstinRequirement,
                    }),
                };

                setInitialFormData(mergedData);
                console.log(
                  "✅ Merged data loaded (saved data + Step 1 fallback):",
                  mergedData
                );
              } else {
                setInitialFormData(mappedData);
                console.log(
                  "✅ Saved data loaded (no Step 1 data to merge):",
                  mappedData
                );
              }
            } else {
              setInitialFormData(mappedData);
              console.log("✅ Saved data loaded:", mappedData);
            }
          } else {
            console.error("❌ No form data found in API response");
            // Fallback to Step 1 data if no saved data
            if (hasStep1Data) {
              const step1Data = loadStep1Data();
              if (step1Data) {
                setInitialFormData(step1Data);
                console.log(
                  "✅ Fallback: Step 1 data loaded (no saved data):",
                  step1Data
                );
              }
            }
          }
        } else if (hasStep1Data) {
          // Only load Step 1 data if no transaction ID (new form)
          console.log("🔍 Loading Step 1 data (no transaction ID)");
          const step1Data = loadStep1Data();

          if (step1Data) {
            setInitialFormData(step1Data);
            console.log("✅ Step 1 data loaded (new form):", step1Data);
            console.log(
              "✅ Employee number from Step 1:",
              step1Data.employeeNumber
            );
            console.log(
              "✅ Vendor account group from Step 1:",
              step1Data.vendorAccountGroup
            );
          } else {
            console.error("❌ Missing Step 1 data for new form");
            toast.error("Missing form data. Please start over.");
            navigate("/vendor-onboarding");
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Error loading form data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [hasStep1Data, editMode, viewMode, transId, orgName, formName, navigate]);

  /**
   * Reload data for a specific organization (used when org changes)
   */
  const reloadDataForOrg = async (
    newOrgName: string,
    transactionId: string
  ): Promise<Partial<VendorFormData> | null> => {
    try {
      const { data, error } = await getVendorDataByTransId(
        transactionId,
        newOrgName,
        formName || "Vendor Onboarding"
      );

      if (error) {
        toast.error(
          `Failed to load vendor data for new organization: ${error}`
        );
        return null;
      }

      if (data?.response_body?.[0]?.form_data) {
        const apiFormData = data.response_body[0].form_data;
        const mappedData = mapAPIToFormData(apiFormData);
        
        // Extract and store form_id and transaction_id from API response
        const formId = 
          (typeof apiFormData === 'object' && apiFormData !== null && 'form_id' in apiFormData 
            ? String(apiFormData.form_id) 
            : null) || 
          data.response_body[0].trans_id || 
          transactionId;
        const transactionIdFromResponse = data.response_body[0].trans_id || transactionId;
        
        // Store form_id and transaction_id in sessionStorage for later use
        if (formId && formId.trim()) {
          sessionStorage.setItem(SESSION_KEYS.FORM_ID, formId);
          console.log("✅ Stored form_id in sessionStorage (reload):", formId);
        }
        if (transactionIdFromResponse && transactionIdFromResponse.trim()) {
          sessionStorage.setItem(SESSION_KEYS.TRANSACTION_ID, transactionIdFromResponse);
          console.log("✅ Stored transaction_id in sessionStorage (reload):", transactionIdFromResponse);
        }
        
        console.log("✅ Data reloaded for new organization:", mappedData);
        return mappedData;
      }

      return null;
    } catch (error) {
      console.error("Error reloading vendor data for new organization:", error);
      toast.error("Failed to reload vendor data for new organization");
      return null;
    }
  };

  return {
    lovData,
    initialFormData,
    isLoading,
    reloadDataForOrg,
  };
};
