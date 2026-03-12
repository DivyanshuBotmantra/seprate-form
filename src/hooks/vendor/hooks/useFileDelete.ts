/**
 * Custom hook for handling file deletion with proper context
 * Provides transaction ID and org/form details for delete operations
 */

import { useSearchParams } from 'react-router-dom';
import { getSessionData } from '@/lib/session-utils';

export const useFileDelete = () => {
    const [searchParams] = useSearchParams();

    /**
     * Get delete context for file operations
     * Returns the necessary information to delete a file
     */
    const getDeleteContext = () => {
        const sessionData = getSessionData();
        
        // Get transaction ID from URL or session storage
        const transId = searchParams.get('transId') || 
                       sessionStorage.getItem('VendorTransactionId') || 
                       sessionStorage.getItem('transaction_id') || 
                       '';
        
        // Get org name from URL or session
        const orgName = searchParams.get('orgName') || sessionData.orgName || '';
        
        // Get form name from URL or default to Vendor Onboarding
        const formName = searchParams.get('formName') || 'Vendor Onboarding';

        // Enhanced validation with detailed error messages
        const isValid = Boolean(transId && orgName && formName);
        
        // Log validation details for debugging
        if (!isValid) {
            console.warn('Delete context validation failed:', {
                transId: transId || 'MISSING',
                orgName: orgName || 'MISSING', 
                formName: formName || 'MISSING',
                searchParams: {
                    transId: searchParams.get('transId'),
                    orgName: searchParams.get('orgName'),
                    formName: searchParams.get('formName')
                },
                sessionStorage: {
                    VendorTransactionId: sessionStorage.getItem('VendorTransactionId'),
                    transaction_id: sessionStorage.getItem('transaction_id')
                },
                sessionData: {
                    orgName: sessionData.orgName
                }
            });
        } else {
            // 🔥 NEW: Log successful validation for debugging
            console.log('✅ Delete context validation successful:', {
                transId,
                orgName,
                formName,
                source: {
                    transIdFrom: transId === searchParams.get('transId') ? 'URL' : 'sessionStorage',
                    orgNameFrom: orgName === searchParams.get('orgName') ? 'URL' : 'sessionData',
                    formNameFrom: formName === searchParams.get('formName') ? 'URL' : 'default'
                }
            });
        }

        return {
            transactionId: transId,
            orgName,
            formName,
            isValid,
            // Add validation details for better error messages
            validationErrors: {
                missingTransactionId: !transId,
                missingOrgName: !orgName,
                missingFormName: !formName
            }
        };
    };

    return { getDeleteContext };
};

