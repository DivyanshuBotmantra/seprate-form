import { useState, useEffect } from "react";
import { toast } from "sonner";

export const useEditData = (editMode: boolean, transId: string | null) => {
    const [editFormData, setEditFormData] = useState<Record<string, unknown> | null>(null);

    useEffect(() => {
        if (editMode && transId) {
            try {
                const storedEditData = sessionStorage.getItem("EditFormData");
                if (storedEditData) {
                    const parsedData = JSON.parse(storedEditData);
                    // Check if the transaction ID matches or if no specific trans_id is stored
                    if (parsedData.trans_id === transId || !parsedData.trans_id) {
                        console.log("Loading edit data for transId:", transId, "Stored data:", parsedData);
                        setEditFormData(parsedData.form_data || {});
                    } else {
                        console.warn("Transaction ID mismatch. Expected:", transId, "Found:", parsedData.trans_id);
                        toast.error("Edit data not found for this form");
                    }
                } else {
                    console.warn("No edit data found in session storage");
                    toast.error("No edit data found. Please try again.");
                }
            } catch (error) {
                console.error("Error loading edit data:", error);
                toast.error("Failed to load edit data");
            }
        } else if (editMode && !transId) {
            console.warn("Edit mode is true but no transId provided");
            toast.error("Transaction ID is required for edit mode");
        }
    }, [editMode, transId]);

    return editFormData;
};
