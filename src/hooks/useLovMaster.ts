import { useEffect, useState } from "react";
import { toast } from "sonner";
import getLovMaster from "@/services/lov-master";

export interface LovItem {
    lov_type: string;
    lov_json: any;
    lov_status: string;
}

export const useLovMaster = (open: boolean) => {
    const [lovData, setLovData] = useState<LovItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return; // only fetch when sheet is opened

        const fetchLov = async () => {
            setLoading(true);

            try {
                const payload = {
                    lov_type: "",
                    lov_json: "",
                    lov_status: "",
                };

                const res = await getLovMaster(payload);

                if (res.error) {
                    toast.error(res.error);
                    setLovData([]);
                } else {
                    const body = res?.data?.response_body || [];
                    setLovData(body);
                }
            } catch (err) {
                toast.error("Failed to fetch LOV master data");
                console.error("LOV error:", err);
                setLovData([]);
            }

            setLoading(false);
        };

        fetchLov();
    }, [open]);

    return { lovData, loading };
};
