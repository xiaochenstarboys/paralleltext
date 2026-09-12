import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { limitNumber } from "../../libs/utils";
import { isMobile } from "../../libs/mobile";
import { putFab } from "../../libs/storage";
import { debounce } from "../../libs/utils";
import Paper from "@mui/material/Paper";

const FAB_EDGES = ["left", "right", "top", "bottom"];

                            
const DRAG_THRESHOLD_PX = 6;

                
export const getNearestEdge = ({
  x: left,
  y: top,
  width,
  height,
  windowWidth,
  windowHeight,
}) => {
  const right = windowWidth - left - width;
  const bottom = windowHeight - top - height;
  const min = Math.min(left, top, right, bottom);
  switch (min) {
    case right:
      return "right";
    case left:
      return "left";
    case bottom:
      return "bottom";
    default:
      return "top";
  }
};

                                             
export const getEdgePosition = ({
  x: left,
  y: top,
  width,
  height,
  windowWidth,
  windowHeight,
  edge,
}) => {
  switch (edge) {
    case "right":
      left = windowWidth - width;
      break;
    case "left":
      left = 0;
      break;
    case "bottom":
      top = windowHeight - height;
      break;
    default:
      top = 0;
  }
  return { x: left, y: top };
};

                                                               
function DraggableWrapper({ children, usePaper, ...props }) {
  if (usePaper) {
    return (
      <Paper {...props} elevation={4}>
        {children}
      </Paper>
    );
  }
  return <div {...props}>{children}</div>;
}

   
                                          
                                
   
export default function Draggable({
  windowSize: { w: windowWidth, h: windowHeight },
  width,
  height,
  left,
  top,
  edge: savedEdge,
  show = true,
  snapEdge,
  onStart,
  onMove,
  handler,                
  children,               
  usePaper,
}) {
  const [origin, setOrigin] = useState(null);                          
  const [edge, setEdge] = useState(
    FAB_EDGES.includes(savedEdge) ? savedEdge : null
  );
  const containerRef = useRef(null);
  const draggedRef = useRef(false);

                                        
                                                                                           
                                                                  
  const latestPosition = useRef({
    x: left / windowWidth,
    y: top / windowHeight,
  });
  const latestEdge = useRef(edge);
  const [position, setPosition] = useState({
    x: left / windowWidth,
    y: top / windowHeight,
  });
                                            
  const setFabPosition = useMemo(() => debounce(putFab, 500), []);

                            
  const applyTransform = useCallback((x, y) => {
    if (containerRef.current) {
      containerRef.current.style.transform = `translate(${x}px, ${y}px)`;
    }
  }, []);

                
  useEffect(() => {
    latestPosition.current = position;
  }, [position]);

  useEffect(() => {
    latestEdge.current = edge;
  }, [edge]);

                                      
  useEffect(() => {
    const onResize = () => {
      if (!containerRef.current) return;
      const { x: px, y: py } = latestPosition.current;
      const newWindowWidth = document.documentElement.clientWidth;
      const newWindowHeight = document.documentElement.clientHeight;
      const currentPosition = {
        x: px * newWindowWidth,
        y: py * newWindowHeight,
      };

      if (snapEdge && latestEdge.current) {
        const edgePosition = getEdgePosition({
          ...currentPosition,
          width,
          height,
          windowWidth: newWindowWidth,
          windowHeight: newWindowHeight,
          edge: latestEdge.current,
        });
        applyTransform(edgePosition.x, edgePosition.y);
        return;
      }

                                                
                                 
      applyTransform(
        limitNumber(currentPosition.x, 0, newWindowWidth - width),
        limitNumber(currentPosition.y, 0, newWindowHeight - height)
      );
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [applyTransform, height, snapEdge, width]);

               
  useEffect(() => {
    if (!snapEdge || !!origin) {
      return;
    }

    const currentPosition = {
      x: position.x * windowWidth,
      y: position.y * windowHeight,
    };

    const activeEdge =
      edge ||
      getNearestEdge({
        ...currentPosition,
        width,
        height,
        windowWidth,
        windowHeight,
      });
    if (!edge) {
      setEdge(activeEdge);
      latestEdge.current = activeEdge;
    }

    const edgePosition = getEdgePosition({
      ...currentPosition,
      width,
      height,
      windowWidth,
      windowHeight,
      edge: activeEdge,
    });

    applyTransform(edgePosition.x, edgePosition.y);

    const percentageEdge = {
      x: edgePosition.x / windowWidth,
      y: edgePosition.y / windowHeight,
    };
    setPosition(percentageEdge);
    setFabPosition({ ...edgePosition, edge: activeEdge });
  }, [
    edge,
    origin,
    width,
    height,
    windowWidth,
    windowHeight,
    snapEdge,
    setFabPosition,
    position.x,
    position.y,
    applyTransform,
  ]);

                          
  const handlePointerDown = (e) => {
    !isMobile && e.target.setPointerCapture(e.pointerId);                             
    onStart && onStart();
    draggedRef.current = false;
    const rect = containerRef.current?.getBoundingClientRect();
    const currentX = rect ? rect.left : position.x * windowWidth;
    const currentY = rect ? rect.top : position.y * windowHeight;
    const { clientX, clientY } = isMobile ? e.targetTouches[0] : e;
    setOrigin({ x: currentX, y: currentY, clientX, clientY });
  };

                            
  const handlePointerMove = (e) => {
    if (!origin) return;
    const { clientX, clientY } = isMobile ? e.targetTouches[0] : e;
    const dx = clientX - origin.clientX;
    const dy = clientY - origin.clientY;

                                      
                                  
    if (!draggedRef.current && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) {
      return;
    }
    if (!draggedRef.current) {
      draggedRef.current = true;
      onMove && onMove();
    }

    let x = origin.x + dx;
    let y = origin.y + dy;

                                         
    x = limitNumber(x, 0, windowWidth - width);
    y = limitNumber(y, 0, windowHeight - height);

    applyTransform(x, y);
    const relativePosition = {
      x: x / windowWidth,
      y: y / windowHeight,
    };
    setPosition(relativePosition);
    latestPosition.current = relativePosition;
  };

                                          
  const handlePointerUp = (e) => {
    e.stopPropagation();
    if (snapEdge && draggedRef.current) {
      const currentPosition = {
        x: latestPosition.current.x * windowWidth,
        y: latestPosition.current.y * windowHeight,
      };
      const nextEdge = getNearestEdge({
        ...currentPosition,
        width,
        height,
        windowWidth,
        windowHeight,
      });
      setEdge(nextEdge);
      latestEdge.current = nextEdge;
    }
    setOrigin(null);
  };

  const handleClick = (e) => {
    e.stopPropagation();
  };

                            
  const opacity = useMemo(() => {
    if (snapEdge) {
      return 1;
    }
    return origin ? 0.8 : 1;
  }, [origin, snapEdge]);

                              
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
    <div
      ref={containerRef}
      style={{
        opacity,
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 2147483647,
        display: show ? "block" : "none",
        willChange: "transform",
      }}
      onClick={handleClick}
    >
      <DraggableWrapper usePaper={usePaper}>
        <div
          style={{
            touchAction: "none",                           
          }}
          {...touchProps}
        >
          {handler}
        </div>
        <div>{children}</div>
      </DraggableWrapper>
    </div>
  );
}
