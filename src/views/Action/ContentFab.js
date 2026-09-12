import Box from "@mui/material/Box";
import { keyframes } from "@emotion/react";
import ThemeProvider from "../../hooks/Theme";
import Draggable from "./Draggable";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { SettingProvider } from "../../hooks/Setting";
import { MSG_TRANS_TOGGLE } from "../../config";
import { BRAND_GLOW, BRAND_GLOW_STRONG } from "../../config/brand";
import { LOGO_PNG_BASE64 } from "../../components/Logo/icon.base64";
import useWindowSize from "../../hooks/WindowSize";
import { useFullscreenDetect } from "../../hooks/useFullscreenDetect";

                               
const sunPulse = keyframes`
  0% { box-shadow: ${BRAND_GLOW}, 0 0 0 0 rgba(90, 200, 250, 0.35); }
  70% { box-shadow: ${BRAND_GLOW}, 0 0 0 10px rgba(90, 200, 250, 0); }
  100% { box-shadow: ${BRAND_GLOW}, 0 0 0 0 rgba(90, 200, 250, 0); }
`;

   
                                       
                    
   
export default function ContentFab({
  fabConfig: { x: fabX, y: fabY, edge: fabEdge } = {},
  processActions,
}) {
  const fabWidth = 40;                 
  const windowSize = useWindowSize();
                                            
  const draggedRef = useRef(false);
  const [showFab, setShowFab] = useState(true);
  const { isVideoFullscreen } = useFullscreenDetect();

  useEffect(() => {
    setShowFab(!isVideoFullscreen);
  }, [isVideoFullscreen]);

             
  const handleStart = useCallback(() => {
    draggedRef.current = false;
  }, []);

                                  
  const handleMove = useCallback(() => {
    draggedRef.current = true;
  }, []);

                                 
                        
  const handleClick = useCallback(() => {
    if (!draggedRef.current) {
      processActions({ action: MSG_TRANS_TOGGLE });
    }
  }, [processActions]);

                                           
  const fabProps = useMemo(
    () => ({
      windowSize,
      width: fabWidth,
      height: fabWidth,
      left: fabX ?? windowSize.w - fabWidth,
      top: fabY ?? windowSize.h - fabWidth,
      edge: fabEdge,
    }),
    [windowSize, fabWidth, fabX, fabY, fabEdge]
  );

  return (
    <SettingProvider context="fab">
      <ThemeProvider>
        <Draggable
          key="fab"
          snapEdge              
          {...fabProps}
          show={showFab}
          onStart={handleStart}
          onMove={handleMove}
          handler={
                                      
            <Box
              component="img"
              src={LOGO_PNG_BASE64}
              alt="ParallelText"
              draggable={false}
              onClick={handleClick}
              sx={{
                width: fabWidth,
                height: fabWidth,
                borderRadius: "12px",
                cursor: "pointer",
                userSelect: "none",
                boxShadow: BRAND_GLOW,
                animation: `${sunPulse} 3s ease-out infinite`,
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                "&:hover": {
                  transform: "scale(1.08)",
                  boxShadow: BRAND_GLOW_STRONG,
                },
              }}
            />
          }
        />
      </ThemeProvider>
    </SettingProvider>
  );
}
