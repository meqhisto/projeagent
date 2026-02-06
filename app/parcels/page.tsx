import Link from "next/link";
// ... imports

export default function ParcelsPage() {
    const [parcels, setParcels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    // const [isDrawerOpen, setIsDrawerOpen] = useState(false); // Removed
    const [filters, setFilters] = useState<any>({});

    const fetchParcels = async () => {
        // ... same fetch logic
    };

    // ... useEffect and filters

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                    {/* ... title ... */}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <AdvancedFilterPanel
                        onFilterChange={setFilters}
                        availableCities={availableCities}
                    />
                    <ExportButton parcels={filteredParcels} />

                    {/* Changed button to Link */}
                    <Link
                        href="/parcels/add"
                        className="flex items-center rounded-xl bg-[#0071e3] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0077ed] shadow-lg shadow-[#0071e3]/20 transition-all hover:-translate-y-0.5"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Yeni Parsel Ekle
                    </Link>
                </div>
            </div>

            {/* ... Content Grid ... */}

            {/* Removed AddParcelDrawer component, handled by Intercepting Route */}
        </div>
    );
}
