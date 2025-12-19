
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getUserId, isAdmin } from '@/lib/auth/roleCheck';

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");
        const customerId = parseInt(params.id);

        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            include: {
                parcels: {
                    select: {
                        id: true,
                        city: true,
                        district: true,
                        neighborhood: true,
                        island: true,
                        parsel: true,
                        area: true,
                        crmStage: true,
                    }
                },
                interactions: {
                    orderBy: { date: 'desc' },
                    take: 20
                }
            }
        });

        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        // Check ownership
        const isOwner = customer.ownerId === userId;
        const isUserAdmin = isAdmin((user as any).role as string);

        if (!isOwner && !isUserAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        return NextResponse.json(customer);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");
        const customerId = parseInt(params.id);

        const body = await request.json();
        const { name, role, phone, email, notes, connectParcelId, disconnectParcelId } = body;

        // Verify ownership
        const existingCustomer = await prisma.customer.findUnique({
            where: { id: customerId },
            select: { ownerId: true }
        });

        if (!existingCustomer) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const isOwner = existingCustomer.ownerId === userId;
        const isUserAdmin = isAdmin((user as any).role as string);

        if (!isOwner && !isUserAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const data: any = {};
        if (name) data.name = name;
        if (role) data.role = role;
        if (phone) data.phone = phone;
        if (email) data.email = email;
        if (notes) data.notes = notes;

        // Handle Parcel Connections
        if (connectParcelId) {
            data.parcels = {
                connect: { id: parseInt(connectParcelId) }
            };
        }

        if (disconnectParcelId) {
            data.parcels = {
                disconnect: { id: parseInt(disconnectParcelId) }
            };
        }

        const updatedCustomer = await prisma.customer.update({
            where: { id: customerId },
            data,
            include: { parcels: true }
        });

        return NextResponse.json(updatedCustomer);

    } catch (error) {
        console.error("PATCH Customer Error:", error);
        return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");
        const customerId = parseInt(params.id);

        const existingCustomer = await prisma.customer.findUnique({
            where: { id: customerId },
            select: { ownerId: true }
        });

        if (!existingCustomer) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const isOwner = existingCustomer.ownerId === userId;
        const isUserAdmin = isAdmin((user as any).role as string);

        if (!isOwner && !isUserAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await prisma.customer.delete({
            where: { id: customerId }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
    }
}
