/**
 * Custom hook for loading vendor LOV and initial form data.
 * integrated with the new centralized config and refactored LOV utilities.
 */

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getFormLovs } from "@/services/vendor-onboarding/form-data";
import { mapAPILOVToDropdown } from "../utils/lov-utils";
import type { LOVData } from "../utils/types";
import { FORMDATA_CONFIG } from "../form/config";


export const useVendorDataLoader = () => {
    const [lovData, setLovData] = useState<LOVData | null>(null);
    const [isLoadingLov, setIsLoadingLov] = useState(true);

    const fetchLOVData = useCallback(async () => {
        setIsLoadingLov(true);
        try {
            const { data, error } = await getFormLovs({
                form_name: FORMDATA_CONFIG.FORM_NAME,
                org_name: FORMDATA_CONFIG.ORG_NAME,
            });

            if (error) {
                toast.error("Failed to load form options: " + error);
            } else if (data) {
                const mapped = mapAPILOVToDropdown(data);
                setLovData(mapped);
            }
        } catch (err) {
            console.error("LOV Fetch Error:", err);
            toast.error("An unexpected error occurred while loading form options.");
        } finally {
            setIsLoadingLov(false);
        }
    }, []);

    useEffect(() => {
        fetchLOVData();
    }, [fetchLOVData]);

    return {
        lovData,
        isLoadingLov,
        refreshLovs: fetchLOVData
    };
};
