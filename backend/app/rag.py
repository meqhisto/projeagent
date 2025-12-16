import os
import fitz  # PyMuPDF
import chromadb
from chromadb.utils import embedding_functions

# Initialize ChromaDB Client (Persistent)
chroma_client = chromadb.PersistentClient(path="./backend/db")

# Use a default embedding model (all-MiniLM-L6-v2 is standard and efficient)
default_ef = embedding_functions.DefaultEmbeddingFunction()

# Get or create collection
collection = chroma_client.get_or_create_collection(name="zoning_regulations", embedding_function=default_ef)

class KnowledgeBase:
    """
    RAG Engine: Handles document ingestion and retrieval.
    """

    @staticmethod
    def extract_text_from_pdf(pdf_path: str) -> str:
        """
        Extracts raw text from a PDF file.
        """
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        return text

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
        """
        Simple overlapping chunking strategy.
        """
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunks.append(text[start:end])
            start = end - overlap
        return chunks

    @staticmethod
    def ingest_document(pdf_path: str, source_name: str):
        """
        Reads PDF, chunks it, and stores vectors in ChromaDB.
        """
        print(f"Ingesting: {source_name}...")
        text = KnowledgeBase.extract_text_from_pdf(pdf_path)
        chunks = KnowledgeBase.chunk_text(text)
        
        ids = [f"{source_name}_{i}" for i in range(len(chunks))]
        metadatas = [{"source": source_name, "chunk_id": i} for i in range(len(chunks))]
        
        collection.add(
            documents=chunks,
            metadatas=metadatas,
            ids=ids
        )
        print(f"Ingestion complete. {len(chunks)} chunks added.")
        return len(chunks)

    @staticmethod
    def query(question: str, n_results: int = 3) -> list[str]:
        """
        Searches the knowledge base for relevant chunks.
        """
        results = collection.query(
            query_texts=[question],
            n_results=n_results
        )
        
        # Flatten results (results['documents'] is a list of lists)
        if results['documents']:
            return results['documents'][0] 
        return []

    # Placeholder for actual LLM Generation
    # In a full production app, this would call OpenAI/Anthropic with the retrieved context.
    @staticmethod
    def generate_answer(question: str) -> str:
        context_chunks = KnowledgeBase.query(question)
        context_text = "\n\n".join(context_chunks)
        
        if not context_text:
            return "İlgili yönetmelik maddesi bulunamadı."

        return f"""
*** BULUNAN YÖNETMELİK MADDELERİ (RAG Context) ***
{context_text}

(Not: Şu an LLM API anahtarı bağlı değil. Yukarıdaki metin Vektör Veritabanından sorunuza en uygun parçalar olarak çekildi.)
"""

    @staticmethod
    def generate_feasibility_report(data: dict) -> str:
        """
        Generates a detailed feasibility report using the 'Developer Math' logic.
        """
        prompt = f"""
Aşağıdaki parsel verileri ve Plan Notları referanslarına göre bana detaylı bir inşaat alanı dökümü hazırla.

### GİRDİ VERİLERİ:
- Arsa Alanı: {data.get('arsa_m2')} m²
- Emsal (KAKS): {data.get('emsal_orani')}
- TAKS (Taban Oturumu): {data.get('taks_orani')}
- Kat Adedi: {data.get('kat_adedi')}
- Çekme Mesafeleri: Ön {data.get('on_cekme', '-')}, Yan {data.get('yan_cekme', '-')}, Arka {data.get('arka_cekme', '-')}

### HESAPLAMA ADIMLARI (Müteahhit Matematiği):
1. YASAL EMSAL: Arsa Alanı x Emsal.
2. TABAN OTURUMU: Arsa x TAKS (veya çekme mesafesi kısıtı).
3. BONUSLAR: Balkonlar, Çatı Piyesi, Bodrumlar, Ortak Alanlar (%30 ekle).

### ÇIKTI FORMATI:
{{
  "yasal_emsal_hakki": "...",
  "taban_oturumu": "...",
  "toplam_kat_sayisi": "...",
  "emsal_harici_kazanimlar": {{
     "balkonlar_toplam": "...",
     "ortak_alanlar": "...",
     "bodrum_depo_vb": "..."
  }},
  "toplam_insaat_alani_brut": "...",
  "ozet_yorum": "..."
}}
"""
        # In a real scenario, this 'prompt' would be sent to GPT-4.
        # Here, we will perform a mock 'Deterministic' calculation to simulate the result for the user.
        
        arsa = float(data.get('arsa_m2', 0))
        emsal = float(data.get('emsal_orani', 0))
        taks = float(data.get('taks_orani', 0))
        kat = float(data.get('kat_adedi', 0))
        
        yasal_emsal = arsa * emsal
        taban_oturumu = arsa * taks
        
        # Determine strict footprint (simplified logic)
        calculated_taban = yasal_emsal / kat if kat > 0 else taban_oturumu
        final_taban = min(taban_oturumu, calculated_taban)
        
        # Bonuses (Developer Math)
        common_area_factor = 0.30 # %30 bonus
        balcony_factor = 0.10 # %10 bonus
        
        total_brut = yasal_emsal * (1 + common_area_factor + balcony_factor)
        
        # Mock JSON Response simulating an LLM
        import json
        result = {
            "yasal_emsal_hakki": f"{yasal_emsal:.2f} m²",
            "taban_oturumu": f"{final_taban:.2f} m²",
            "toplam_kat_sayisi": str(kat),
            "emsal_harici_kazanimlar": {
                "balkonlar_toplam": f"{(yasal_emsal * balcony_factor):.2f} m² (~%10)",
                "ortak_alanlar": f"{(yasal_emsal * common_area_factor):.2f} m² (Yangın merdiveni, asansör, vb.)",
                "bodrum_depo_vb": "Yönetmeliğe göre değişir (Analiz edilmeli)"
            },
            "toplam_insaat_alani_brut": f"{total_brut:.2f} m² (Satılabilir Tahmini)",
            "ozet_yorum": "Hesaplama 'Müteahhit Matematiği' modülü ile simüle edilmiştir. Gerçek rapor için LLM API anahtarı gereklidir."
        }
        
        return json.dumps(result, indent=2, ensure_ascii=False)
