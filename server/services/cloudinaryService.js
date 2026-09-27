import cloudinaryPkg from 'cloudinary';
const cloudinary = cloudinaryPkg.v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a PDF buffer to Cloudinary and returns the secure URL.
 * @param {Buffer} buffer - The PDF file buffer to upload.
 * @returns {Promise<string>} The secure URL of the uploaded PDF.
 */
const uploadPdfBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.warn('Cloudinary is not configured. Skipping upload and returning empty URL.');
      return resolve('');
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        format: 'pdf'
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return resolve(''); // Resolve with empty string instead of rejecting to prevent breaking generation
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
};

export default {
  uploadPdfBuffer,
};
