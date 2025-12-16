
import sqlite3
import os
from datetime import datetime

# Veritabanı dosya adı
DB_NAME = "mimar_memory.db"

def create_connection():
    """SQLite veritabanına bağlantı oluşturur."""
    try:
        # Eğer dosya varsa silip sıfırdan oluşturmak isteyebiliriz (Opsiyonel)
        # Şimdilik var olanın üzerine yazmıyor, varsa bağlanıyor.
        conn = sqlite3.connect(DB_NAME)
        print(f"[BASARILI] '{DB_NAME}' veritabanına bağlanıldı.")
        return conn
    except sqlite3.Error as e:
        print(f"[HATA] Veritabanı bağlantı hatası: {e}")
        return None

def create_tables(conn):
    """Tabloları oluşturur."""
    cursor = conn.cursor()

    # 1. TABLO: Contacts (Paydaşlar)
    # Müşteri, arsa sahibi ve müteahhitleri tutar.
    create_contacts_sq = """
    CREATE TABLE IF NOT EXISTS Contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        role TEXT CHECK(role IN ('Arsa Sahibi', 'Müteahhit', 'Yatırımcı', 'Emlakçı')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """

    # 2. TABLO: Lands (Arsa Envanteri)
    # Proje geliştirilecek arsaların tapu verilerini tutar.
    create_lands_sql = """
    CREATE TABLE IF NOT EXISTS Lands (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER,
        city TEXT DEFAULT 'Çanakkale',
        district TEXT,
        neighborhood TEXT,
        ada TEXT,
        parsel TEXT,
        tapu_area_m2 REAL NOT NULL,
        status TEXT,
        map_image_path TEXT,
        FOREIGN KEY (owner_id) REFERENCES Contacts (id) ON DELETE SET NULL
    );
    """

    # 3. TABLO: ZoningMemory (Öğrenen İmar Kütüphanesi)
    # Bölgesel imar kuralları hafızası.
    create_zoning_memory_sql = """
    CREATE TABLE IF NOT EXISTS ZoningMemory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        district TEXT,
        neighborhood TEXT,
        zone_type TEXT,
        emsal_katsayisi REAL,
        taks_orani REAL,
        max_height TEXT,
        plan_note_ref TEXT,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """

    # 4. TABLO: Feasibilities (Fizibilite ve Hesaplamalar)
    # Arsa için yapılan mimari ve finansal hesaplama senaryoları.
    create_feasibilities_sql = """
    CREATE TABLE IF NOT EXISTS Feasibilities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        land_id INTEGER,
        scenario_name TEXT,
        input_emsal REAL,
        calculated_total_insaat_m2 REAL,
        estimated_cost_total REAL,
        contractor_profit_prediction REAL,
        is_1_3_rule_compliant BOOLEAN,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (land_id) REFERENCES Lands (id) ON DELETE CASCADE
    );
    """

    try:
        cursor.execute(create_contacts_sq)
        cursor.execute(create_lands_sql)
        cursor.execute(create_zoning_memory_sql)
        cursor.execute(create_feasibilities_sql)
        conn.commit()
        print("[BASARILI] Tablolar oluşturuldu (Contacts, Lands, ZoningMemory, Feasibilities).")
    except sqlite3.Error as e:
        print(f"[HATA] Tablo oluşturma hatası: {e}")

def insert_dummy_data(conn):
    """Test için örnek veriler ekler."""
    cursor = conn.cursor()

    # Örnek Contact Ekleme
    contacts_data = [
        ('Ahmet Yılmaz', '05321112233', 'ahmet@example.com', 'Arsa Sahibi', 'Ciddi satıcı.'),
        ('Mehmet İnşaat', '05554443322', 'mehmet@insaat.com', 'Müteahhit', 'Bölgede aktif.'),
        ('Ayşe Emlak', '05443332211', 'ayse@emlak.com', 'Emlakçı', 'Portföyü geniş.')
    ]
    
    owner_id = None
    for contact in contacts_data:
        cursor.execute("""
            INSERT INTO Contacts (full_name, phone, email, role, notes) 
            VALUES (?, ?, ?, ?, ?)
        """, contact)
        if contact[0] == 'Ahmet Yılmaz':
            owner_id = cursor.lastrowid

    # Örnek Arsa Ekleme (Çanakkale/Merkez/Karacaören)
    if owner_id:
        land_sql = """
            INSERT INTO Lands (owner_id, city, district, neighborhood, ada, parsel, tapu_area_m2, status, map_image_path)
            VALUES (?, 'Çanakkale', 'Merkez', 'Karacaören', '111', '4', 540.50, 'Analiz Aşamasında', '/images/parsels/111_4.png')
        """
        cursor.execute(land_sql, (owner_id,))
        land_id = cursor.lastrowid

        # Örnek İmar Bilgisi Ekleme
        zoning_sql = """
            INSERT INTO ZoningMemory (district, neighborhood, zone_type, emsal_katsayisi, taks_orani, max_height, plan_note_ref)
            VALUES ('Merkez', 'Karacaören', 'Konut', 1.0, 0.40, '9.50m / 3 Kat', 'Çanakkale İmar Yönetmeliği Madde 14')
        """
        cursor.execute(zoning_sql)

        # Örnek Fizibilite Ekleme
        feasibility_sql = """
            INSERT INTO Feasibilities (land_id, scenario_name, input_emsal, calculated_total_insaat_m2, estimated_cost_total, contractor_profit_prediction, is_1_3_rule_compliant)
            VALUES (?, 'Senaryo A: Standart 3 Kat', 1.0, 648.0, 15000000.0, 7500000.0, 1)
        """
        cursor.execute(feasibility_sql, (land_id,))

    conn.commit()
    print("[BASARILI] Örnek veriler eklendi.")

def main():
    # Veritabanı dosyasını sıfırdan oluşturmak için varsa silelim (Temiz Başlangıç)
    if os.path.exists(DB_NAME):
        os.remove(DB_NAME)
        print(f"[BILGI] Eski '{DB_NAME}' dosyası silindi.")
    
    conn = create_connection()
    
    if conn is not None:
        create_tables(conn)
        insert_dummy_data(conn)
        
        # Doğrulama Sorgusu
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Contacts")
        print(f"\n[TEST] Kayıtlı Kişi Sayısı: {len(cursor.fetchall())}")
        
        cursor.execute("SELECT * FROM Lands")
        land = cursor.fetchone()
        print(f"[TEST] Kayıtlı Arsa: {land[3]}/{land[4]} - Ada: {land[5]} Parsel: {land[6]}")
        
        conn.close()
        print(f"\n[BASARILI] Tüm işlemler tamamlandı. '{DB_NAME}' kullanıma hazır.")
    else:
        print("[HATA] Veritabanı bağlantısı kurulamadı.")

if __name__ == '__main__':
    main()
