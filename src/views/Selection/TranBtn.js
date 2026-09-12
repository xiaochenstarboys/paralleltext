import { isMobile } from "../../libs/mobile";
import { LOGO_PNG_BASE64 } from "../../components/Logo/icon.base64";

   
                                
  
                                                                   
                               
                                                                    
                                     
                                                             
                          
  
                        
                                                      
                                                                             
                                                         
   
export default function TranBtn({ onTrigger, btnEvent, position }) {
  return (
    <div
      className="KT-tranbtn"
      style={{
        cursor: "pointer",
        position: "fixed",
        left: position.x,
        top: position.y,
        zIndex: 2147483647,
      }}
                                     
      onMouseDown={(e) => e.preventDefault()}
      {...{ [btnEvent]: onTrigger }}
    >
      {                              }
      <img
        src={LOGO_PNG_BASE64}
        alt="ParallelText"
        draggable={false}
        width={isMobile ? "32" : "20"}
        height={isMobile ? "32" : "20"}
        style={{ display: "block", borderRadius: "5px" }}
      />
    </div>
  );
}
