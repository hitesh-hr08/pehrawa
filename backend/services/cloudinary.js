const cloudinary = require("cloudinary").v2;
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function upload(filePath, folder) {
  if (!filePath) throw new Error("File path required");
  const result = await cloudinary.uploader.upload(filePath, {
    folder: folder || "pehrawa",
    resource_type: "image",
    quality: "auto:good",
    fetch_format: "auto",
    transformation: [
      { width: 1200, height: 1600, crop: "limit" }
    ]
  });
  fs.unlink(filePath, function () {});
  return { url: result.secure_url, public_id: result.public_id };
}

async function destroy(publicId) {
  if (!publicId) return;
  return cloudinary.uploader.destroy(publicId);
}

function publicIdFromUrl(url) {
  if (!url || !url.includes("cloudinary")) return null;
  const parts = url.split("/");
  const last = parts[parts.length - 1];
  const folderIndex = parts.indexOf("pehrawa");
  if (folderIndex === -1) return "pehrawa/" + last.split(".")[0];
  return parts.slice(folderIndex, parts.length - 1).join("/") + "/" + last.split(".")[0];
}

module.exports = { upload, destroy, publicIdFromUrl };
