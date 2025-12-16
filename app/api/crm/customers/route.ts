import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getUserId, isAdmin } from '@/lib/auth/roleCheck';

export async function GET(request: Request) {
    try {
        // Authenticate user
        const user = await requireAuth();
        const userId = await getUserId();

        const { searchParams } = new URL(request.url);
        const parcelId = searchParams.get('parcelId');

        // Build where clause based on role
        const baseWhere = isAdmin((user as any).role as string)
            ? {} // Admin sees all customers
            : { ownerId: userId }; // Users see only their own customers

        if (parcelId) {
            const customers = await prisma.customer.findMany({
                where: {
                    ...baseWhere,
                    parcels: {
                        some: {
                            id: parseInt(parcelId)
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                include: {
                    parcels: true // Optional: if we want to see other parcels they own
                }
            });
            return NextResponse.json(customers);
        }

        // Return all customers based on role
        const customers = await prisma.customer.findMany({
            where: baseWhere,
            orderBy: { createdAt: 'desc' },
            include: {
                parcels: {
                    select: {
                        id: true,
                        city: true,
                        district: true,
                        island: true,
                        parsel: true
                    }
                },
                interactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
        return NextResponse.json(customers);
    } catch (error) {
        console.error('GET /api/crm/customers error:', error);
        return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        // Authenticate user
        const userId = await getUserId();

        const body = await request.json();
        const { name, role, phone, email, notes, parcelId } = body;

        // Note: Logic could be "Find or Create" based on phone/email to avoid duplicates
        // But for now, simple create.

        const data: any = {
            name,
            role,
            phone,
            email,
            notes,
            ownerId: userId // Set owner to current user
        };

        if (parcelId) {
            data.parcels = {
                connect: { id: parseInt(parcelId) }
            };
        }

        const customer = await prisma.customer.create({
            data
        });

        return NextResponse.json(customer);
    } catch (error) {
        console.error('POST /api/crm/customers error:', error);
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
    }
}
