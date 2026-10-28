
import JVPAtOnePhoto from "../models/jvpAtOnePhoto.model.js";
import {
  uploadImage,
  deleteImage,
} from "../config/cloudinary.js";

export const getJVPAtOnePhotos = async (req, res, next) => {
  try {
    const photos = await JVPAtOnePhoto.find({ isActive: true })
      .sort({ createdAt: -1 })
      .select("-__v");

    return res.status(200).json({
      success: true,
      count: photos.length,
      photos,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadJVPAtOnePhoto = async (req, res, next) => {
  let uploadedPublicId;

  try {
    const { title, caption = "" } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a photo to upload.",
      });
    }

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Photo title is required.",
      });
    }

    const result = await uploadImage(req.file.buffer, {
      folder: "jvp-at-one",
    });

    uploadedPublicId = result.publicId;

    const photo = await JVPAtOnePhoto.create({
      title: title.trim(),
      caption: caption.trim(),
      publicId: result.publicId,
      secureUrl: result.secureUrl,
      format: result.format || "",
      bytes: result.bytes || 0,
      width: result.width || 0,
      height: result.height || 0,
      uploadedBy: req.user?._id || null,
    });

    return res.status(201).json({
      success: true,
      message: "Photo uploaded successfully.",
      photo,
    });
  } catch (error) {
    // Avoid leaving an orphaned Cloudinary image if saving fails.
    if (uploadedPublicId) {
      try {
        await deleteImage(uploadedPublicId);
      } catch (cleanupError) {
        console.error(
          "Cloudinary cleanup failed:",
          cleanupError.message
        );
      }
    }

    next(error);
  }
};

export const deleteJVPAtOnePhoto = async (req, res, next) => {
  try {
    const photo = await JVPAtOnePhoto.findById(req.params.id);

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: "Photo not found.",
      });
    }

    await deleteImage(photo.publicId);
    await JVPAtOnePhoto.findByIdAndDelete(photo._id);

    return res.status(200).json({
      success: true,
      message: "Photo deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
