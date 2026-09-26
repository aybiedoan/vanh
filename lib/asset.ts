export const BASE_PATH = process.env.NODE_ENV === 'production' ? '/vanh' : ''

// Tự động đổi đuôi ảnh sang .webp (khớp với script compress_images.py).
// Chỉ áp dụng cho ảnh — không đụng tới video (.mp4), audio (.mp3), hay .webp sẵn có.
const IMAGE_EXT_RE = /\.(jpe?g|png)$/i

export const asset = (p: string) => `${BASE_PATH}${p.replace(IMAGE_EXT_RE, '.webp')}`
