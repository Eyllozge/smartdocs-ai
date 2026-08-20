from fastapi import FastAPI
from .database import Base, engine
from .routers import auth, documents

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartDocs AI")

app.include_router(auth.router)
app.include_router(documents.router)

@app.get("/")
def root():
    return {"status": "ok"}