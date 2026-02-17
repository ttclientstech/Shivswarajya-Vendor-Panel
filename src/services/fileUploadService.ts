const CLOUDINARY_CLOUD_NAME = 'dfmlvblds';
const CLOUDINARY_UPLOAD_PRESET = 'shivswarajya_marketplace';
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

export const fileUploadService = {
    uploadFile: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

        try {
            const response = await fetch(CLOUDINARY_API_URL, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to upload file to Cloudinary');
            }

            const data = await response.json();
            console.log('Cloudinary response data:', data);
            return data.secure_url;
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }
};
