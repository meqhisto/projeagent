import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
