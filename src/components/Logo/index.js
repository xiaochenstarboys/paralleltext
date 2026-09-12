import React from "react";
import { FAVICON_BASE64 } from "./icon.base64.js";

   
                                                   
                        
                                             
                                                   
                                               
                                         
   
const Logo = ({ size = 16, className = "", style = {}, onClick }) => {
  return (
    <img
      src={FAVICON_BASE64}
      alt="Logo"
      className={className}
      draggable={false}
      onClick={onClick}
      onDragStart={(e) => e.preventDefault()}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: "contain",
        display: "block",
        ...style,
      }}
    />
  );
};

export default Logo;
