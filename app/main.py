from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routers import auth, documents, chat # Tek bir satırda hepsini içe aktardık

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartDocs AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(chat.router) 

@app.get("/")
def root():
    return {"status": "ok"}