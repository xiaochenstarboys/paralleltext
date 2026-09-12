import { useCallback, useLayoutEffect, useRef, useState } from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import { isMobile } from "../../libs/mobile";
import { useTheme, alpha } from "@mui/material/styles";
import { limitNumber } from "../../libs/utils";
import {
  getMaxTranBoxContentWidth,
  getMaxTranBoxContentHeight,
  getMaxTranBoxX,
  getMaxTranBoxY,
  getTranBoxOuterHeight,
} from "../../libs/tranboxPosition";

   
                            
  
                        
                                                                             
                                               
                                                       
                                                   
                                                           
                                           
                                           
   
function Pointer({
  direction,
  size,
  setSize,
  position,
  setPosition,
  children,
  minSize,
  maxSize,
  getMaxPositionY,
  ...props
}) {
                             
  const [origin, setOrigin] = useState(null);

              
  function handlePointerDown(e) {
                                     
    !isMobile && e.target.setPointerCapture(e.pointerId);

                                        
    const { clientX, clientY } = isMobile ? e.targetTouches[0] : e;
    setOrigin({
      x: position.x,
      y: position.y,
      w: size.w,
      h: size.h,
      clientX,
      clientY,
    });
  }

              
  function handlePointerMove(e) {
    const { clientX, clientY } = isMobile ? e.targetTouches[0] : e;
    if (origin) {
              
      const dx = clientX - origin.clientX;
      const dy = clientY - origin.clientY;
      let x = position.x;
      let y = position.y;
      let w = size.w;
      let h = size.h;

                                         
      switch (direction) {
        case "Header":           
          x = origin.x + dx;
          y = origin.y + dy;
          break;
        case "TopLeft":         
          x = origin.x + dx;
          y = origin.y + dy;
          w = origin.w - dx;
          h = origin.h - dy;
          break;
        case "Top":          
          y = origin.y + dy;
          h = origin.h - dy;
          break;
        case "TopRight":         
          y = origin.y + dy;
          w = origin.w + dx;
          h = origin.h - dy;
          break;
        case "Left":          
          x = origin.x + dx;
          w = origin.w - dx;
          break;
        case "Right":          
          w = origin.w + dx;
          break;
        case "BottomLeft":         
          x = origin.x + dx;
          w = origin.w - dx;
          h = origin.h + dy;
          break;
        case "Bottom":          
          h = origin.h + dy;
          break;
        case "BottomRight":         
          w = origin.w + dx;
          h = origin.h + dy;
          break;
        default:
      }

                                            
      const movesX = ["TopLeft", "Left", "BottomLeft"].includes(direction);
      const movesY = ["TopLeft", "Top", "TopRight"].includes(direction);

                                          
      if (w < minSize.w) {
        w = minSize.w;
                                     
        if (movesX) x = origin.x + (origin.w - w);
      }
      if (w > maxSize.w) {
        w = maxSize.w;
        if (movesX) x = origin.x + (origin.w - w);
      }
                                          
      if (h < minSize.h) {
        h = minSize.h;
                                     
        if (movesY) y = origin.y + (origin.h - h);
      }
      if (h > maxSize.h) {
        h = maxSize.h;
        if (movesY) y = origin.y + (origin.h - h);
      }

                                              
      const nextSize = {
        w: limitNumber(w, minSize.w, getMaxTranBoxContentWidth()),
        h: limitNumber(h, minSize.h, getMaxTranBoxContentHeight()),
      };

      setPosition({
        x: limitNumber(x, 0, getMaxTranBoxX(nextSize.w)),
        y: limitNumber(y, 0, getMaxPositionY(nextSize.h)),
      });
      setSize(nextSize);
    }
  }

                
  function handlePointerUp(e) {
    e.stopPropagation();
    setOrigin(null);
  }

                                                                                                                                                                                                                            
  const touchProps = isMobile
    ? {
        onTouchStart: handlePointerDown,
        onTouchMove: handlePointerMove,
        onTouchEnd: handlePointerUp,
      }
    : {
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
      };

  return (
    <div {...props} {...touchProps}>
      {children}
    </div>
  );
}

   
                         
   
export default function DraggableResizable({
  header,
  children,
  position = {
    x: 0,
    y: 0,
  },
  size = {
    w: 600,
    h: 400,
  },
  minSize = {
    w: 300,
    h: 200,
  },
  maxSize = {
    w: 1200,
    h: 1200,
  },
  setSize,
  setPosition,
  onChangeSize,
  onChangePosition,
  autoHeight,
  anchor,
  ...props
}) {
                    
  const lineWidth = 4;
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const containerRef = useRef(null);

  const getMaxPositionY = useCallback(
    (contentHeight) => {
      if (!autoHeight) return getMaxTranBoxY(contentHeight);

      const outerHeight = containerRef.current?.getBoundingClientRect().height;
      return Math.max(
        0,
        window.innerHeight -
          (outerHeight || getTranBoxOuterHeight(contentHeight))
      );
    },
    [autoHeight]
  );

  useLayoutEffect(() => {
    if (!autoHeight || !containerRef.current) return;

    const clampPosition = () => {
      setPosition((previous) => {
        const y = limitNumber(previous.y, 0, getMaxPositionY(size.h));
        return y === previous.y ? previous : { ...previous, y };
      });
    };

    clampPosition();
    const ResizeObserver = window.ResizeObserver;
    if (!ResizeObserver) return;

    const observer = new ResizeObserver(clampPosition);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [autoHeight, getMaxPositionY, setPosition, size.h]);

                                              
                                    
                                                                        
  useLayoutEffect(() => {
    if (!anchor || !containerRef.current) return;

    const reposition = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect || !rect.height) return;
      const maxX = Math.max(0, window.innerWidth - rect.width);
      const maxY = Math.max(0, window.innerHeight - rect.height);
      let y;
      if (anchor.bottom + rect.height <= window.innerHeight) {
        y = anchor.bottom;           
      } else if (anchor.top - rect.height >= 0) {
        y = anchor.top - rect.height;          
      } else {
        y = limitNumber(anchor.bottom, 0, maxY);               
      }
      const x = limitNumber(anchor.centerX, 0, maxX);
      setPosition((prev) => (prev.x === x && prev.y === y ? prev : { x, y }));
    };

    reposition();
    const RO = window.ResizeObserver;
    if (!RO) return;
    const observer = new RO(reposition);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [anchor, setPosition]);

                                 
  const glowShadow = isDark
    ? `
        0 0 0 1px rgba(255,255,255,0.18),
        0 0 10px 2px rgba(255,255,255,0.18),
        0 8px 32px rgba(0,0,0,0.35)
      `
    : ` 
        0 4px 18px rgba(0, 0, 0, 0.15)
      `;

  const opts = {
    size,
    setSize,
    position,
    setPosition,
    minSize,
    maxSize,
    getMaxPositionY,
  };

  return (
    <Box
      ref={containerRef}
      className="KT-draggable"
      style={{
        touchAction: "none",                 
        position: "fixed",
        left: position.x,
        top: position.y,
                                                 
        display: "grid",
        gridTemplateColumns: `${lineWidth * 2}px ${size.w}px ${lineWidth * 2}px`,
        gridTemplateRows: `${lineWidth * 2}px auto ${lineWidth * 2}px`,
        zIndex: 2147483647,
        borderRadius: "12px",
        overflow: "hidden",
      }}
      {...props}
    >
      {                                                     }
      <Pointer
        direction="TopLeft"
        style={{
          transform: `translate(${lineWidth}px, ${lineWidth}px)`,
          cursor: "nw-resize",
        }}
        {...opts}
      />
      <Pointer
        direction="Top"
        style={{
          margin: `0 ${lineWidth}px`,
          transform: `translate(0px, ${lineWidth}px)`,
          cursor: "row-resize",
        }}
        {...opts}
      />
      <Pointer
        direction="TopRight"
        style={{
          transform: `translate(-${lineWidth}px, ${lineWidth}px)`,
          cursor: "ne-resize",
        }}
        {...opts}
      />
      <Pointer
        direction="Left"
        style={{
          margin: `${lineWidth}px 0`,
          transform: `translate(${lineWidth}px, 0px)`,
          cursor: "col-resize",
        }}
        {...opts}
      />

      {                                                  }
      <Paper
        className="KT-draggable-body"
        elevation={4}
        sx={{
          width: size.w,
          maxWidth: size.w,
          minWidth: 0,
          borderRadius: 4,
          overflow: "hidden",
          backgroundColor: theme.palette.background.paper,
          boxShadow: glowShadow,
        }}
      >
        {                           }
        <Pointer
          className="KT-draggable-header"
          direction="Header"
          style={{ cursor: "move" }}
          {...opts}
        >
          {header}
        </Pointer>

        {                             }
        <Box
          className="KT-draggable-container"
          sx={() => {
            const containerStyle = autoHeight
              ? {
                                             
                  width: size.w,
                  maxHeight: getMaxTranBoxContentHeight(),
                  overflow: "hidden",
                  wordBreak: "break-word",
                }
              : {
                  width: size.w,
                  height: size.h,
                  overflow: "hidden auto",
                  wordBreak: "break-word",
                };

                       
            const scrollbarTrackColor =
              theme.palette.mode === "dark"
                ? "#1f1f23"
                : theme.palette.background.paper;
            const scrollbarThumbColor =
              theme.palette.mode === "dark"
                ? alpha(theme.palette.text.primary, 0.28)
                : alpha(theme.palette.text.primary, 0.24);

            return {
              ...containerStyle,
              backgroundColor: theme.palette.background.paper,
              "&::-webkit-scrollbar": {
                width: 10,
                height: 10,
              },
              "&::-webkit-scrollbar-track": {
                background: scrollbarTrackColor,
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: scrollbarThumbColor,
                borderRadius: 8,
                border: `2px solid ${theme.palette.background.paper}`,
              },
              "&::-webkit-scrollbar-thumb:hover": {
                backgroundColor: alpha(theme.palette.text.primary, 0.36),
              },
                        
              scrollbarWidth: "thin",
              scrollbarColor: `${scrollbarThumbColor} ${scrollbarTrackColor}`,
            };
          }}
        >
          {children}
        </Box>
      </Paper>

      {                                                     }
      <Pointer
        direction="Right"
        style={{
          margin: `${lineWidth}px 0`,
          transform: `translate(-${lineWidth}px, 0px)`,
          cursor: "col-resize",
        }}
        {...opts}
      />
      <Pointer
        direction="BottomLeft"
        style={{
          transform: `translate(${lineWidth}px, -${lineWidth}px)`,
          cursor: "ne-resize",
        }}
        {...opts}
      />
      <Pointer
        direction="Bottom"
        style={{
          margin: `0 ${lineWidth}px`,
          transform: `translate(0px, -${lineWidth}px)`,
          cursor: "row-resize",
        }}
        {...opts}
      />
      <Pointer
        direction="BottomRight"
        style={{
          transform: `translate(-${lineWidth}px, -${lineWidth}px)`,
          cursor: "nw-resize",
        }}
        {...opts}
      />
    </Box>
  );
}
