import { NextRequest, NextResponse } from "next/server";

const fmt = (x: number): string =>
    new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(Math.round(x)) + " TL";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            arsa_m2,
            emsal,
            kat_karsiligi_orani,
            ortalama_daire_brutu = 100,
            insaat_maliyeti_m2,
            satis_fiyati_m2,
            bonus_factor = 1.30,
            kat_adedi = 5,
        } = body;

        if (!arsa_m2 || arsa_m2 <= 0)
            return NextResponse.json({ detail: "Arsa alanı pozitif olmalıdır." }, { status: 400 });
        if (!emsal || emsal <= 0)
            return NextResponse.json({ detail: "Emsal oranı pozitif olmalıdır." }, { status: 400 });
        if (!ortalama_daire_brutu || ortalama_daire_brutu <= 0)
            return NextResponse.json({ detail: "Ortalama daire büyüklüğü pozitif olmalıdır." }, { status: 400 });

        // Physical properties
        const yasal_alan = arsa_m2 * emsal;
        const toplam_insaat_alani = yasal_alan * bonus_factor;
        const toplam_daire_sayisi = Math.floor(toplam_insaat_alani / ortalama_daire_brutu);
        const arsa_sahibi_daire_sayisi = Math.round(toplam_daire_sayisi * kat_karsiligi_orani);
        const muteahhit_daire_sayisi = Math.max(0, toplam_daire_sayisi - arsa_sahibi_daire_sayisi);

        // Financial x-ray
        const toplam_insaat_maliyeti = toplam_insaat_alani * insaat_maliyeti_m2;
        const arsa_sahibi_maliyeti_yuku = arsa_sahibi_daire_sayisi * ortalama_daire_brutu * insaat_maliyeti_m2;
        const satilabilir_alan = muteahhit_daire_sayisi * ortalama_daire_brutu;
        const toplam_ciro = satilabilir_alan * satis_fiyati_m2;
        const net_kar = toplam_ciro - toplam_insaat_maliyeti;
        const kar_marji = toplam_insaat_maliyeti > 0 ? (net_kar / toplam_insaat_maliyeti) * 100 : 0;

        // Feasibility decision
        let durum: string, yorum: string, oneri: string;
        if (kar_marji < 25) {
            durum = "RİSKLİ";
            yorum = `Proje %${kar_marji.toFixed(1)} kâr marjı ile riskli görünüyor. Enflasyonist ortamda zarar edilebilir.`;
            oneri = "Kat karşılığı oranını düşürmeyi veya satış fiyatlarını artırmayı deneyin.";
        } else if (kar_marji < 50) {
            durum = "MAKUL";
            yorum = `Proje %${kar_marji.toFixed(1)} kâr marjı ile standartlara uygun.`;
            oneri = "Maliyetleri sıkı takip ederek başlanabilir.";
        } else {
            durum = "FIRSAT";
            yorum = `Proje %${kar_marji.toFixed(1)} kâr marjı ile oldukça kârlı.`;
            oneri = "Hemen değerlendirilmeli.";
        }

        // Goodwill (şerefiye) analysis
        const base_price_flat = ortalama_daire_brutu * satis_fiyati_m2;
        const daire_basi_kat = kat_adedi > 0 ? Math.ceil(toplam_daire_sayisi / kat_adedi) : 1;
        const all_flats: Array<{ deger: number }> = [];
        let current_flat_count = 0;

        for (let kat = 0; kat < kat_adedi; kat++) {
            let carpan: number;
            if (kat === 0) carpan = 0.85;
            else if (kat === kat_adedi - 1) carpan = 1.10;
            else carpan = 1.00 + kat * 0.03;

            let flats_on_floor = daire_basi_kat;
            if (current_flat_count + flats_on_floor > toplam_daire_sayisi)
                flats_on_floor = toplam_daire_sayisi - current_flat_count;

            for (let i = 0; i < flats_on_floor; i++) {
                all_flats.push({ deger: base_price_flat * carpan });
                current_flat_count++;
                if (current_flat_count >= toplam_daire_sayisi) break;
            }
            if (current_flat_count >= toplam_daire_sayisi) break;
        }

        const sorted_flats = [...all_flats].sort((a, b) => b.deger - a.deger);
        const optimize_edilmis_ciro = sorted_flats
            .slice(0, muteahhit_daire_sayisi)
            .reduce((sum, f) => sum + f.deger, 0);
        const serefiye_farki = optimize_edilmis_ciro - toplam_ciro;
        const serefiye_artisi_yuzde = toplam_ciro > 0 ? (serefiye_farki / toplam_ciro) * 100 : 0;

        // Cash flow simulation (18 months)
        const aylik_dokum: Record<string, { gider: number; gelir: number; net: number; kasa: number }> = {};
        let cumulative_balance = 0;
        let min_balance = 0;

        for (let month = 1; month <= 18; month++) {
            let expense_ratio = 0;
            let revenue_ratio = 0;

            if (month <= 3) expense_ratio = 0.20 / 3;
            else if (month <= 12) expense_ratio = 0.50 / 9;
            else expense_ratio = 0.30 / 6;

            if (month <= 6) revenue_ratio = 0;
            else if (month <= 15) revenue_ratio = 0.60 / 9;
            else revenue_ratio = 0.40 / 3;

            const monthly_expense = toplam_insaat_maliyeti * expense_ratio;
            const monthly_revenue = optimize_edilmis_ciro * revenue_ratio;
            const net_change = monthly_revenue - monthly_expense;
            cumulative_balance += net_change;
            if (cumulative_balance < min_balance) min_balance = cumulative_balance;

            aylik_dokum[`Ay_${month}`] = {
                gider: Math.round(monthly_expense * 100) / 100,
                gelir: Math.round(monthly_revenue * 100) / 100,
                net: Math.round(net_change * 100) / 100,
                kasa: Math.round(cumulative_balance * 100) / 100,
            };
        }

        const maksimum_nakit_ihtiyaci = Math.abs(min_balance);
        const ilk_6_ay_gider = Array.from({ length: 6 }, (_, i) => aylik_dokum[`Ay_${i + 1}`]?.gider ?? 0)
            .reduce((s, v) => s + v, 0);

        // Proposal
        const pay_yuzde = Math.round(kat_karsiligi_orani * 100);
        const yatirim_degeri = kat_karsiligi_orani < 1
            ? optimize_edilmis_ciro / (1 - kat_karsiligi_orani)
            : optimize_edilmis_ciro;
        const teklif_metni = `Sayın Arsa Sahibi, ${Math.round(arsa_m2)} m² büyüklüğündeki arsanızda, mevcut ${emsal} emsal imar haklarını en verimli şekilde kullanarak toplam ${fmt(yatirim_degeri)} yatırım değerine sahip prestijli bir proje geliştirmeyi hedefliyoruz. Önerilen %${pay_yuzde} paylaşım oranı ile tarafınıza ${arsa_sahibi_daire_sayisi} adet lüks konut teslim edilecektir.`;

        return NextResponse.json({
            fiziksel_ozet: {
                toplam_insaat_alani: `${toplam_insaat_alani.toFixed(2)} m²`,
                toplam_daire_sayisi,
                muteahhit_daireleri: muteahhit_daire_sayisi,
                arsa_sahibi_daireleri: arsa_sahibi_daire_sayisi,
                ortalama_daire_m2: `${ortalama_daire_brutu} m²`,
            },
            finansal_tablo: {
                toplam_insaat_maliyeti: fmt(toplam_insaat_maliyeti),
                arsa_sahibi_maliyeti_yuku: fmt(arsa_sahibi_maliyeti_yuku),
                beklenen_ciro: fmt(toplam_ciro),
                net_kar: fmt(net_kar),
                yatirim_donus_orani_roi: `%${kar_marji.toFixed(2)}`,
            },
            serefiye_analizi: {
                ortalama_daire_fiyati: fmt(base_price_flat),
                optimize_edilmis_ciro: `${fmt(optimize_edilmis_ciro)} (Şerefiye ile +%${serefiye_artisi_yuzde.toFixed(2)} kazanç)`,
            },
            finansal_simulasyon: {
                maksimum_nakit_ihtiyaci: fmt(maksimum_nakit_ihtiyaci),
                uyari: `Dikkat: Projenin finansmanı için en az ${new Intl.NumberFormat("tr-TR").format(Math.round(maksimum_nakit_ihtiyaci))} TL nakit rezervi veya kredi limiti gereklidir.`,
                ilk_6_ay_gider_ozeti: fmt(ilk_6_ay_gider),
            },
            teklif_ozeti: teklif_metni,
            karar_destek: { durum, yorum, oneri },
            raw: {
                profit: net_kar,
                cost: toplam_insaat_maliyeti,
                revenue: toplam_ciro,
                cash_flow: aylik_dokum,
            },
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Hesaplama hatası";
        return NextResponse.json({ detail: message }, { status: 500 });
    }
}
