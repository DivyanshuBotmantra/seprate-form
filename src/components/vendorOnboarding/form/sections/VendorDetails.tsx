import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { VendorFormValues } from "../schema";

const VendorDetails = () => {
    const { control } = useFormContext<VendorFormValues>();

    return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <h3 className="col-span-full text-lg font-semibold border-b pb-2 mb-2 text-primary">Basic Information</h3>
            
            <FormField
                control={control}
                name="vendor_details.name1"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Full Name / Name 1 *</FormLabel>
                        <FormControl>
                            <Input placeholder="Enter legal vendor name" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={control}
                name="vendor_details.name2"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Name 2 (Optional)</FormLabel>
                        <FormControl>
                            <Input placeholder="Additional name info" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={control}
                name="vendor_details.vendor_account_group"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Vendor Account Group *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select group" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="V001">V001 - Domestic Material</SelectItem>
                                <SelectItem value="V002">V002 - Foreign Material</SelectItem>
                                <SelectItem value="V010">V010 - Employee</SelectItem>
                                <SelectItem value="V007">V007 - Foreign Asset</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={control}
                name="vendor_details.company_code"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Company Code *</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. 1000" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={control}
                name="vendor_details.terms_of_payment_key"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Terms of Payment *</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. Y001" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={control}
                name="vendor_details.search_term1"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Search Term</FormLabel>
                        <FormControl>
                            <Input placeholder="Short identifier" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
};

export default VendorDetails;
