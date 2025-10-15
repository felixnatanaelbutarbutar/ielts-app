# backend_app/deps.py
import os
from dotenv import load_dotenv   # ← tambah
load_dotenv()                    # ← pastikan env ter-load di modul ini

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

security = HTTPBearer()

# HS256 saja karena proxy sudah re-sign HS256
ALGORITHMS = ["HS256"]
SECRET_KEY = os.getenv("NEXTAUTH_SECRET", "changeme")

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    token = credentials.credentials
    try:
        # debug: cek prefix secret agar yakin sama
        # print("BACKEND SECRET prefix:", (SECRET_KEY or "")[:8])

        payload = jwt.decode(token, SECRET_KEY, algorithms=ALGORITHMS)
        user_id = payload.get("sub") or payload.get("email")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        return str(user_id)
    except JWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid or expired token: {e}")
