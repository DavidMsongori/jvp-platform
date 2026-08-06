import io
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import Response
from PIL import Image
from rembg import new_session, remove


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

session = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global session

    print(
        f"Loading background-removal model: "
        f"{MODEL_NAME}"
    )

    session = new_session(
        MODEL_NAME
    )

    print(
        "Background-removal model loaded."
    )

    yield

    session = None


app = FastAPI(
    title="JVP Background Removal Service",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/")
async def root():
    return {
        "success": True,
        "message": (
            "JVP background-removal service "
            "is running."
        ),
        "model": MODEL_NAME,
    }


@app.get("/health")
async def health():
    return {
        "success": True,
        "service": "background-removal",
        "modelLoaded": session is not None,
        "model": MODEL_NAME,
    }


@app.post("/remove-background")
async def remove_background(
    image: UploadFile = File(...)
):
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

    image_bytes = await image.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="The uploaded image is empty.",
        )

    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=(
                "The uploaded image cannot "
                "exceed 5 MB."
            ),
        )

    if session is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "The background-removal model "
                "is not ready."
            ),
        )

    try:
        # Validate that the uploaded bytes are
        # actually a readable image.
        with Image.open(
            io.BytesIO(image_bytes)
        ) as source_image:
            source_image.verify()

        transparent_bytes = remove(
            image_bytes,
            session=session,
            force_return_bytes=True,
        )

        if not transparent_bytes:
            raise HTTPException(
                status_code=500,
                detail=(
                    "The model returned an "
                    "empty image."
                ),
            )

        return Response(
            content=transparent_bytes,
            media_type="image/png",
            headers={
                "Content-Disposition": (
                    'inline; filename="'
                    'participant-cutout.png"'
                ),
                "Cache-Control": "no-store",
            },
        )

    except HTTPException:
        raise

    except Exception as error:
        print(
            "Background removal failed:",
            str(error),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to remove the image "
                "background."
            ),
        ) from error