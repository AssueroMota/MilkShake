import axios from "axios";

const CLOUD_NAME = "dld3mzmbq"; // o seu
const UPLOAD_PRESET = "milkshake_unsigned"; // o nome EXATO do preset

export async function uploadImage(file, folder = "categories") {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  try {
    const res = await axios.post(url, formData);
    return {
      url: res.data.secure_url,
      publicId: res.data.public_id,
    };
  } catch (err) {
    console.error("❌ Erro Cloudinary:", err);
    throw err;
  }
}
