import { useEffect } from "react";

   
                      
                                                      
                                    
                                                
                                          
   
export default function useAutoHideTranBtn(
  showBtn,
  setShowBtn,
  getSelection = () => window.getSelection()
) {
  useEffect(() => {
                             
    if (!showBtn) return;

                          
    const handleMouseDown = (e) => {
      if (e.button === 2) {
        setShowBtn(false);
      }
    };

                                                             
                                                                            
                                                 
                                                                
    const handleSelectionChange = () => {
      const selection = getSelection();
      if (!selection || selection.isCollapsed) setShowBtn(false);
    };

    window.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("selectionchange", handleSelectionChange);

              
    return () => {
      window.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [showBtn, setShowBtn, getSelection]);
}
