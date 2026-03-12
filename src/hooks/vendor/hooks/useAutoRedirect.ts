import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFormUserMaster } from '@/services/form-user-master';
import { getFormDetails } from '@/services/form-master';

interface AutoRedirectState {
    isChecking: boolean;
    shouldRedirect: boolean;
    redirectPath: string | null;
}

export const useAutoRedirect = () => {
    const navigate = useNavigate();
    const [state, setState] = useState<AutoRedirectState>({
        isChecking: true,
        shouldRedirect: false,
        redirectPath: null
    });

    useEffect(() => {
        const checkAndRedirect = async () => {
            try {
                // Get user details from session storage
                const userDetails = JSON.parse(sessionStorage.getItem("userDetail") || "{}");
                const userRole = userDetails?.role;
                const userId = userDetails?.user_id;

                // Only check for USER role
                if (userRole !== "USER" || !userId) {
                    setState({ isChecking: false, shouldRedirect: false, redirectPath: null });
                    return;
                }

                // Get organization name for USER role
                let orgName = "";
                if (userDetails?.org_name) {
                    // Handle both array and string formats for org_name
                    orgName = Array.isArray(userDetails.org_name) 
                      ? userDetails.org_name[0] 
                      : userDetails.org_name;
                }

                if (!orgName) {
                    setState({ isChecking: false, shouldRedirect: false, redirectPath: null });
                    return;
                }

                console.log("🔍 Checking for auto-redirect - USER with org:", orgName);

                // Get assigned forms for the user
                const userFormsPayload = {
                    org_name: orgName,
                    form_name: "", // Empty to get all assigned forms
                    user_id: userId,
                };

                const { data: userForms, error: userFormsError } = await getFormUserMaster(userFormsPayload);

                if (userFormsError || !userForms || userForms.length === 0) {
                    console.log("🔍 No forms assigned to user");
                    setState({ isChecking: false, shouldRedirect: false, redirectPath: null });
                    return;
                }

                // Extract unique form names from assigned forms
                const formNames = [...new Set(userForms.map(form => form.form_name))];
                // If user has exactly one form, proceed with redirect
                if (formNames.length === 1) {
                    const formName = formNames[0];
                    console.log("🔄 Auto-redirecting USER with single form access:", formName);

                    // Get form details to check if it's active
                    const formDetailsPayload = {
                        org_name: orgName,
                        form_name: formName,
                        form_template: "",
                        storage_type: "",
                        credentials: "",
                        mail_server: "",
                        mail_credentials: "",
                        form_status: "",
                        form_description: "",
                    };

                    const { data: formDetails, error: formDetailsError } = await getFormDetails(formDetailsPayload);

                    if (formDetailsError || !formDetails || formDetails.length === 0) {
                        console.log("🔍 Form details not found or inactive");
                        setState({ isChecking: false, shouldRedirect: false, redirectPath: null });
                        return;
                    }

                    // Check if form is active
                    const isActive = formDetails.some(form => form.form_status === "Active");
                    if (!isActive) {
                        console.log("🔍 Form is not active");
                        setState({ isChecking: false, shouldRedirect: false, redirectPath: null });
                        return;
                    }

                    // Store form context in session storage
                    const formContext = {
                        org_name: orgName,
                        form_name: formName
                    };

                    sessionStorage.setItem("SelectedForm", JSON.stringify(formContext));

                    // Dispatch custom event to notify Form Data page about form change
                    const event = new CustomEvent('formChanged', {
                        detail: {
                            form_name: formName,
                            org_name: orgName
                        }
                    });
                    window.dispatchEvent(event);

                    console.log("🔄 Form context updated and event dispatched:", formContext);

                    // Determine redirect path - all forms now use dynamic routing
                    const redirectPath = '/form-data';

                    setState({ isChecking: false, shouldRedirect: true, redirectPath });
                } else if (formNames.length > 1) {
                    console.log("🔍 User has multiple forms, staying on home page to show sidebar");
                    setState({ isChecking: false, shouldRedirect: false, redirectPath: null });
                } else {
                    console.log("🔍 User has no forms assigned, no auto-redirect");
                    setState({ isChecking: false, shouldRedirect: false, redirectPath: null });
                }
            } catch (error) {
                console.error("Error in auto-redirect check:", error);
                setState({ isChecking: false, shouldRedirect: false, redirectPath: null });
            }
        };

        checkAndRedirect();
    }, []);

    // Handle redirect when state changes
    useEffect(() => {
        if (state.shouldRedirect && state.redirectPath) {
            console.log("🚀 Executing auto-redirect to:", state.redirectPath);
            navigate(state.redirectPath, { replace: true });
        }
    }, [state.shouldRedirect, state.redirectPath, navigate]);

    return state;
};
