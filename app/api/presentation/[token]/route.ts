import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Token ile public sunum verilerini getir (AUTH GEREKTİRMEZ)
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ token: string }> }
) {
    const params = await props.params;
    try {
        const { token } = params;

        if (!token) {
            return NextResponse.json({ error: "Token required" }, { status: 400 });
        }

        // Token ile paylaşım kaydını bul
        const share = await prisma.presentationShare.findUnique({
            where: { token },
            include: {
                parcel: {
                    include: {
                        images: {
                            orderBy: { isDefault: 'desc' }
                        },
                        zoning: true,
                        calculations: {
                            orderBy: { createdAt: 'desc' },
                            take: 1
                        }
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        if (!share) {
            return NextResponse.json({ error: "Presentation not found" }, { status: 404 });
        }

        // Aktiflik kontrolü
        if (!share.isActive) {
            return NextResponse.json({ error: "This link has been deactivated" }, { status: 410 });
        }

        // Son kullanma tarihi kontrolü
        if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
            return NextResponse.json({ error: "This link has expired" }, { status: 410 });
        }

        // Görüntülenme sayısını artır
        await prisma.presentationShare.update({
            where: { id: share.id },
            data: { viewCount: { increment: 1 } }
        });

        // Kullanıcının sunum ayarlarını getir
        const userSettings = await prisma.userPresentationSettings.findUnique({
            where: { userId: share.createdById }
        });

        // Son fizibilite hesaplamasını parse et
        let lastCalculation = null;
        if (share.parcel.calculations.length > 0) {
            const calc = share.parcel.calculations[0];
            try {
                lastCalculation = {
                    ...calc,
                    fullResult: JSON.parse(calc.fullResult)
                };
            } catch {
                lastCalculation = calc;
            }
        }

        // Bölge emsallerini getir
        const regionalPrecedents = await prisma.zoningPrecedent.findMany({
            where: {
                city: share.parcel.city,
                district: share.parcel.district
            },
            take: 5
        });

        // Public sunum verisi
        const presentationData = {
            title: share.title,
            parcel: {
                id: share.parcel.id,
                city: share.parcel.city,
                district: share.parcel.district,
                neighborhood: share.parcel.neighborhood,
                island: share.parcel.island,
                parsel: share.parcel.parsel,
                area: share.parcel.area,
                latitude: share.parcel.latitude,
                longitude: share.parcel.longitude,
                category: share.parcel.category
            },
            images: share.parcel.images,
            zoning: share.parcel.zoning,
            feasibility: lastCalculation,
            regionalData: regionalPrecedents,
            userSettings: userSettings || {
                companyName: share.createdBy.name,
                email: share.createdBy.email,
                phone: null,
                logoUrl: null,
                address: null,
                website: null
            },
            shareInfo: {
                createdAt: share.createdAt,
                viewCount: share.viewCount + 1
            }
        };

        return NextResponse.json(presentationData);
    } catch (error: any) {
        console.error("GET public presentation error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
export const runtime = 'nodejs';
