export const fileUploadService = {
    uploadFile: async (file: File): Promise<string> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Return a dummy URL based on file type for visualization
        // In a real app, this would be the URL returned by the server after upload
        return URL.createObjectURL(file);
    }
};
