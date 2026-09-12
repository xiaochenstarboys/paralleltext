   
                  
                                                                    
   

export const OPT_STYLE_NONE = "style_none";                     
export const OPT_STYLE_LINE = "under_line";          
export const OPT_STYLE_DOTLINE = "dot_line";         
export const OPT_STYLE_DASHLINE = "dash_line";         
export const OPT_STYLE_DASHLINE_BOLD = "dash_line_bold";          
export const OPT_STYLE_DASHBOX = "dash_box";             
export const OPT_STYLE_DASHBOX_BOLD = "dash_box_bold";              
export const OPT_STYLE_WAVYLINE = "wavy_line";         
export const OPT_STYLE_WAVYLINE_BOLD = "wavy_line_bold";          
export const OPT_STYLE_MARKER = "marker";                   
export const OPT_STYLE_GRADIENT_MARKER = "gradient_marker";                
export const OPT_STYLE_FUZZY = "fuzzy";                                
export const OPT_STYLE_HIGHLIGHT = "highlight";            
export const OPT_STYLE_BLOCKQUOTE = "blockquote";                                     
export const OPT_STYLE_GRADIENT = "gradient";               
export const OPT_STYLE_BLINK = "blink";                
export const OPT_STYLE_GLOW = "glow";             
export const OPT_STYLE_COLORFUL = "colorful";                   
export const OPT_STYLE_ALL = [
  OPT_STYLE_NONE,
  OPT_STYLE_LINE,
  OPT_STYLE_DOTLINE,
  OPT_STYLE_DASHLINE,
  OPT_STYLE_DASHLINE_BOLD,
  OPT_STYLE_WAVYLINE,
  OPT_STYLE_WAVYLINE_BOLD,
  OPT_STYLE_DASHBOX,
  OPT_STYLE_DASHBOX_BOLD,
  OPT_STYLE_MARKER,
  OPT_STYLE_GRADIENT_MARKER,
  OPT_STYLE_FUZZY,
  OPT_STYLE_HIGHLIGHT,
  OPT_STYLE_BLOCKQUOTE,
  OPT_STYLE_GRADIENT,
  OPT_STYLE_BLINK,
  OPT_STYLE_GLOW,
  OPT_STYLE_COLORFUL,
];

                                             
                                                      
export const OPT_STYLE_BLOCK_SET = new Set([
  OPT_STYLE_DASHBOX,
  OPT_STYLE_DASHBOX_BOLD,
  OPT_STYLE_BLOCKQUOTE,
]);

                              
export const DEFAULT_CUSTOM_STYLES = [
  {
    styleSlug: "custom",
    styleName: "Custom Style",
    styleCode: `color: #209CEE;`,                      
  },
];
