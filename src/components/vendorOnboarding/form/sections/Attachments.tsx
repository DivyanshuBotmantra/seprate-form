import { FormFileField } from "./FormFileField";

const Attachments = () => {
    return (
        <div className="p-6 space-y-8">
            <div>
                <h3 className="text-lg font-semibold border-b pb-2 text-primary mb-6">Required Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormFileField 
                        name="attachments.pan_attachment" 
                        label="PAN Card Copy" 
                        description="Upload a clear scan of the vendor's PAN card (PDF/JPG)"
                        required
                    />
                    <FormFileField 
                        name="attachments.gstin_attachment" 
                        label="GST Certificate" 
                        description="Mandatory for GST registered vendors"
                    />
                    <FormFileField 
                        name="attachments.bank_details_attachment" 
                        label="Cancelled Cheque / Passbook" 
                        description="Required for bank account verification"
                        required
                    />
                    <FormFileField 
                        name="attachments.cin_attachment" 
                        label="Certificate of Incorporation" 
                        description="Mandatory for Company entity types"
                    />
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold border-b pb-2 text-primary mb-6">Additional Supporting Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormFileField 
                        name="attachments.msme_attachment" 
                        label="MSME/Udyam Certificate" 
                        description="Only if MSME status is applicable"
                    />
                    <FormFileField 
                        name="attachments.pan_aadhar_linkage_attachment" 
                        label="PAN-Aadhar Linkage Proof" 
                        description="Required for Individual/Proprietorship vendors"
                    />
                </div>
            </div>
        </div>
    );
};

export default Attachments;
