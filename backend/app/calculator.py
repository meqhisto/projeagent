from typing import Dict, Any, Optional
import math

class ConstructionCalculator:
    """
    Türkiye 'Kat Karşılığı İnşaat' Modeli için Feasibility Engine.
    
    Yöntem: 'Müteahhit Matematiği'
    1. İnşaat Maliyeti: Tüm bina (Arsa sahibi payı dahil) müteahhit tarafından karşılanır.
    2. Gelir: Müteahhit sadece kendine kalan daireleri satarak gelir elde eder.
    3. Arsa Maliyeti: Nakit ödenmez, arsa sahibine bedelsiz daire verilerek ödenmiş olur (Barter).
    """

    def __init__(self, 
                 arsa_m2: float, 
                 emsal: float, 
                 kat_karsiligi_orani: float, 
                 ortalama_daire_brutu: float,
                 insaat_maliyeti_m2: float, 
                 satis_fiyati_m2: float, 
                 bonus_factor: float = 1.30,
                 kat_adedi: int = 5):
        """
        Args:
            arsa_m2 (float): Tapu alanı.
            emsal (float): KAKS oranı.
            kat_karsiligi_orani (float): Arsa sahibine verilecek pay (0.50 = %50).
            ortalama_daire_brutu (float): Hedeflenen ortalama daire büyüklüğü (m2).
            insaat_maliyeti_m2 (float): m2 başı anahtar teslim maliyet.
            satis_fiyati_m2 (float): m2 başı satış fiyatı.
            bonus_factor (float): Emsal harici alan katsayısı (Balkon, sığınak vb.).
            kat_adedi (int): Binanın toplam kat sayısı (Şerefiye hesabı için).
        """
        # Validate critical inputs
        if arsa_m2 <= 0: raise ValueError("Arsa alanı pozitif olmalıdır.")
        if emsal <= 0: raise ValueError("Emsal oranı pozitif olmalıdır.")
        if ortalama_daire_brutu <= 0: raise ValueError("Ortalama daire büyüklüğü pozitif olmalıdır.")
        
        self.arsa_m2 = float(arsa_m2)
        self.emsal = float(emsal)
        self.kat_karsiligi_orani = float(kat_karsiligi_orani)
        self.ortalama_daire_brutu = float(ortalama_daire_brutu)
        self.insaat_maliyeti_m2 = float(insaat_maliyeti_m2)
        self.satis_fiyati_m2 = float(satis_fiyati_m2)
        self.bonus_factor = float(bonus_factor)
        self.kat_adedi = int(kat_adedi)

        self.fiziksel = {}
        self.finansal = {}
        self.karar = {}
        self.serefiye = {}
        self.nakit_akisi = {}

    def calculate_physical_properties(self):
        # 1. Toplam İnşaat Alanı (Müteahhit Brütü)
        yasal_alan = self.arsa_m2 * self.emsal
        toplam_insaat_alani = yasal_alan * self.bonus_factor
        
        # 2. Daire Sayısı Simülasyonu
        # Toplam alandan yaklaşık daire sayısı (Tam sayı)
        toplam_daire_sayisi = math.floor(toplam_insaat_alani / self.ortalama_daire_brutu)
        
        # 3. Paylaşım
        arsa_sahibi_daire_sayisi = round(toplam_daire_sayisi * self.kat_karsiligi_orani)
        muteahhit_daire_sayisi = toplam_daire_sayisi - arsa_sahibi_daire_sayisi
        
        # Düzeltme: Eğer paylaşım sonucu 0 daire kalıyorsa en az 1 atanmalı (teorik)
        if muteahhit_daire_sayisi < 0: muteahhit_daire_sayisi = 0

        self.fiziksel = {
            "toplam_insaat_alani": round(toplam_insaat_alani, 2),
            "toplam_daire_sayisi": toplam_daire_sayisi,
            "muteahhit_daireleri": muteahhit_daire_sayisi,
            "arsa_sahibi_daireleri": arsa_sahibi_daire_sayisi,
            "yasal_emsal_alani": round(yasal_alan, 2)
        }
        return self.fiziksel

    def financial_x_ray(self):
        if not self.fiziksel: self.calculate_physical_properties()
        
        # --- GİDERLER (COST CENTER) ---
        # Müteahhit TÜM BİNAYI yapar.
        toplam_insaat_maliyeti = self.fiziksel["toplam_insaat_alani"] * self.insaat_maliyeti_m2
        
        # Arsa Sahibi Maliyeti Yükü (Gölge Maliyet)
        # Müteahhitin cebinden çıkan paranın ne kadarı arsa sahibinin daireleri için harcandı?
        #(Bu aslında arsa maliyetidir)
        arsa_sahibi_maliyeti_yuku = self.fiziksel["arsa_sahibi_daireleri"] * self.ortalama_daire_brutu * self.insaat_maliyeti_m2
        
        # --- GELİRLER (REVENUE CENTER) ---
        # Müteahhit SADECE kendi dairelerini satar.
        # Satılabilir Alan = Müteahhit Daire Sayısı * Ortalama m2
        satilabilir_alan = self.fiziksel["muteahhit_daireleri"] * self.ortalama_daire_brutu
        toplam_ciro = satilabilir_alan * self.satis_fiyati_m2
        
        # --- SONUÇ (PROFITABILITY) ---
        net_kar = toplam_ciro - toplam_insaat_maliyeti
        kar_marji = (net_kar / toplam_insaat_maliyeti * 100) if toplam_insaat_maliyeti > 0 else 0
        roi = (net_kar / toplam_insaat_maliyeti * 100) # Aynı şey aslında ama ismen ROI
        
        self.finansal = {
            "toplam_insaat_maliyeti": toplam_insaat_maliyeti,
            "arsa_sahibi_maliyeti_yuku": arsa_sahibi_maliyeti_yuku,
            "beklenen_ciro": toplam_ciro,
            "net_kar": net_kar,
            "kar_marji": round(kar_marji, 2),
            "satilabilir_alan_m2": satilabilir_alan
        }
        return self.finansal
    
    def calculate_unit_prices(self):
        """MODÜL 1: ŞEREFİYE SİHİRBAZI"""
        if not self.fiziksel: self.calculate_physical_properties()
        
        toplam_daire = self.fiziksel["toplam_daire_sayisi"]
        muteahhit_daire = self.fiziksel["muteahhit_daireleri"]
        kat_adedi = self.kat_adedi
        base_price_flat = self.ortalama_daire_brutu * self.satis_fiyati_m2

        daireler_ve_fiyatlari = []
        daire_basi_kat = math.ceil(toplam_daire / kat_adedi) if kat_adedi > 0 else 1

        optimize_edilmis_ciro = 0
        
        # Basit Dağılım: Daireleri katlara dağıt
        # Müteahhit genelde üst katları tercih eder (Kâr maksimizasyonu için)
        # Simülasyon: Müteahhit dairelerini Üst Katlardan aşağı doğru seçer.
        
        # Tüm binadaki dairelerin şerefiyeli değerlerini hesaplayalım
        all_flats_value = []
        
        current_flat_count = 0
        for kat in range(kat_adedi):
            # Kat Çarpanı Belirleme
            if kat == 0: # Zemin
                carpan = 0.85
            elif kat == kat_adedi - 1: # En Üst (Manzara)
                carpan = 1.10
            else: # Ara Katlar
                carpan = 1.00 + (kat * 0.03)

            # Bu katta kaç daire var?
            flats_on_floor = daire_basi_kat
            if current_flat_count + flats_on_floor > toplam_daire:
                flats_on_floor = toplam_daire - current_flat_count
            
            for _ in range(flats_on_floor):
                val = base_price_flat * carpan
                all_flats_value.append({
                    "kat": kat, 
                    "deger": val,
                    "carpan": carpan
                })
                current_flat_count += 1
                if current_flat_count >= toplam_daire: break
        
        # Müteahhit Payı Seçimi: En değerli daireleri (Üst katları) kendine alır.
        # Listeyi değere göre tersten sırala
        sorted_flats = sorted(all_flats_value, key=lambda x: x["deger"], reverse=True)
        
        muteahhit_picks = sorted_flats[:muteahhit_daire]
        
        optimize_edilmis_ciro = sum(f["deger"] for f in muteahhit_picks)
        
        # Güncellenmiş Finansal Veri
        serefiye_farki = optimize_edilmis_ciro - self.finansal["beklenen_ciro"]
        if self.finansal["beklenen_ciro"] > 0:
            serefiye_artisi_yuzde = (serefiye_farki / self.finansal["beklenen_ciro"]) * 100
        else:
            serefiye_artisi_yuzde = 0
            
        self.serefiye = {
            "ortalama_daire_fiyati": base_price_flat,
            "optimize_edilmis_ciro": optimize_edilmis_ciro,
            "serefiye_farki": serefiye_farki,
            "serefiye_artisi_yuzde": round(serefiye_artisi_yuzde, 2),
            "detay": "Müteahhit en değerli (üst) katları alarak cirosunu optimize etti."
        }
        
        # Ciro güncellensin mi? Evet, bu daha gerçekçi.
        # self.finansal["beklenen_ciro"] = optimize_edilmis_ciro
        # self.finansal["net_kar"] = optimize_edilmis_ciro - self.finansal["toplam_insaat_maliyeti"]
        
        return self.serefiye

    def simulate_cash_flow(self, duration_months=18):
        """MODÜL 2: NAKİT AKIŞ ZAMAN TÜNELİ"""
        if not self.finansal: self.financial_x_ray()
        if not self.serefiye: self.calculate_unit_prices()

        total_cost = self.finansal["toplam_insaat_maliyeti"]
        # Goodwill calculation revenue is more realistic
        total_revenue = self.serefiye["optimize_edilmis_ciro"]

        flow = {}
        cumulative_balance = 0
        min_balance = 0 # Max cash needed

        for month in range(1, duration_months + 1):
            expense_ratio = 0
            revenue_ratio = 0

            # 1. Gider Eğrisi (S-Curve)
            if 1 <= month <= 3:
                # İlk 3 ay %20
                expense_ratio = 0.20 / 3
            elif 4 <= month <= 12:
                # 4-12 (9 ay) %50
                expense_ratio = 0.50 / 9
            elif 13 <= month <= 18:
                # 13-18 (6 ay) %30
                expense_ratio = 0.30 / 6
            
            # 2. Gelir Eğrisi
            if 1 <= month <= 6:
                revenue_ratio = 0 # Lansman öncesi
            elif 7 <= month <= 15:
                # 7-15 (9 ay) %60
                revenue_ratio = 0.60 / 9
            elif 16 <= month <= 18:
                # 16-18 (3 ay) %40 (Kalan %40)
                # Prompt said "Kalan stok", assumed 100-60=40
                revenue_ratio = 0.40 / 3
            
            monthly_expense = total_cost * expense_ratio
            monthly_revenue = total_revenue * revenue_ratio
            net_change = monthly_revenue - monthly_expense
            
            cumulative_balance += net_change
            if cumulative_balance < min_balance:
                min_balance = cumulative_balance

            flow[f"Ay_{month}"] = {
                "gider": round(monthly_expense, 2),
                "gelir": round(monthly_revenue, 2),
                "net": round(net_change, 2),
                "kasa": round(cumulative_balance, 2)
            }
        
        self.nakit_akisi = {
            "aylik_dokum": flow,
            "maksimum_nakit_ihtiyaci": abs(min_balance),
            "finansal_uyari": f"Dikkat: Projenin finansmanı için en az {abs(min_balance):,.0f} TL nakit rezervi veya kredi limiti gereklidir."
        }
        return self.nakit_akisi

    def generate_proposal_data(self):
        """MODÜL 3: TEKLİF OLUŞTURUCU"""
        if not self.karar: self.check_feasibility()
        
        # Türkçe Format
        def tr(x): return f"{x:,.0f} TL".replace(",", ".")

        proje_degeri = self.finansal["toplam_insaat_maliyeti"] + self.finansal["arsa_sahibi_maliyeti_yuku"] # Yaklaşık
        # Veya toplam ciro üzerinden yatırım değeri
        yatirim_degeri = self.serefiye.get("optimize_edilmis_ciro", self.finansal["beklenen_ciro"]) / (1 - self.kat_karsiligi_orani)

        pay_yuzde = int(self.kat_karsiligi_orani * 100)
        
        ozet = (
            f"Sayın Arsa Sahibi, {int(self.arsa_m2)} m² büyüklüğündeki arsanızda, "
            f"mevcut {self.emsal} emsal imar haklarını en verimli şekilde kullanarak "
            f"toplam {tr(yatirim_degeri)} yatırım değerine sahip prestijli bir proje geliştirmeyi hedefliyoruz. "
            f"Önerilen %{pay_yuzde} paylaşım oranı ile tarafınıza {self.fiziksel['arsa_sahibi_daireleri']} adet "
            f"lüks konut teslim edilecektir."
        )

        return {
            "baslik": "Arsa Değerlendirme ve Proje Teklifi",
            "teklif_metni": ozet,
            "yatirim_degeri": tr(yatirim_degeri),
            "slogan": self.karar["durum"] == "FIRSAT" and "Bölgenin en karlı yatırımı!" or "Güvenli ve gerçekçi bir dönüşüm."
        }

    def check_feasibility(self):
        if not self.finansal: self.financial_x_ray()
        
        km = self.finansal["kar_marji"]
        
        if km < 25:
            durum = "RİSKLİ"
            yorum = f"Proje %{km:.1f} kâr marjı ile riskli görünüyor. Enflasyonist ortamda zarar edilebilir."
            oneri = "Kat karşılığı oranını düşürmeyi veya satış fiyatlarını artırmayı deneyin."
        elif 25 <= km < 50:
            durum = "MAKUL"
            yorum = f"Proje %{km:.1f} kâr marjı ile standartlara uygun."
            oneri = "Maliyetleri sıkı takip ederek başlanabilir."
        else:
            durum = "FIRSAT"
            yorum = f"Proje %{km:.1f} kâr marjı ile oldukça kârlı."
            oneri = "Hemen değerlendirilmeli."

        self.karar = {
            "durum": durum,
            "yorum": yorum,
            "oneri": oneri
        }
        return self.karar

    def get_report(self) -> Dict[str, Any]:
        self.calculate_physical_properties()
        self.financial_x_ray()
        self.check_feasibility()
        self.calculate_unit_prices()
        self.simulate_cash_flow()
        proposal = self.generate_proposal_data()
        
        # Format Currency helper
        def fmt(x): return f"{x:,.0f} TL"

        return {
            "fiziksel_ozet": {
                "toplam_insaat_alani": f"{self.fiziksel['toplam_insaat_alani']} m²",
                "toplam_daire_sayisi": self.fiziksel['toplam_daire_sayisi'],
                "muteahhit_daireleri": self.fiziksel['muteahhit_daireleri'],
                "arsa_sahibi_daireleri": self.fiziksel['arsa_sahibi_daireleri'],
                "ortalama_daire_m2": f"{self.ortalama_daire_brutu} m²"
            },
            "finansal_tablo": {
                "toplam_insaat_maliyeti": fmt(self.finansal['toplam_insaat_maliyeti']),
                "arsa_sahibi_maliyeti_yuku": fmt(self.finansal['arsa_sahibi_maliyeti_yuku']),
                "beklenen_ciro": fmt(self.finansal['beklenen_ciro']),
                "net_kar": fmt(self.finansal['net_kar']),
                "yatirim_donus_orani_roi": f"%{self.finansal['kar_marji']}"
            },
            "serefiye_analizi": {
                "ortalama_daire_fiyati": fmt(self.serefiye["ortalama_daire_fiyati"]),
                "optimize_edilmis_ciro": f"{fmt(self.serefiye['optimize_edilmis_ciro'])} (Şerefiye ile +%{self.serefiye['serefiye_artisi_yuzde']} kazanç)"
            },
            "finansal_simulasyon": {
                "maksimum_nakit_ihtiyaci": fmt(self.nakit_akisi["maksimum_nakit_ihtiyaci"]),
                "uyari": self.nakit_akisi["finansal_uyari"],
                "ilk_6_ay_gider_ozeti": fmt(sum(self.nakit_akisi["aylik_dokum"][f"Ay_{i}"]["gider"] for i in range(1,7)))
            },
            "teklif_ozeti": proposal["teklif_metni"],
            "karar_destek": self.karar,
            # Raw Data for Charts if needed
            "raw": {
                "profit": self.finansal['net_kar'],
                "cost": self.finansal['toplam_insaat_maliyeti'],
                "revenue": self.finansal['beklenen_ciro'],
                "cash_flow": self.nakit_akisi["aylik_dokum"]
            }
        }

if __name__ == "__main__":
    import json
    # Test Senaryosu
    calc = ConstructionCalculator(
        arsa_m2=1000,
        emsal=1.5,
        kat_karsiligi_orani=0.50,
        ortalama_daire_brutu=100,
        insaat_maliyeti_m2=20000,
        satis_fiyati_m2=60000,
        kat_adedi=5
    )
    
    report = calc.get_report()
    
    # İstenen Format
    ozet_cikti = {
        "serefiye_analizi": report["serefiye_analizi"],
        "finansal_uyari": report["finansal_simulasyon"]["uyari"],
        "teklif_ozeti": report["teklif_ozeti"]
    }
    
    print(json.dumps(ozet_cikti, indent=2, ensure_ascii=False))
