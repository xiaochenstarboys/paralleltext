import { isSameSet } from "./utils";

   
              
                                    
                                                                                                 
                                                                                          
                                                          
                                               
   
export const shortcutListener = (
  onKeyDown = () => {},
  onKeyUp = () => {},
  target = window
) => {
  const pressedKeys = new Set();                            

  const handleKeyDown = (e) => {
                          
    if (!e.code) {
      return;
    }

                                   
    if (pressedKeys.has(e.code)) return;
    pressedKeys.add(e.code);
    onKeyDown(new Set(pressedKeys), e);
  };

  const handleKeyUp = (e) => {
    if (!e.code) {
      return;
    }

                                                     
                                                 
    onKeyUp(new Set(pressedKeys), e);
    pressedKeys.delete(e.code);
  };

                                                    
                                                           
  const handleBlur = () => {
    pressedKeys.clear();
  };

                                                   
  target.addEventListener("keydown", handleKeyDown, true);
  target.addEventListener("keyup", handleKeyUp, true);
  window.addEventListener("blur", handleBlur);

  return () => {
    target.removeEventListener("keydown", handleKeyDown, true);
    target.removeEventListener("keyup", handleKeyUp, true);
    window.removeEventListener("blur", handleBlur);
    pressedKeys.clear();
  };
};

   
                
                                                                          
                                           
                                                
                                 
   
export const shortcutRegister = (targetKeys = [], fn, target = window) => {
  if (targetKeys.length === 0) return () => {};

  const targetKeySet = new Set(targetKeys);
  let hasInterference = false;                             

  const onKeyDown = (pressedKeys, event) => {
                                                       
                               
    if (!targetKeySet.has(event.code)) {
      hasInterference = true;
    }
  };

  const onKeyUp = (pressedKeys, event) => {
                                        
    if (isSameSet(targetKeySet, pressedKeys) && !hasInterference) {
      fn();
    }
                                            
    if (pressedKeys.size === 1) {
      hasInterference = false;
    }
  };

  return shortcutListener(onKeyDown, onKeyUp, target);
};

   
                                 
                                      
                                            
                                             
                                         
   
const withStepCounter = (fn, step, timeout) => {
  let count = 0;
  let timer = null;

  return () => {
                     
    timer && clearTimeout(timer);
    timer = setTimeout(() => {
      count = 0;                   
    }, timeout);

    count++;
    if (count === step) {
      count = 0;
      clearTimeout(timer);
      fn();                     
    }
  };
};

   
                               
                                                                       
                                      
                                      
                                                 
                                       
                                 
   
export const stepShortcutRegister = (
  targetKeys = [],
  fn,
  step = 2,
  timeout = 500,
  target = window
) => {
  const steppedFn = withStepCounter(fn, step, timeout);
  return shortcutRegister(targetKeys, steppedFn, target);
};
