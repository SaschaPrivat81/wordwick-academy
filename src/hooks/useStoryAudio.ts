import { useEffect, useState } from 'react';

export interface StoryAudioRecord {
  storyId: string;
  audioPath: string;
  audioText?: string;
  audioVoice?: string;
  audioSource?: string;
  updatedAt?: string;
}

export function useStoryAudio() {
  const [storyAudio, setStoryAudio] = useState<Record<string, StoryAudioRecord>>({});

  useEffect(() => {
    fetch('/api/story-audio', { credentials: 'include' })
      .then(response => response.ok ? response.json() : [])
      .then((rows: StoryAudioRecord[]) => {
        setStoryAudio(Object.fromEntries(rows.map(row => [row.storyId, row])));
      })
      .catch(() => setStoryAudio({}));
  }, []);

  return storyAudio;
}
