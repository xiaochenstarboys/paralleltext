                               
const TRANBOX_SIDE_GRIP_WIDTH = 16;
                                                   
const TRANBOX_CHROME_HEIGHT = 52;

   
                        
   
export function getTranBoxOuterWidth(contentWidth) {
  return contentWidth + TRANBOX_SIDE_GRIP_WIDTH;
}

   
                                 
   
export function getTranBoxOuterHeight(contentHeight) {
  return contentHeight + TRANBOX_CHROME_HEIGHT;
}

   
                                 
   
export function getMaxTranBoxContentWidth() {
  return Math.max(0, window.innerWidth - TRANBOX_SIDE_GRIP_WIDTH);
}

   
                                 
   
export function getMaxTranBoxContentHeight() {
  return Math.max(0, window.innerHeight - TRANBOX_CHROME_HEIGHT);
}

   
                                
   
export function getMaxTranBoxX(contentWidth) {
  return Math.max(0, window.innerWidth - getTranBoxOuterWidth(contentWidth));
}

   
                                
   
export function getMaxTranBoxY(contentHeight) {
  return Math.max(0, window.innerHeight - getTranBoxOuterHeight(contentHeight));
}
