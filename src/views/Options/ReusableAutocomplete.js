import { useState, useEffect, useRef } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

   
                                                      
                                    
                                                                        
                                              
                                      
                                                             
                                                    
   
export default function ReusableAutocomplete({
  name,
  label,
  value,
  onChange,
  textFieldProps = {},
  ...rest
}) {
                                                           
  const [inputValue, setInputValue] = useState(value || "");
                                                         
  const isChangeCommitted = useRef(false);

              
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

                                                                  
  const triggerOnChange = (newValue) => {
    if (onChange) {
      const syntheticEvent = {
        target: {
          name: name,
          value: newValue,
        },
        preventDefault: () => {},
      };
      onChange(syntheticEvent);
    }
  };

                                     
  const handleBlur = () => {
    if (isChangeCommitted.current) {
      isChangeCommitted.current = false;
      return;
    }

    if (inputValue !== value) {
      triggerOnChange(inputValue);
    }
  };

                   
  const handleChange = (event, newValue) => {
    isChangeCommitted.current = true;
    triggerOnChange(newValue);
  };

                  
  const handleInputChange = (event, newInputValue) => {
    isChangeCommitted.current = false;
    setInputValue(newInputValue);
  };

  return (
    <Autocomplete
      value={value}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onBlur={handleBlur}
      {...rest}
      renderInput={(params) => (
        <TextField {...params} {...textFieldProps} name={name} label={label} />
      )}
    />
  );
}
