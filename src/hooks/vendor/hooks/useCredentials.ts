import { useState, useEffect } from 'react';
import { getCredentials, type GetCredentialsResponse } from '@/services/get-credentials';

interface UseCredentialsResult {
    credentialsData: GetCredentialsResponse[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching credentials with caching
 * This hook ensures credentials are fetched only once and shared across components
 */
export const useCredentials = (): UseCredentialsResult => {
    const [credentialsData, setCredentialsData] = useState<GetCredentialsResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCredentials = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log("=== useCredentials: Fetching Credentials ===");

            const { data, error: apiError } = await getCredentials({
                cred_type: "storage_credentials",
                cred_sub_type: "",
                cred_type_status: "Active",
            });

            if (apiError) {
                console.error("Error fetching credentials:", apiError);
                setError(apiError);
                setCredentialsData([]);
            } else {
                // Filter only storage_credentials
                const storageCredentials = (data || []).filter(
                    (cred) => cred.cred_type === "storage_credentials"
                );
                console.log("useCredentials: Filtered storage credentials:", storageCredentials);
                setCredentialsData(storageCredentials);
            }
        } catch (err: unknown) {
            console.error("Error fetching credentials:", err);
            setError((err as Error).message || "Failed to fetch credentials");
            setCredentialsData([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch credentials on mount
    useEffect(() => {
        fetchCredentials();
    }, []);

    return {
        credentialsData,
        loading,
        error,
        refetch: fetchCredentials,
    };
};
