const identity = (value) => value;

                                               
                                           
const sortSegments = (segments) =>
  segments
    .slice()
    .sort((a, b) => a.id - b.id || a.order - b.order)
    .map(({ order, ...segment }) => segment);

   
                                 
  
                                                     
                                                             
                                        
  
                                   
                                                
                               
                                                                       
                                                                                   
   
export const normalizeTranslationItem = (
  item,
  fallbackId = 0,
  { decodeText = identity } = {}
) => {
  if (!item || typeof item !== "object") {
    return null;
  }

                                             
                                                                
  const rawText =
    item.text !== undefined
      ? item.text
      : item.translation !== undefined
        ? item.translation
        : undefined;
  if (rawText === undefined) {
    return null;
  }

                                               
  const rawId = item.id ?? fallbackId;
  const id = Number(rawId);
  if (!Number.isInteger(id)) {
    return null;
  }

  return {
    id,
    translation: [
      decodeText(String(rawText || "")),
                                                                  
      String(item.sourceLanguage || item.src || ""),
    ],
  };
};

   
                         
  
                                                         
                                                         
                                             
  
                                 
                               
                                                
                                                                         
   
export const parseJsonTranslationSegments = (
  content,
  { decodeText = identity } = {}
) => {
  const start = content.search(/(\{|\[)/);
  const end = Math.max(content.lastIndexOf("}"), content.lastIndexOf("]"));
  if (start < 0 || end < 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(content.substring(start, end + 1));
                      
                           
                                               
                          
    const list = Array.isArray(parsed)
      ? parsed
      : parsed.translations || (parsed.result ? [parsed.result] : [parsed]);

    if (!Array.isArray(list) || list.length === 0) {
      return [];
    }

    const segments = list
      .map((item, index) =>
        normalizeTranslationItem(item, index, { decodeText })
      )
      .filter(Boolean)
      .map((segment, order) => ({ ...segment, order }));

    return sortSegments(segments);
  } catch {
    return [];
  }
};

   
                          
  
                                                              
                                                    
                          
  
                                      
                                                                         
   
export const parseXmlTranslationSegments = (content) => {
  const segments = [];
                                          
                                                 
  const tagPattern = /<(t|item|seg)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  let match;

  while ((match = tagPattern.exec(content)) !== null) {
    const attrs = match[2] || "";
    const idMatch = attrs.match(/\bid\s*=\s*["']?(\d+)["']?/i);
    const sourceMatch = attrs.match(/\bsourceLanguage\s*=\s*["']([^"']*)["']/i);
    const id = idMatch ? Number(idMatch[1]) : segments.length;

    if (!Number.isInteger(id)) {
      continue;
    }

    segments.push({
      id,
      order: segments.length,
                                                         
      translation: [match[3].trim(), sourceMatch?.[1] || ""],
    });
  }

  return sortSegments(segments);
};

   
                    
  
                                                          
                                 
  
                                      
                               
                                                              
                                                
                                                                         
   
export const parseLineTranslationSegments = (
  content,
  { requireCompleteLine = false, decodeText = identity } = {}
) => {
  const endsWithNewline = content.endsWith("\n");
  const lines = content.split("\n");
  const linesToProcess =
    requireCompleteLine && !endsWithNewline ? lines.slice(0, -1) : lines;
  const segments = [];

  for (const line of linesToProcess) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    const pipeMatch = trimmedLine.match(/^(\d+)\s*\|\s*(.*)/);
    if (!pipeMatch) continue;

    segments.push({
      id: Number(pipeMatch[1]),
      order: segments.length,
      translation: [
                                                          
        decodeText(pipeMatch[2].trim().replace(/<br\s*\/?>/gi, "\n")),
        "",
      ],
    });
  }

  return sortSegments(segments);
};

   
                      
  
                                                         
                                              
  
                                 
                               
                                                
                                                                         
   
export const parseCompleteTranslationSegments = (
  content,
  { decodeText = identity } = {}
) => {
  const jsonSegments = parseJsonTranslationSegments(content, { decodeText });
  if (jsonSegments.length > 0) return jsonSegments;

  const xmlSegments = parseXmlTranslationSegments(content);
                                                  
                                                                       
  if (xmlSegments.length > 0) return xmlSegments;

  return parseLineTranslationSegments(content, { decodeText });
};
