import { FormFileField } from "./FormFileField";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const Attachments = ({ isReadOnly = false }: { isReadOnly?: boolean }) => {
    return (
        <>
            <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold text-primary">Document Attachments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-12">
                <div>
                    <h4 className="text-[13px] font-bold uppercase tracking-wider text-primary/80 mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Required Documents
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 items-start">
                        <FormFileField 
                            name="attachments.pan_attachment" 
                            label="PAN Card Copy" 
                            description="Upload clear scan of PAN card"
                            required
                            disabled={isReadOnly}
                        />
                        <FormFileField 
                            name="attachments.gstin_attachment" 
                            label="GST Certificate" 
                            description="Mandatory for GST registered"
                            disabled={isReadOnly}
                        />
                        <FormFileField 
                            name="attachments.bank_details_attachment" 
                            label="Cancelled Cheque / Passbook" 
                            description="Required for account verification"
                            required
                            disabled={isReadOnly}
                        />
                        <FormFileField 
                            name="attachments.cin_attachment" 
                            label="Certificate of Incorporation" 
                            description="Mandatory for Company entities"
                            disabled={isReadOnly}
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-border/50">
                    <h4 className="text-[13px] font-bold uppercase tracking-wider text-primary/80 mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Additional Supporting Documents
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 items-start">
                        <FormFileField 
                            name="attachments.msme_attachment" 
                            label="MSME/Udyam Certificate" 
                            description="Only if MSME status is applicable"
                            disabled={isReadOnly}
                        />
                        <FormFileField 
                            name="attachments.pan_aadhar_linkage_attachment" 
                            label="PAN-Aadhar Linkage Proof" 
                            description="Required for Individual/Proprietorship"
                            disabled={isReadOnly}
                        />
                    </div>
                </div>
            </CardContent>
        </>
    );
};

export default Attachments;
