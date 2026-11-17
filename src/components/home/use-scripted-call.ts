'use client';

import { useEffect, useState } from 'react';
import { ScriptedCallPlayer, idleCall } from '@/lib/scripted-call-player';

export function useScriptedCall() {
  const [playback, setPlayback] = useState(idleCall);
  const [player] = useState(() => new ScriptedCallPlayer(setPlayback));
  useEffect(() => () => player.dispose(), [player]);
  return { playback, player };
}

export const callTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
