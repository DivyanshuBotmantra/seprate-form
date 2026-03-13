import { FormFileField } from "./FormFileField";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const Attachments = ({ isReadOnly = false }: { isReadOnly?: boolean }) => {
    return (
        <>
            <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold text-primary">Document Attachments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-primary mb-4 border-b pb-2">Required Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 items-start">
                        <FormFileField 
                            name="attachments.pan_attachment" 
                            label="PAN Card Copy" 
                            description="Upload a clear scan of the vendor's PAN card (PDF/JPG)"
                            required
                            disabled={isReadOnly}
                        />
                        <FormFileField 
                            name="attachments.gstin_attachment" 
                            label="GST Certificate" 
                            description="Mandatory for GST registered vendors"
                            disabled={isReadOnly}
                        />
                        <FormFileField 
                            name="attachments.bank_details_attachment" 
                            label="Cancelled Cheque / Passbook" 
                            description="Required for bank account verification"
                            required
                            disabled={isReadOnly}
                        />
                        <FormFileField 
                            name="attachments.cin_attachment" 
                            label="Certificate of Incorporation" 
                            description="Mandatory for Company entity types"
                            disabled={isReadOnly}
                        />
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-primary mb-4 border-b pb-2">Additional Supporting Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 items-start">
                        <FormFileField 
                            name="attachments.msme_attachment" 
                            label="MSME/Udyam Certificate" 
                            description="Only if MSME status is applicable"
                            disabled={isReadOnly}
                        />
                        <FormFileField 
                            name="attachments.pan_aadhar_linkage_attachment" 
                            label="PAN-Aadhar Linkage Proof" 
                            description="Required for Individual/Proprietorship vendors"
                            disabled={isReadOnly}
                        />
                    </div>
                </div>
            </CardContent>
        </>
    );
};

export default Attachments;
