   
                        
   
export const loadingSvg = `<svg viewBox="-20 0 100 100" 
     style="display: inline-block; width: 1em; height: 1em; vertical-align: middle;">
  <circle fill="#209CEE" stroke="none" cx="6" cy="50" r="6">
    <animateTransform attributeName="transform" dur="1s" type="translate" values="0 15 ; 0 -15; 0 15" repeatCount="indefinite" begin="0.1"/>
  </circle>
  <circle fill="#209CEE" stroke="none" cx="30" cy="50" r="6">
    <animateTransform attributeName="transform" dur="1s" type="translate" values="0 10 ; 0 -10; 0 10" repeatCount="indefinite" begin="0.2"/>
  </circle>
  <circle fill="#209CEE" stroke="none" cx="54" cy="50" r="6">
    <animateTransform attributeName="transform" dur="1s" type="translate" values="0 5 ; 0 -5; 0 5" repeatCount="indefinite" begin="0.3"/>
  </circle>
</svg>
`;

                                      
function createSVGElement(tag, attributes) {
  const svgNS = "http://www.w3.org/2000/svg";
  const el = document.createElementNS(svgNS, tag);
  for (const key in attributes) {
    el.setAttribute(key, attributes[key]);
  }
  return el;
}

   
                           
                        
   
export function createLoadingSVG() {
  const svg = createSVGElement("svg", {
    viewBox: "-20 0 100 100",
    style:
      "display: inline-block; width: 1em; height: 1em; vertical-align: middle;",
  });

  const circleData = [
    { cx: "6", begin: "0.1", values: "0 15 ; 0 -15; 0 15" },
    { cx: "30", begin: "0.2", values: "0 10 ; 0 -10; 0 10" },
    { cx: "54", begin: "0.3", values: "0 5 ; 0 -5; 0 5" },
  ];

  circleData.forEach((data) => {
    const circle = createSVGElement("circle", {
      fill: "#209CEE",
      stroke: "none",
      cx: data.cx,
      cy: "50",
      r: "6",
    });
    const animation = createSVGElement("animateTransform", {
      attributeName: "transform",
      dur: "1s",
      type: "translate",
      values: data.values,
      repeatCount: "indefinite",
      begin: data.begin,
    });
    circle.appendChild(animation);
    svg.appendChild(circle);
  });

  return svg;
}

   
                                 
                        
   
export function createRetrySVG() {
  const svg = createSVGElement("svg", {
    viewBox: "0 0 24 24",
    style:
      "display: inline-block; width: 1em; height: 1em; vertical-align: middle; cursor: pointer; opacity: 0.7;",
  });

  svg.addEventListener("mouseenter", () => {
    svg.style.opacity = "1";
  });
  svg.addEventListener("mouseleave", () => {
    svg.style.opacity = "0.7";
  });

                 
  const path = createSVGElement("path", {
    d: "M17.65 6.35A7.958 7.958 0 0 0 12 4C7.58 4 4.01 7.58 4.01 12S7.58 20 12 20c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z",
    fill: "#F44336",
  });

  svg.appendChild(path);
  return svg;
}
