"use client";

import AddParcelDrawer from "@/components/AddParcelDrawer";
import { useRouter } from "next/navigation";

export default function AddParcelModal() {
    const router = useRouter();

    return (
        <AddParcelDrawer
            isOpen={true}
            onClose={() => router.back()}
            onSuccess={() => {
                router.back();
                // Opsiyonel: router.refresh() eklenebilir ama AddParcelDrawer zaten success'te çalışıyor
                router.refresh();
            }}
        />
    );
}
