// Helper function to create notifications
export async function createNotification(data: {
    type: string;
    title: string;
    message: string;
    relatedId?: number;
    relatedType?: string;
}) {
    try {
        await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    } catch (error) {
        console.error('Create notification error:', error);
    }
}
