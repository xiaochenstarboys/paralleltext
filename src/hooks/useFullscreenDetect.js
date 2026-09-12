import { useEffect, useState } from "react";

function getFullscreenElement() {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement ||
    null
  );
}

function isVideoFullscreenElement(element) {
  if (!element) {
    return false;
  }

  if (element.tagName === "VIDEO") {
    return true;
  }

  return Boolean(element.querySelector?.("video"));
}

   
                      
                                 
                          
                                            
   
export function useFullscreenDetect() {
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const element = getFullscreenElement();
      setIsVideoFullscreen(isVideoFullscreenElement(element));
    };

    handleFullscreenChange();

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "msfullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  return { isVideoFullscreen };
}
