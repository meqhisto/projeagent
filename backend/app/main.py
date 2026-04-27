from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel

import shutil
import os
# from .rag import KnowledgeBase (Moved to lazy load)
# from .vision import VisionEngine (Moved to lazy load)

from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="ParselMonitor Engine", version="1.0.0")

# CORS Configuration - Production-safe
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Specific origins only
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Content-Type", "Authorization"],
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

@app.get("/health")
def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "service": "backend",
        "version": "1.0.0",
        "timestamp": os.getenv("TIMESTAMP", "N/A")
    }

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

# --- RAG ENDPOINTS (DISABLED - Heavy dependencies removed) ---
# Uncomment and install chromadb, sentence-transformers if needed

# @app.post("/rag/upload")
# async def upload_document(file: UploadFile = File(...)):
#     raise HTTPException(status_code=501, detail="RAG features disabled in minimal build")

# @app.post("/rag/query")
# def query_knowledge_base(req: QueryRequest):
#     raise HTTPException(status_code=501, detail="RAG features disabled in minimal build")

# @app.post("/rag/feasibility")
# def generate_feasibility(req: FeasibilityRequest):
#     raise HTTPException(status_code=501, detail="RAG features disabled in minimal build")

# --- VISION ENDPOINTS (DISABLED - Heavy dependencies removed) ---

# @app.post("/vision/analyze")
# async def analyze_image(file: UploadFile = File(...)):
#     raise HTTPException(status_code=501, detail="Vision features disabled in minimal build")

# --- STRICT CALCULATION (KEPT) ---

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
