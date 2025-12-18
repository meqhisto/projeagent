import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword() {
    const email = 'altanbariscomert@gmail.com';
    const newPassword = process.argv[2]; // Yeni şifre komut satırından alınacak

    if (!newPassword) {
        console.error('❌ Lütfen yeni şifreyi parametre olarak girin!');
        console.log('Kullanım: npm run reset-password YeniSifreniz');
        process.exit(1);
    }

    try {
        // Kullanıcıyı bul
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.error(`❌ ${email} bulunamadı!`);
            process.exit(1);
        }

        // Yeni şifreyi hashle
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Şifreyi güncelle
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword },
        });

        console.log(`✅ ${email} kullanıcısının şifresi başarıyla değiştirildi!`);
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Yeni şifre: ${newPassword}`);
    } catch (error) {
        console.error('❌ Hata oluştu:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

resetPassword();
