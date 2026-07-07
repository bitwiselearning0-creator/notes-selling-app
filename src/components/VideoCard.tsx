import React from 'react';
import { Play } from 'lucide-react';
import type { Playlist } from '../lib/supabase';

interface VideoCardProps {
  playlist: Playlist;
}

export const VideoCard: React.FC<VideoCardProps> = ({ playlist }) => {
  const watchUrl = `https://www.youtube.com/playlist?list=${playlist.playlistId}`;

  return (
    <div className="video-card glass-card">
      <div className="video-thumbnail-wrapper">
        <img 
          src={playlist.thumbnailUrl} 
          alt={playlist.title} 
          className="video-thumbnail"
          loading="lazy"
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
