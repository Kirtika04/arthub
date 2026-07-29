const backendOrigin = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

export const resolveImageUrl = (imagePath, fallback = '') => {
    if (!imagePath) return fallback;
    if (/^https?:\/\//i.test(imagePath) || imagePath.startsWith('data:')) return imagePath;
    const normalizedPath = imagePath.replace(/^\/?uploads\//, '').replace(/^\//, '');
    return `${backendOrigin}/uploads/${normalizedPath}`;
};
