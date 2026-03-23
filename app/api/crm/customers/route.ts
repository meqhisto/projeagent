import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getUserId, isAdmin } from '@/lib/auth/roleCheck';
import { encryptField, decryptField } from '@/lib/encryption';

// Helper to decrypt customer fields
function decryptCustomer<T extends { phone?: string | null; email?: string | null }>(customer: T): T {
    return {
        ...customer,
        phone: customer.phone ? decryptField(customer.phone) : customer.phone,
        email: customer.email ? decryptField(customer.email) : customer.email,
    };
}

export async function GET(request: Request) {
    try {
        // Authenticate user
        const user = await requireAuth();
        const userId = await getUserId();

        const { searchParams } = new URL(request.url);
        const parcelId = searchParams.get('parcelId');
        const search = searchParams.get('search');

        // Build where clause based on role
        const baseWhere: any = isAdmin((user as any).role as string)
            ? {} // Admin sees all customers
            : { ownerId: userId }; // Users see only their own customers

        // Note: Search on encrypted fields won't work with LIKE queries
        // For now, we filter after fetching (inefficient for large datasets)
        // TODO: Implement searchable encryption or hash-based search

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
                    parcels: true
                }
            });

            // Decrypt sensitive fields before returning
            const decryptedCustomers = customers.map(c => decryptCustomer(c));

            // If search provided, filter decrypted results
            if (search) {
                const searchLower = search.toLowerCase();
                const filtered = decryptedCustomers.filter(c =>
                    c.name?.toLowerCase().includes(searchLower) ||
                    c.phone?.toLowerCase().includes(searchLower) ||
                    c.email?.toLowerCase().includes(searchLower)
                );
                return NextResponse.json(filtered);
            }

            return NextResponse.json(decryptedCustomers);
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

        // Decrypt sensitive fields before returning
        const decryptedCustomers = customers.map(c => decryptCustomer(c));

        // If search provided, filter decrypted results
        if (search) {
            const searchLower = search.toLowerCase();
            const filtered = decryptedCustomers.filter(c =>
                c.name?.toLowerCase().includes(searchLower) ||
                c.phone?.toLowerCase().includes(searchLower) ||
                c.email?.toLowerCase().includes(searchLower)
            );
            return NextResponse.json(filtered);
        }

        return NextResponse.json(decryptedCustomers);
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

        // Encrypt sensitive fields before storing
        const encryptedPhone = phone ? encryptField(phone) : null;
        const encryptedEmail = email ? encryptField(email) : null;

        const data: any = {
            name,
            role,
            phone: encryptedPhone,
            email: encryptedEmail,
            notes,
            ownerId: userId
        };

        if (parcelId) {
            data.parcels = {
                connect: { id: parseInt(parcelId) }
            };
        }

        const customer = await prisma.customer.create({
            data
        });

        // Return decrypted version for immediate use
        return NextResponse.json(decryptCustomer(customer));
    } catch (error) {
        console.error('POST /api/crm/customers error:', error);
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
    }
}
