import {
  useState,
  useContext,
  createContext,
  useCallback,
  useRef,
  useMemo,
} from "react";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import { useI18n } from "./I18n";

                                          
const ConfirmContext = createContext(null);

   
                                           
   
export function ConfirmProvider({ children }) {
                               
  const [dialogConfig, setDialogConfig] = useState(null);

                                                       
  const resolveRef = useRef(null);
  const i18n = useI18n();

                           
  const translatedDefaults = useMemo(
    () => ({
      title: i18n("confirm_title", "Confirm"),
      message: i18n("confirm_message", "Are you sure you want to proceed?"),
      confirmText: i18n("confirm_action", "Confirm"),
      cancelText: i18n("cancel_action", "Cancel"),
    }),
    [i18n]
  );

     
                                                                         
                                                                                       
                                
     
  const confirm = useCallback(
    (config) => {
      return new Promise((resolve) => {
                            
        setDialogConfig({ ...translatedDefaults, ...config });
                                 
        resolveRef.current = resolve;
      });
    },
    [translatedDefaults]
  );

              
  const handleClose = () => {
    if (resolveRef.current) {
      resolveRef.current(false);
    }
    setDialogConfig(null);
  };

           
  const handleConfirm = () => {
    if (resolveRef.current) {
      resolveRef.current(true);
    }
    setDialogConfig(null);
  };

                                                                                
                                                         
                                          
                                                       
                             

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      <Dialog
        open={!!dialogConfig}
        onClose={handleClose}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: "18px",
            minWidth: 320,
            maxWidth: 400,
            backgroundImage: "none",
            border: (theme) =>
              theme.palette.mode === "dark"
                ? "1px solid rgba(255,255,255,0.10)"
                : "1px solid rgba(0,0,0,0.06)",
            boxShadow: (theme) =>
              theme.palette.mode === "dark"
                ? "0 24px 64px rgba(0,0,0,0.55)"
                : "0 24px 64px rgba(60,64,67,0.25)",
          },
        }}
      >
        {dialogConfig && (
          <>
            <DialogTitle
              id="confirm-dialog-title"
              sx={{ fontWeight: 700, fontSize: 18, px: 3, pt: 3, pb: 0.5 }}
            >
              {dialogConfig.title}
            </DialogTitle>
            <DialogContent sx={{ px: 3, py: 1.5 }}>
              <DialogContentText
                id="confirm-dialog-description"
                sx={{ color: "text.secondary", fontSize: 14, lineHeight: 1.7 }}
              >
                {dialogConfig.message}
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
              <Button
                onClick={handleClose}
                variant="outlined"
                sx={{
                  borderRadius: "20px",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 2.5,
                  color: "text.secondary",
                  borderColor: "divider",
                  "&:hover": { borderColor: "text.secondary" },
                }}
              >
                {dialogConfig.cancelText}
              </Button>
              <Button
                onClick={handleConfirm}
                variant="contained"
                disableElevation
                autoFocus
                sx={{
                  borderRadius: "20px",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 2.5,
                }}
              >
                {dialogConfig.confirmText}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </ConfirmContext.Provider>
  );
}

                                                                 
export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}
