import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createFormData } from "@/services/vendor-onboarding/form-data";
import { Loader2, ArrowRight } from "lucide-react";
import { FIELD_DEPENDENCIES, createInitialDraftPayload } from "../../components/vendorOnboarding/form/config";

const VendorFormStep1 = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type_of_vendor: "XK01" as "XK01" | "FK01",
        name1: "",
        gstin: "",
        pan_number: ""
    });

    const handleGstinChange = (value: string) => {
        const gstin = value.toUpperCase();
        let pan = formData.pan_number;
        
        // Auto-extract PAN from GSTIN (using centralized indices)
        if (gstin.length >= FIELD_DEPENDENCIES.GSTIN_TO_PAN.end) {
            pan = gstin.substring(
                FIELD_DEPENDENCIES.GSTIN_TO_PAN.start, 
                FIELD_DEPENDENCIES.GSTIN_TO_PAN.end
            );
        }
        
        setFormData(prev => ({ ...prev, gstin, pan_number: pan }));
    };

    const handleNext = async () => {
        if (!formData.name1 || !formData.pan_number) {
            toast.error("Please fill in Vendor Name and PAN");
            return;
        }

        setLoading(true);
        try {
            const payload = createInitialDraftPayload(formData);

            const { data, error } = await createFormData(payload);

            if (data && data.response_body?.transaction_id) {
                const transId = data.response_body.transaction_id;
                toast.success("Transaction initiated!");
                navigate(`/vendor-form?transId=${transId}&formName=Vendor Onboarding`);
            } else {
                toast.error(error || "Failed to initiate transaction");
            }
        } catch (err) {
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh] p-4">
            <Card className="w-full max-w-lg shadow-lg border-border/50">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">New Vendor Registration</CardTitle>
                    <CardDescription>Step 1: Basic Identification</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Type of Vendor</Label>
                        <Select 
                            value={formData.type_of_vendor} 
                            onValueChange={(v: "XK01" | "FK01") => setFormData(p => ({...p, type_of_vendor: v}))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="XK01">Vendor Purchase Org (XK01)</SelectItem>
                                <SelectItem value="FK01">Direct FI Vendor (FK01)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Vendor Name</Label>
                        <Input 
                            placeholder="Enter full legal name" 
                            value={formData.name1}
                            onChange={(e) => setFormData(p => ({...p, name1: e.target.value}))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>GSTIN (Optional)</Label>
                        <Input 
                            placeholder="27AAAAA0000A1Z5" 
                            value={formData.gstin}
                            onChange={(e) => handleGstinChange(e.target.value)}
                            maxLength={15}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>PAN Number</Label>
                        <Input 
                            placeholder="ABCDE1234F" 
                            value={formData.pan_number}
                            onChange={(e) => setFormData(p => ({...p, pan_number: e.target.value.toUpperCase()}))}
                            maxLength={10}
                        />
                    </div>

                    <Button className="w-full mt-4" onClick={handleNext} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                        Initiate Registration
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default VendorFormStep1;
