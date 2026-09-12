import TranBtn from "./TranBtn";
import TranBox from "./TranBox";
import useTranBoxState from "../../hooks/useTranBoxState";
import useSelectionController from "../../hooks/useSelectionController";
import useTranboxShortcuts from "../../hooks/useTranboxShortcuts";

   
               
  
                        
                                                     
                                                  
                                                   
   
export default function Selection({
  tranboxSetting,
  transApis,
  prompts,
  langDetector,
  translateVariants = true,
}) {
                                                           
  const {
    boxSize,
    setBoxSize,
    boxPosition,
    setBoxPosition,
    simpleStyle,
    setSimpleStyle,
    hideClickAway,
    setHideClickAway,
    followSelection,
    setFollowSelection,
    boxOffsetX,
    boxOffsetY,
  } = useTranBoxState(tranboxSetting);

                                              
  const {
    showBox,
    setShowBox,
    showBtn,
    text,
    setText,
    textContext,
    position,
    boxAnchor,
    handleOpenTranbox,
    handleToggleTranbox,
    btnEvent,
  } = useSelectionController({
    tranboxSetting,
    followSelection,
    boxOffsetX,
    boxOffsetY,
    hideClickAway,
  });

                                            
  useTranboxShortcuts({
    showBox,
    setShowBox,
    handleOpenTranbox,
    handleToggleTranbox,
  });

  return (
    <>
      {                    }
      {
        <TranBox
          showBox={showBox}
          text={text}
          setText={setText}
          boxSize={boxSize}
          setBoxSize={setBoxSize}
          boxPosition={boxPosition}
          boxAnchor={boxAnchor}
          setBoxPosition={setBoxPosition}
          tranboxSetting={tranboxSetting}
          transApis={transApis}
          prompts={prompts}
          setShowBox={setShowBox}
          simpleStyle={simpleStyle}
          setSimpleStyle={setSimpleStyle}
          hideClickAway={hideClickAway}
          setHideClickAway={setHideClickAway}
          followSelection={followSelection}
          setFollowSelection={setFollowSelection}
                                  
          langDetector={langDetector}
          translateVariants={translateVariants}
          selectionContext={textContext}
        />
      }

      {                                                  }
      {showBtn && (
        <TranBtn
          position={position}
          btnEvent={btnEvent}
          onTrigger={(e) => {
            e.stopPropagation();
            handleOpenTranbox();
          }}
        />
      )}
    </>
  );
}
