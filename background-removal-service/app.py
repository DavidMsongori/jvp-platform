import asyncio
import io
import os
import threading

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import Response
from PIL import Image
from rembg import new_session, remove


# ==========================================================
# CONFIGURATION
# ==========================================================

MAX_FILE_SIZE = 5 * 1024 * 1024

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}

MODEL_NAME = os.getenv(
    "BACKGROUND_REMOVAL_MODEL",
    "isnet-general-use",
)


# ==========================================================
# MODEL STATE
# ==========================================================

session = None

session_lock = threading.Lock()

model_loading = False


# ==========================================================
# MODEL LOADER
# ==========================================================

def get_model_session():
    """
    Lazily load the rembg model.

    The FastAPI server is allowed to start immediately.
    The model is downloaded/loaded only when the first
    background-removal request arrives.
    """

    global session
    global model_loading

    if session is not None:
        return session

    with session_lock:
        # Another request may have loaded it while
        # this request was waiting for the lock.
        if session is not None:
            return session

        model_loading = True

        try:
            print(
                f"Loading background-removal model: "
                f"{MODEL_NAME}",
                flush=True,
            )

            session = new_session(
                MODEL_NAME
            )

            print(
                "Background-removal model loaded successfully.",
                flush=True,
            )

            return session

        except Exception as error:
            print(
                "Unable to load background-removal model:",
                str(error),
                flush=True,
            )

            session = None

            raise

        finally:
            model_loading = False


# ==========================================================
# FASTAPI APPLICATION
# ==========================================================

app = FastAPI(
    title="JVP Background Removal Service",
    version="1.1.0",
)


# ==========================================================
# ROOT
# ==========================================================

@app.get("/")
async def root():
    return {
        "success": True,
        "message": (
            "JVP background-removal service "
            "is running."
        ),
        "model": MODEL_NAME,
        "modelLoaded": session is not None,
    }


# ==========================================================
# HEALTH CHECK
# ==========================================================

@app.get("/health")
async def health():
    return {
        "success": True,
        "service": "background-removal",
        "status": "running",
        "model": MODEL_NAME,
        "modelLoaded": session is not None,
        "modelLoading": model_loading,
    }


# ==========================================================
# REMOVE BACKGROUND
# ==========================================================

@app.post("/remove-background")
async def remove_background(
    image: UploadFile = File(...)
):
    # ------------------------------------------------------
    # Validate MIME type
    # ------------------------------------------------------

    if (
        image.content_type
        not in ALLOWED_CONTENT_TYPES
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Only JPG, JPEG, PNG and "
                "WebP images are allowed."
            ),
        )

    # ------------------------------------------------------
    # Read uploaded image
    # ------------------------------------------------------

    image_bytes = await image.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail=(
                "The uploaded image is empty."
            ),
        )

    if (
        len(image_bytes)
        > MAX_FILE_SIZE
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "The uploaded image cannot "
                "exceed 5 MB."
            ),
        )

    # ------------------------------------------------------
    # Validate image bytes
    # ------------------------------------------------------

    try:
        with Image.open(
            io.BytesIO(
                image_bytes
            )
        ) as source_image:
            source_image.verify()

    except Exception:
        raise HTTPException(
            status_code=400,
            detail=(
                "The uploaded file is not "
                "a valid image."
            ),
        )

    try:
        # --------------------------------------------------
        # Load model lazily
        # --------------------------------------------------

        try:
            model_session = (
                await asyncio.to_thread(
                    get_model_session
                )
            )

        except Exception as error:
            print(
                "Model initialization failed:",
                str(error),
                flush=True,
            )

            raise HTTPException(
                status_code=503,
                detail=(
                    "The background-removal "
                    "model could not be loaded."
                ),
            ) from error

        # --------------------------------------------------
        # Run background removal outside event loop
        # --------------------------------------------------

        transparent_bytes = (
            await asyncio.to_thread(
                lambda: remove(
                    image_bytes,
                    session=model_session,
                    force_return_bytes=True,
                )
            )
        )

        if not transparent_bytes:
            raise HTTPException(
                status_code=500,
                detail=(
                    "The model returned an "
                    "empty image."
                ),
            )

        # --------------------------------------------------
        # Return transparent PNG
        # --------------------------------------------------

        return Response(
            content=transparent_bytes,
            media_type="image/png",
            headers={
                "Content-Disposition": (
                    'inline; filename="'
                    'participant-cutout.png"'
                ),
                "Cache-Control":
                    "no-store",
            },
        )

    except HTTPException:
        raise

    except Exception as error:
        print(
            "Background removal failed:",
            str(error),
            flush=True,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to remove the image "
                "background."
            ),
        ) from error