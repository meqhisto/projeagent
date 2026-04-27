import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";

// GET - Parsel için sunum verilerini getir
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        const parcelId = parseInt(params.id);
        if (isNaN(parcelId)) {
            return NextResponse.json({ error: "Invalid parcel ID" }, { status: 400 });
        }

        // Parsel ve ilişkili verileri getir
        const parcel = await prisma.parcel.findUnique({
            where: { id: parcelId },
            include: {
                images: {
                    orderBy: { isDefault: 'desc' }
                },
                zoning: true,
                notes: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                },
                calculations: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                },
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        if (!parcel) {
            return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
        }

        // Yetki kontrolü
        const isOwner = parcel.ownerId === userId;
        const isAssigned = parcel.assignedTo === userId;
        const isUserAdmin = isAdmin((user as any).role as string);

        if (!isOwner && !isAssigned && !isUserAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Kullanıcının sunum ayarlarını getir
        const presentationSettings = await prisma.userPresentationSettings.findUnique({
            where: { userId }
        });

        // Bölge emsalleri (Otomatik + Manuel)
        const regionalPrecedents = await prisma.zoningPrecedent.findMany({
            where: {
                city: parcel.city,
                district: parcel.district
            },
            take: 5
        });

        // Kullanıcının eklediği emsaller
        const userPrecedents = await prisma.parcelPrecedent.findMany({
            where: { parcelId },
            orderBy: { createdAt: 'desc' }
        });

        // Son fizibilite hesaplamasını parse et
        let lastCalculation = null;
        if (parcel.calculations.length > 0) {
            const calc = parcel.calculations[0];
            try {
                lastCalculation = {
                    ...calc,
                    fullResult: JSON.parse(calc.fullResult)
                };
            } catch {
                lastCalculation = calc;
            }
        }

        // Sunum için birleştirilmiş veri
        const presentationData = {
            parcel: {
                id: parcel.id,
                city: parcel.city,
                district: parcel.district,
                neighborhood: parcel.neighborhood,
                island: parcel.island,
                parsel: parcel.parsel,
                area: parcel.area,
                latitude: parcel.latitude,
                longitude: parcel.longitude,
                status: parcel.status,
                crmStage: parcel.crmStage,
                category: parcel.category
            },
            images: parcel.images,
            zoning: parcel.zoning,
            notes: parcel.notes,
            feasibility: lastCalculation,
            regionalData: regionalPrecedents,
            userPrecedents: userPrecedents,
            userSettings: presentationSettings || {
                companyName: user.name,
                email: user.email,
                phone: null,
                logoUrl: null,
                address: null,
                website: null
            },
            generatedAt: new Date().toISOString()
        };

        return NextResponse.json(presentationData);
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("GET presentation error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
