import { useEffect, useCallback } from "react";
import { MSG_OPEN_TRANBOX, EVENT_KISS_INNER } from "../config";

export default function useTranboxShortcuts({
  showBox,
  setShowBox,
  handleToggleTranbox,
  handleOpenTranbox,
}) {
                     
  const handleToggle = useCallback(() => {
    if (showBox) {
      setShowBox(false);
    } else {
      handleToggleTranbox();
    }
  }, [showBox, handleToggleTranbox, setShowBox]);

                                                   
  useEffect(() => {
    const handleStatusUpdate = (event) => {
      if (event.detail?.action === MSG_OPEN_TRANBOX) {
        const text = event.detail?.args?.text?.trim();
        if (text) {
          handleOpenTranbox?.(text);
          return;
        }
        handleToggle();
      }
    };

    document.addEventListener(EVENT_KISS_INNER, handleStatusUpdate);
    return () => {
      document.removeEventListener(EVENT_KISS_INNER, handleStatusUpdate);
    };
  }, [handleToggle, handleOpenTranbox]);
}
