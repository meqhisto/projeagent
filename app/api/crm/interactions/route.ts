import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const parcelId = searchParams.get('parcelId');

    if (!parcelId) {
        return NextResponse.json({ error: 'Parcel ID required' }, { status: 400 });
    }

    try {
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
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { parcelId, customerId, type, content, date } = body;

        const interaction = await prisma.interaction.create({
            data: {
                parcelId: parseInt(parcelId),
                customerId: customerId ? parseInt(customerId) : null,
                type,
                content,
                date: date ? new Date(date) : new Date()
            },
            include: {
                customer: true
            }
        });

        return NextResponse.json(interaction);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create interaction' }, { status: 500 });
    }
}
