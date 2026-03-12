import VendorFormContainer from "@/components/vendorOnboarding/form/VendorFormContainer";

const VendorFormPage = () => {
    return (
        <div className="p-8 overflow-y-auto h-[calc(100vh-4rem)] bg-background/50">
            <VendorFormContainer />
        </div>
    );
};

export default VendorFormPage;
