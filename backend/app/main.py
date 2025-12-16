from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel

import shutil
import os
# from .rag import KnowledgeBase (Moved to lazy load)
# from .vision import VisionEngine (Moved to lazy load)

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ParselMonitor Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, set to ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ... (Previous Models) ...
class CalculationRequest(BaseModel):
    parcel_area: float
    ks: float = 0
    taks: float = 0

class CalculationResponse(BaseModel):
    total_construction_area: float
    ground_floor_area: float
    note: str

class QueryRequest(BaseModel):
    question: str

@app.get("/")
def read_root():
    return {"status": "Engine Running", "mode": "Hybrid"}

# ... (Previous Calculate Endpoint) ...
@app.post("/calculate/basic", response_model=CalculationResponse)
def calculate_basic(req: CalculationRequest):
    """
    Performs strict mathematical calculation for zoning parameters.
    """
    try:
        from .calculator import Calculator
        total_area = Calculator.calculate_insaat_alani(req.parcel_area, req.ks)
        ground_area = Calculator.calculate_taban_alani(req.parcel_area, req.taks)
        
        return {
            "total_construction_area": total_area,
            "ground_floor_area": ground_area,
            "note": "Calculated via Python Engine"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- RAG ENDPOINTS ---

@app.post("/rag/upload")
async def upload_document(file: UploadFile = File(...)):
    try:
        from .rag import KnowledgeBase
    except ImportError:
        raise HTTPException(status_code=503, detail="RAG Engine could not be loaded.")

    try:
        # Save temp file
        if not os.path.exists("temp_uploads"):
            os.makedirs("temp_uploads")
            
        file_path = f"temp_uploads/{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Ingest
        num_chunks = KnowledgeBase.ingest_document(file_path, source_name=file.filename)
        
        # Cleanup
        os.remove(file_path)
        
        return {"status": "success", "chunks_added": num_chunks, "filename": file.filename}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rag/query")
def query_knowledge_base(req: QueryRequest):
    try:
        from .rag import KnowledgeBase
    except ImportError:
        raise HTTPException(status_code=503, detail="RAG Engine could not be loaded.")
        
    answer = KnowledgeBase.generate_answer(req.question)
    return {"answer": answer}

class FeasibilityRequest(BaseModel):
    arsa_m2: float
    emsal_orani: float
    taks_orani: float
    kat_adedi: float
    on_cekme: str = "-"
    yan_cekme: str = "-"
    arka_cekme: str = "-"

@app.post("/rag/feasibility")
def generate_feasibility(req: FeasibilityRequest):
    try:
        from .rag import KnowledgeBase
    except ImportError:
        raise HTTPException(status_code=503, detail="RAG Engine could not be loaded.")
    
    report_json = KnowledgeBase.generate_feasibility_report(req.dict())
    return {"report": report_json}

# --- VISION ENDPOINTS ---

@app.post("/vision/analyze")
async def analyze_image(file: UploadFile = File(...)):
    try:
        from .vision import VisionEngine
    except ImportError:
        raise HTTPException(status_code=503, detail="Vision Engine could not be loaded.")

    try:
        # Save temp file
        if not os.path.exists("temp_uploads"):
            os.makedirs("temp_uploads")
            
        file_path = f"temp_uploads/{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Analyze
        text = VisionEngine.extract_text_from_image(file_path)
        
        # Cleanup
        os.remove(file_path)
        
        return {"status": "success", "extracted_text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class StrictCalculationRequest(BaseModel):
    arsa_m2: float
    emsal: float
    kat_karsiligi_orani: float
    ortalama_daire_brutu: float = 100
    insaat_maliyeti_m2: float
    satis_fiyati_m2: float
    bonus_factor: float = 1.30
    kat_adedi: int = 5

@app.post("/calculate/strict")
def calculate_strict(req: StrictCalculationRequest):
    """
    Exposes the robust ConstructionCalculator logic.
    """
    try:
        from .calculator import ConstructionCalculator
        
        calc = ConstructionCalculator(
            arsa_m2=req.arsa_m2,
            emsal=req.emsal,
            kat_karsiligi_orani=req.kat_karsiligi_orani,
            ortalama_daire_brutu=req.ortalama_daire_brutu,
            insaat_maliyeti_m2=req.insaat_maliyeti_m2,
            satis_fiyati_m2=req.satis_fiyati_m2,
            bonus_factor=req.bonus_factor,
            kat_adedi=req.kat_adedi
        )
        
        report = calc.get_report()
        return report

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
