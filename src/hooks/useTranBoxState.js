import { useState, useEffect, useRef } from "react";
import { limitNumber } from "../libs/utils";
import { isMobile } from "../libs/mobile";
import { debouncePutTranBox, getTranBox } from "../libs/storage";
import { isIframe } from "../libs/iframe";
import {
  getMaxTranBoxContentWidth,
  getMaxTranBoxContentHeight,
  getMaxTranBoxX,
  getMaxTranBoxY,
  getTranBoxOuterWidth,
  getTranBoxOuterHeight,
} from "../libs/tranboxPosition";

   
                             
                                         
                                             
                                                 
   
function clampTranBoxBounds(size, position) {
  const nextW = Math.min(size.w, getMaxTranBoxContentWidth());
  const nextH = Math.min(size.h, getMaxTranBoxContentHeight());

  return {
    size: {
      w: nextW,
      h: nextH,
    },
    position: {
      x: limitNumber(position.x, 0, getMaxTranBoxX(nextW)),
      y: limitNumber(position.y, 0, getMaxTranBoxY(nextH)),
    },
  };
}

   
                               
  
                           
                                                                                                          
                                                                      
                                                      
                                                                       
   
export default function useTranBoxState(tranboxSetting) {
                     
  const {
    simpleStyle: initSimpleStyle = false,
    hideClickAway: initHideClickAway = false,
    followSelection: initFollowMouse = false,
    boxOffsetX = 0,
    boxOffsetY = 10,
  } = tranboxSetting;

                                                                          
  const maxBoxWidth = getMaxTranBoxContentWidth();
  const defaultBoxWidth =
    isMobile || initSimpleStyle
      ? 400
      : limitNumber(window.innerWidth, 400, 800);
  const boxWidth = Math.min(defaultBoxWidth, maxBoxWidth);
                                                           
  const maxBoxHeight = getMaxTranBoxContentHeight();
  const defaultBoxHeight =
    isMobile || initSimpleStyle ? 200 : limitNumber(maxBoxHeight, 200, 600);
  const boxHeight = Math.min(defaultBoxHeight, maxBoxHeight);
  const initialBoxSizeRef = useRef({
    w: boxWidth,
    h: boxHeight,
  });
  const initialBoxPositionRef = useRef({
    x: (window.innerWidth - getTranBoxOuterWidth(boxWidth)) / 2,
    y: (window.innerHeight - getTranBoxOuterHeight(boxHeight)) / 2,
  });

                          
  const [boxSize, setBoxSize] = useState(initialBoxSizeRef.current);

                              
  const [boxPosition, setBoxPosition] = useState(initialBoxPositionRef.current);

           
  const [simpleStyle, setSimpleStyle] = useState(initSimpleStyle);
                
  const [hideClickAway, setHideClickAway] = useState(initHideClickAway);
                 
  const [followSelection, setFollowSelection] = useState(initFollowMouse);

                                                          
                                     
  useEffect(() => {
    setSimpleStyle(initSimpleStyle);
    setHideClickAway(initHideClickAway);
    setFollowSelection(initFollowMouse);
  }, [initSimpleStyle, initHideClickAway, initFollowMouse]);

                                                                
  useEffect(() => {
    (async () => {
      try {
        const { w, h, x, y } = (await getTranBox()) || {};
        const next = clampTranBoxBounds(
          {
            w: w !== undefined ? w : initialBoxSizeRef.current.w,
            h: h !== undefined ? h : initialBoxSizeRef.current.h,
          },
          {
            x: x !== undefined ? x : initialBoxPositionRef.current.x,
            y: y !== undefined ? y : initialBoxPositionRef.current.y,
          }
        );

        if (w !== undefined && h !== undefined) {
          setBoxSize(next.size);
        }
        if (x !== undefined && y !== undefined) {
          setBoxPosition(next.position);
        }
      } catch (err) {
               
      }
    })();
  }, []);

                                           
  useEffect(() => {
    function handleResize() {
      const next = clampTranBoxBounds(boxSize, boxPosition);
      setBoxSize(next.size);
      setBoxPosition(next.position);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [boxSize, boxPosition]);

                                                                    
                                              
  useEffect(() => {
    if (!isIframe && boxSize.w > 0 && boxSize.h > 0) {
      debouncePutTranBox({
        ...boxSize,
        ...boxPosition,
      });
    }
  }, [boxSize, boxPosition]);

  return {
    boxSize,
    setBoxSize,
    boxPosition,
    setBoxPosition,
    simpleStyle,
    setSimpleStyle,
    hideClickAway,
    setHideClickAway,
    followSelection,
    setFollowSelection,
    boxOffsetX,
    boxOffsetY,
  };
}
