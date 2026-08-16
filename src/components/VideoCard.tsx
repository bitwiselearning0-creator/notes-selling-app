import React, { useState } from 'react';
import { Play } from 'lucide-react';
import type { Playlist } from '../lib/dbService';

interface VideoCardProps {
  playlist: Playlist;
}

// Fallback high-resolution tech & course cover images for subjects
const SUBJECT_THUMBNAILS: Record<string, string> = {
  'operating system': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
  'tafl': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
  'theory of automata and formal languages': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
  'java': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
  'dstl': 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80',
  'discrete structures & theory of logic': 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80',
  'data structure': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
  'data structures': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
  'engineering physics': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80',
  'cyber security': 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
  'python programming': 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=80',
  'coa': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
  'computer organization & architecture': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80'
};

const DEFAULT_FALLBACK_THUMBNAIL = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80';

export const VideoCard: React.FC<VideoCardProps> = ({ playlist }) => {
  const rawId = (playlist?.playlistId || (playlist as any)?.youtube_url || (playlist as any)?.youtubeUrl || '').trim();
  const rawThumb = (playlist?.thumbnailUrl || (playlist as any)?.thumbnail || '').trim();

  const [imgSrc, setImgSrc] = useState<string>(() => {
    let url = rawThumb;
    if (!url || url.includes('/vi/PL') || url.includes('/vi_webp/PL')) {
      const subjectKey = playlist?.subject ? playlist.subject.toLowerCase().trim() : '';
      return SUBJECT_THUMBNAILS[subjectKey] || DEFAULT_FALLBACK_THUMBNAIL;
    }
    return url || (SUBJECT_THUMBNAILS[playlist?.subject?.toLowerCase().trim() || ''] || DEFAULT_FALLBACK_THUMBNAIL);
  });

  const watchUrl = rawId.startsWith('http')
    ? rawId
    : rawId.startsWith('search_')
      ? `https://www.youtube.com/results?search_query=AKTU+${encodeURIComponent(playlist?.subject || '')}+Full+Course+Playlist`
      : rawId
        ? `https://www.youtube.com/playlist?list=${rawId}`
        : `https://www.youtube.com/results?search_query=AKTU+${encodeURIComponent(playlist?.subject || '')}+Full+Course+Playlist`;

  const handleImgError = () => {
    const subjectKey = playlist?.subject ? playlist.subject.toLowerCase().trim() : '';
    const fallback = SUBJECT_THUMBNAILS[subjectKey] || DEFAULT_FALLBACK_THUMBNAIL;
    if (imgSrc !== fallback) {
      setImgSrc(fallback);
    }
  };

  return (
    <div className="video-card glass-card">
      <div className="video-thumbnail-wrapper">
        <img 
          src={imgSrc} 
          alt={playlist.title} 
          className="video-thumbnail"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={handleImgError}
        />
        <div className="video-overlay">
          <a 
            href={watchUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="play-btn-circle"
            aria-label="Play video playlist"
          >
            <Play size={24} fill="var(--color-yellow)" color="var(--color-yellow)" />
          </a>
        </div>
      </div>
      <div className="video-info">
        <span className="subject-tag">{playlist.subject}</span>
        <h3 className="video-title">{playlist.title}</h3>
        <a 
          href={watchUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="watch-link btn-secondary w-full"
          style={{ justifyContent: 'center', marginTop: '12px' }}
        >
          Watch on YouTube
        </a>
      </div>
    </div>
  );
};
