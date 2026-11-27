/**
 * Converts any YouTube URL to the embed format
 * Supports: 
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://youtube.com/shorts/VIDEO_ID
 */
export function convertToYouTubeEmbedUrl(url: string): string {
  if (!url) return '';
  
  // Already in embed format
  if (url.includes('/embed/')) {
    return url;
  }
  
  let videoId = '';
  
  // Standard YouTube URL: youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) {
    videoId = watchMatch[1];
  }
  
  // Short URL: youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) {
    videoId = shortMatch[1];
  }
  
  // Shorts URL: youtube.com/shorts/VIDEO_ID
  const shortsMatch = url.match(/shorts\/([^?&]+)/);
  if (shortsMatch) {
    videoId = shortsMatch[1];
  }
  
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  // Return original URL if we can't parse it
  return url;
}

/**
 * Extracts the video ID from any YouTube URL
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  // From embed URL
  const embedMatch = url.match(/embed\/([^?&]+)/);
  if (embedMatch) return embedMatch[1];
  
  // From watch URL
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return watchMatch[1];
  
  // From short URL
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return shortMatch[1];
  
  // From shorts URL
  const shortsMatch = url.match(/shorts\/([^?&]+)/);
  if (shortsMatch) return shortsMatch[1];
  
  return null;
}
