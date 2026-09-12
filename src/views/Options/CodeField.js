import TextField from "@mui/material/TextField";

                    
const MONO_FONT =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

   
                
                                                
  
                        
                                                      
   
export default function CodeField({ InputProps, ...rest }) {
  return (
    <TextField
      multiline            
      {...rest}
      InputProps={{
        ...InputProps,
        sx: {
          fontFamily: MONO_FONT,            
          fontSize: "0.875rem",
          ...(InputProps?.sx || {}),
        },
      }}
    />
  );
}
