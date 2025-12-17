import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Get customer with relations
export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const customer = await prisma.customer.findUnique({
            where: { id: parseInt(params.id) },
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
                    take: 50
                }
            }
        });

        if (!customer) {
            return NextResponse.json(
                { error: "Customer not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(customer);
    } catch (error) {
        console.error("Get customer error:", error);
        return NextResponse.json(
            { error: "Failed to fetch customer" },
            { status: 500 }
        );
    }
}


// PATCH - Update customer
export async function PATCH(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const body = await request.json();
        const { name, role, phone, email, notes } = body;

        const customer = await prisma.customer.update({
            where: { id: parseInt(params.id) },
            data: {
                name,
                role,
                phone,
                email,
                notes,
            },
        });

        return NextResponse.json(customer);
    } catch (error) {
        console.error("Update customer error:", error);
        return NextResponse.json(
            { error: "Failed to update customer" },
            { status: 500 }
        );
    }
}

// DELETE - Delete customer
export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        await prisma.customer.delete({
            where: { id: parseInt(params.id) },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete customer error:", error);
        return NextResponse.json(
            { error: "Failed to delete customer" },
            { status: 500 }
        );
    }
}
