"use client";

import { useState } from "react";
import ParcelCard from "@/components/ParcelCard";
import AddParcelDrawer from "@/components/AddParcelDrawer";

// Mock data
const mockParcels: any[] = [
  {
    id: 1,
    properties: {
      il: "İstanbul",
      ilce: "Kadıköy",
      mahalle: "Caferağa",
      ada: "123",
      parsel: "4",
      nitelik: "Arsa",
      mevkii: "Moda",
    },
    status: "PENDING",
    price: 3500000,
    owner_name: "Ahmet Yılmaz",
    owner_phone: "0555 123 45 67",
    notes: "Deniz manzaralı, köşe parsel.",
    last_update: "2024-05-20",
  },
  {
    id: 2,
    properties: {
      il: "İzmir",
      ilce: "Urla",
      mahalle: "İskele",
      ada: "456",
      parsel: "12",
      nitelik: "Tarla",
      mevkii: "Sahil Yolu",
    },
    status: "RESEARCHING",
    price: 2100000,
    owner_name: "Ayşe Demir",
    owner_phone: "0532 987 65 43",
    notes: "Zeytin ağaçları var.",
    last_update: "2024-05-19",
  },
  {
    id: 3,
    properties: {
      il: "Antalya",
      ilce: "Kaş",
      mahalle: "Kalkan",
      ada: "789",
      parsel: "1",
      nitelik: "Villa İmarlı",
      mevkii: "Merkez",
    },
    status: "COMPLETED",
    price: 8750000,
    owner_name: "Mehmet Kaya",
    owner_phone: "0505 555 44 33",
    notes: "Full deniz manzaralı.",
    last_update: "2024-05-18",
  },
];

export default function TestUIPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Test UI (Demo)</h1>
            <p className="text-gray-500 mt-2">New UI Components Showcase</p>
          </div>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="px-4 py-2 bg-[#0071e3] text-white rounded-lg hover:bg-[#0077ed] transition-colors shadow-sm font-medium"
          >
            + Add New Parcel
          </button>
        </div>

        {/* Stats / Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockParcels.map((parcel) => (
            <ParcelCard
              key={parcel.id}
              id={parcel.id}
              city={parcel.properties.il}
              district={parcel.properties.ilce}
              island={parseInt(parcel.properties.ada)}
              parcel={parseInt(parcel.properties.parsel)}
              status={parcel.status}
              zoning={{ ks: 1.5, taks: 0.4 }} // Mock zoning
            />
          ))}
        </div>

        {/* Empty State Example */}
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔍</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No results found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your filters or search query.</p>
        </div>

        {/* Drawer Component */}
        <AddParcelDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onSuccess={() => {
            alert("Parcel added successfully!");
            setIsDrawerOpen(false);
          }}
        />

      </div>
    </div>
  );
}
