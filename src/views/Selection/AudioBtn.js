import IconButton from "@mui/material/IconButton";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { useState } from "react";
import { useAudio } from "../../hooks/Audio";
import { canSpeak, speak } from "../../libs/speech";
import queryString from "query-string";

   
                
  
                        
                                          
   
export function AudioBtn({ src }) {
                                
  const { error, ready, playing, onPlay } = useAudio(src);

                                
  if (error || !ready) {
    return (
      <IconButton disabled size="small">
        <VolumeUpIcon fontSize="inherit" />
      </IconButton>
    );
  }

                                 
  if (playing) {
    return (
      <IconButton color="primary" size="small">
        <VolumeUpIcon fontSize="inherit" />
      </IconButton>
    );
  }

                               
  return (
    <IconButton onClick={onPlay} size="small">
      <VolumeUpIcon fontSize="inherit" />
    </IconButton>
  );
}

   
                  
  
                        
                                       
                                                                 
                                             
   
export function BaiduAudioBtn({ text, lan = "uk", spd = 3 }) {
  if (!text) return null;

                             
  const src = `https://fanyi.baidu.com/gettts?${queryString.stringify({ lan, text, spd })}`;
  return <AudioBtn src={src} />;
}

export function BrowserTtsBtn({ text, lang = "en-US" }) {
  const [speaking, setSpeaking] = useState(false);

  if (!text?.trim() || !canSpeak()) return null;

  const handleSpeak = () => {
    if (speaking) return;

                                           
    setSpeaking(true);
    const started = speak(text, lang, {
      onEnd: () => setSpeaking(false),
    });

    if (!started) {
      setSpeaking(false);
    }
  };

  return (
    <IconButton
      color={speaking ? "primary" : "default"}
                                
      onClick={speaking ? undefined : handleSpeak}
      size="small"
      sx={{ ml: 0.5, verticalAlign: "middle" }}
    >
      <VolumeUpIcon fontSize="inherit" />
    </IconButton>
  );
}
