import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const district = searchParams.get("district");
    const neighborhood = searchParams.get("neighborhood");

    if (!city || !district || !neighborhood) {
        return NextResponse.json({ error: "Missing location" }, { status: 400 });
    }

    try {
        const precedents = await prisma.zoningPrecedent.findMany({
            where: {
                city: { equals: city },
                district: { equals: district },
                neighborhood: { equals: neighborhood }
            }
        });
        return NextResponse.json(precedents);
    } catch (error) {
        console.error("GET Precedent Error:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { city, district, neighborhood, type, ks, taks, maxHeight, notes } = body;

        // Upsert logic based on composite unique constraint
        const precedent = await prisma.zoningPrecedent.upsert({
            where: {
                city_district_neighborhood_type: {
                    city,
                    district,
                    neighborhood,
                    type
                }
            },
            update: {
                ks: parseFloat(ks),
                taks: parseFloat(taks),
                maxHeight: parseFloat(maxHeight),
                notes
            },
            create: {
                city,
                district,
                neighborhood,
                type,
                ks: parseFloat(ks),
                taks: parseFloat(taks),
                maxHeight: parseFloat(maxHeight),
                notes
            }
        });

        return NextResponse.json(precedent);
    } catch (error) {
        console.error("POST Precedent Error:", error);
        return NextResponse.json({ error: "Failed to save precedent" }, { status: 500 });
    }
}
export const runtime = 'nodejs';
