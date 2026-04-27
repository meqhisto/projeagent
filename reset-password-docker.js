// Standalone password reset script for Docker
// Usage: node reset-password-docker.js <new-password>

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword() {
    const email = 'altanbariscomert@gmail.com';
    const newPassword = process.argv[2];

    if (!newPassword) {
        console.error('❌ Lütfen yeni şifreyi parametre olarak girin!');
        console.log('Kullanım: node reset-password-docker.js YeniSifreniz');
        process.exit(1);
    }

    console.log('🔄 Şifre değiştirme işlemi başlatılıyor...');
    console.log(`📧 Email: ${email}`);

    try {
        // Kullanıcıyı bul
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.error(`❌ ${email} kullanıcısı bulunamadı!`);
            console.log('\n📋 Mevcut kullanıcıları görmek için:');
            const users = await prisma.user.findMany({
                select: { id: true, email: true, name: true, role: true }
            });
            console.table(users);
            process.exit(1);
        }

        console.log(`✅ Kullanıcı bulundu: ${user.name} (ID: ${user.id})`);

        // Yeni şifreyi hashle
        console.log('🔐 Yeni şifre hashleniyor...');
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Şifreyi güncelle
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword },
        });

        console.log('\n✅ ŞİFRE BAŞARIYLA DEĞİŞTİRİLDİ!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Yeni Şifre: ${newPassword}`);
        console.log(`👤 Kullanıcı: ${user.name}`);
        console.log(`🎭 Rol: ${user.role}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n✨ Artık yeni şifrenizle giriş yapabilirsiniz!');

    } catch (error) {
        console.error('❌ Hata oluştu:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

resetPassword();
