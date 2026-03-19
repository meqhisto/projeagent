import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAdmin } from '@/lib/auth/roleCheck';

export async function GET(request: Request) {
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        const { searchParams } = new URL(request.url);
        const parcelId = searchParams.get('parcelId');

        if (!parcelId) {
            return NextResponse.json({ error: 'Parcel ID required' }, { status: 400 });
        }

        // Verify user has access to this parcel
        const parcel = await prisma.parcel.findFirst({
            where: {
                id: parseInt(parcelId),
                OR: isAdmin((user as any).role) ? undefined : [
                    { ownerId: userId },
                    { assignedTo: userId }
                ]
            }
        });

        if (!parcel && !isAdmin((user as any).role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const interactions = await prisma.interaction.findMany({
            where: {
                parcelId: parseInt(parcelId)
            },
            include: {
                customer: true
            },
            orderBy: {
                date: 'desc'
            }
        });
        return NextResponse.json(interactions);
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        const body = await request.json();
        const { parcelId, customerId, type, content, date } = body;

        // Verify user has access to this parcel
        const parcel = await prisma.parcel.findFirst({
            where: {
                id: parseInt(parcelId),
                OR: isAdmin((user as any).role) ? undefined : [
                    { ownerId: userId },
                    { assignedTo: userId }
                ]
            }
        });

        if (!parcel && !isAdmin((user as any).role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const interaction = await prisma.interaction.create({
            data: {
                parcelId: parseInt(parcelId),
                customerId: customerId ? parseInt(customerId) : null,
                type,
                content,
                date: date ? new Date(date) : new Date(),
                createdBy: userId
            },
            include: {
                customer: true
            }
        });

        return NextResponse.json(interaction);
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json({ error: 'Failed to create interaction' }, { status: 500 });
    }
}
