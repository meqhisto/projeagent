import ParcelsPage from "../page";
import AddParcelDrawer from "@/components/AddParcelDrawer";
import { redirect } from "next/navigation";

// Hard refresh durumunda modal yerine sayfa olarak gösterilecekse:
// Şimdilik basit olması için direkt ParcelsPage'e yönlendirip modalı açtırabiliriz 
// VEYA tam bir sayfa tasarımı yapabiliriz.
// Hızlı çözüm: Redirect to /parcels (Modal URL'i ama intercept çalışmazsa?)
// Doğrusu: Tam sayfa versiyonunu yapmak.

export default function AddParcelPage() {
    // Şimdilik kullanıcıyı /parcels sayfasına yönlendiriyoruz
    // İleride buraya tam sayfa form yapılabilir.
    redirect("/parcels");
}
