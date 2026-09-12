import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid";
import { useI18n } from "../../hooks/I18n";
import {
  OPT_LANGS_FROM_REVERSED as OPT_LANGS_FROM,
  OPT_LANGS_TO_REVERSED as OPT_LANGS_TO,
  OPT_TRANBOX_TRIGGER_CLICK,
  OPT_TRANBOX_TRIGGER_ALL,
  OPT_TRANBOX_BTN_POSITION_FIXED,
  OPT_TRANBOX_BTN_POSITION_ALL,
  OPT_TRANBOX_INTERACT_CLICK,
  OPT_TRANBOX_INTERACT_DBLCLICK,
  OPT_DICT_BING,
  OPT_DICT_ALL,
  OPT_SUG_ALL,
  OPT_SUG_YOUDAO,
  PROMPT_MODE_FOLLOW_API,
  getDictionaryPromptOptions,
  getPromptDisplayName,
  OPT_SKIPLANGS_SELECTION,
} from "../../config";
import ShortcutInput from "./ShortcutInput";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { useCallback, useMemo } from "react";
import { limitNumber } from "../../libs/utils";
import { useTranbox } from "../../hooks/Tranbox";
import { isExt } from "../../libs/client";
import { useApiList } from "../../hooks/Api";
import ValidationInput from "../../hooks/ValidationInput";
import { usePromptList } from "../../hooks/Prompt";

                                                              
const HIGHLIGHT_COLORS = [
  "#ff9800",     
  "#fbc02d",     
  "#43a047",     
  "#1e88e5",     
  "#8e24aa",     
  "#ec407a",     
  "#e53935",     
];

   
                              
   
export default function Tranbox() {
  const i18n = useI18n();
                   
  const { tranboxSetting, updateTranbox } = useTranbox();
               
                                           
  const { enabledApis, aiEnabledApis } = useApiList();
  const { prompts } = usePromptList();
                               
  const dictionaryPromptOptions = useMemo(
    () => getDictionaryPromptOptions(prompts),
    [prompts]
  );

                
  const handleChange = (e) => {
    e.preventDefault();
    let { name, value } = e.target;
                                                          
    switch (name) {
      case "btnOffsetX":
      case "btnOffsetY":
      case "boxOffsetX":
      case "boxOffsetY":
        value = limitNumber(value, -200, 200);
        break;
      default:
    }
    updateTranbox({
      [name]: value,
    });
  };

                
  const handleShortcutInput = useCallback(
    (val) => {
      updateTranbox({ tranboxShortcut: val });
    },
    [updateTranbox]
  );

               
  const {
    transOpen,
    apiSlugs,
    singleWordNoTrans = false,
    autoFavWord = false,
    wordBookHighlightColor = "#ec407a",
    fromLang,
    toLang,
    toLang2 = "en",
    tranboxShortcut,
    btnOffsetX,
    btnOffsetY,
    boxOffsetX = 0,
    boxOffsetY = 10,
    hideTranBtn = false,
    hideClickAway = false,
    simpleStyle = false,
    followSelection = false,
    autoHeight = false,
    triggerMode = OPT_TRANBOX_TRIGGER_CLICK,
    tranboxInteractMode = "-",
    btnPositionMode = OPT_TRANBOX_BTN_POSITION_FIXED,
    enDict = OPT_DICT_BING,
    enSug = OPT_SUG_YOUDAO,
    aiDictApiSlug = "-",
    aiDictPromptSlug = PROMPT_MODE_FOLLOW_API,
    blacklist = "",
    skipLangs = [],
  } = tranboxSetting;

  return (
    <Box>
      <Stack spacing={3}>
        {                            }
        <FormControlLabel
          control={
            <Switch
              size="small"
              name="transOpen"
              checked={transOpen}
              onChange={() => {
                updateTranbox({ transOpen: !transOpen });
              }}
            />
          }
          label={i18n("toggle_selection_translate")}
          sx={{ width: "fit-content" }}
        />

        {                            }
        <TextField
          select
          size="small"
          label={i18n("selection_skip_langs")}
          helperText={i18n("selection_skip_langs_helper")}
          name="skipLangs"
          value={skipLangs}
          onChange={handleChange}
          SelectProps={{
            multiple: true,
          }}
        >
          {OPT_SKIPLANGS_SELECTION.map(([langKey, langName]) => (
            <MenuItem key={langKey} value={langKey}>
              {langName}
            </MenuItem>
          ))}
        </TextField>

        {                 }
        <Box>
          <Grid container spacing={2} columns={12}>
            {                           }
            <Grid item xs={12} sm={12} md={6} lg={3}>
              <TextField
                select
                fullWidth
                size="small"
                name="apiSlugs"
                value={apiSlugs}
                label={i18n("translate_service_multiple")}
                onChange={handleChange}
                SelectProps={{
                  multiple: true,
                }}
              >
                {enabledApis.map((api) => (
                  <MenuItem key={api.apiSlug} value={api.apiSlug}>
                    {api.apiName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {                                                        }
            <Grid item xs={12} sm={12} md={6} lg={3}>
              <TextField
                fullWidth
                select
                size="small"
                name="singleWordNoTrans"
                value={singleWordNoTrans}
                label={i18n("single_word_no_trans")}
                onChange={handleChange}
              >
                <MenuItem value={false}>{i18n("disable")}</MenuItem>
                <MenuItem value={true}>{i18n("enable")}</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={12} md={6} lg={3}>
              <TextField
                fullWidth
                select
                size="small"
                name="autoFavWord"
                value={autoFavWord}
                label={i18n("auto_fav_word")}
                onChange={handleChange}
              >
                <MenuItem value={false}>{i18n("disable")}</MenuItem>
                <MenuItem value={true}>{i18n("enable")}</MenuItem>
              </TextField>
            </Grid>
            {                 }
            <Grid item xs={12} sm={12} md={6} lg={3}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 0.5 }}
              >
                {i18n("wordbook_highlight_color", "生词高亮颜色")}
              </Typography>
              <Stack direction="row" spacing={1}>
                {HIGHLIGHT_COLORS.map((color) => (
                  <Box
                    key={color}
                    onClick={() =>
                      updateTranbox({ wordBookHighlightColor: color })
                    }
                    sx={(theme) => ({
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      bgcolor: color,
                      cursor: "pointer",
                      border: `2px solid ${
                        wordBookHighlightColor === color
                          ? theme.palette.text.primary
                          : "transparent"
                      }`,
                      boxSizing: "border-box",
                      transition: "transform 0.15s ease",
                      "&:hover": { transform: "scale(1.15)" },
                    })}
                  />
                ))}
              </Stack>
            </Grid>
            {           }
            <Grid item xs={12} sm={12} md={6} lg={3}>
              <TextField
                fullWidth
                select
                size="small"
                name="fromLang"
                value={fromLang}
                label={i18n("from_lang")}
                onChange={handleChange}
              >
                {OPT_LANGS_FROM.map(([lang, name]) => (
                  <MenuItem key={lang} value={lang}>
                    {name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {                }
            <Grid item xs={12} sm={12} md={6} lg={3}>
              <TextField
                fullWidth
                select
                size="small"
                name="toLang"
                value={toLang}
                label={i18n("to_lang")}
                onChange={handleChange}
              >
                {OPT_LANGS_TO.map(([lang, name]) => (
                  <MenuItem key={lang} value={lang}>
                    {name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {                                         }
            <Grid item xs={12} sm={12} md={6} lg={3}>
              <TextField
                fullWidth
                select
                size="small"
                name="toLang2"
                value={toLang2}
                label={i18n("to_lang2")}
                helperText={i18n("to_lang2_helper")}
                onChange={handleChange}
              >
                <MenuItem value={"-"}>{i18n("disable")}</MenuItem>
                {OPT_LANGS_TO.map(([lang, name]) => (
                  <MenuItem key={lang} value={lang}>
                    {name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {              }
            <Grid item xs={12} sm={12} md={6} lg={3}>
              <TextField
                fullWidth
                select
                size="small"
                name="enDict"
                value={enDict}
                label={i18n("english_dict")}
                onChange={handleChange}
              >
                <MenuItem value={"-"}>{i18n("disable")}</MenuItem>
                {OPT_DICT_ALL.map((item) => (
                  <MenuItem value={item} key={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {                                     }
            <Grid item xs={12} sm={12} md={6} lg={3}>
              <TextField
                fullWidth
                select
                size="small"
                name="aiDictApiSlug"
                value={aiDictApiSlug}
                label={i18n("ai_dict_api", "AI词典接口")}
                onChange={handleChange}
              >
                <MenuItem value={"-"}>{i18n("disable")}</MenuItem>
                {aiEnabledApis.map((api) => (
                  <MenuItem value={api.apiSlug} key={api.apiSlug}>
                    {api.apiName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {                                     }
            <Grid item xs={12} sm={12} md={6} lg={3}>
              <TextField
                fullWidth
                select
                size="small"
                name="aiDictPromptSlug"
                value={aiDictPromptSlug}
                label={i18n("ai_dict_prompt", "AI词典提示词")}
                onChange={handleChange}
              >
                <MenuItem value={PROMPT_MODE_FOLLOW_API}>
                  {i18n("follow_api_prompt", "接口默认")}
                </MenuItem>
                {dictionaryPromptOptions.map((prompt) => (
                  <MenuItem value={prompt.slug} key={prompt.slug}>
                    {getPromptDisplayName(prompt, i18n)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={12} md={6} lg={3}>
              <TextField
                fullWidth
                select
                size="small"
                name="enSug"
                value={enSug}
                label={i18n("english_suggest")}
                onChange={handleChange}
              >
                <MenuItem value={"-"}>{i18n("disable")}</MenuItem>
                {OPT_SUG_ALL.map((item) => (
                  <MenuItem value={item} key={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {                                        }
            <Grid item xs={12} sm={12} md={6} lg={3}>
              <TextField
                fullWidth
                select
                size="small"
                name="triggerMode"
                value={triggerMode}
                label={i18n("trigger_mode")}
                onChange={handleChange}
              >
                {OPT_TRANBOX_TRIGGER_ALL.map((item) => (
                  <MenuItem key={item} value={item}>
                    {i18n(`trigger_${item}`)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {                                       }
            <Grid item xs={12} sm={12} md={6} lg={3}>
              <TextField
                fullWidth
                select
                size="small"
                name="btnPositionMode"
                value={btnPositionMode}
                label={i18n("tranbtn_position_mode")}
                onChange={handleChange}
              >
                {OPT_TRANBOX_BTN_POSITION_ALL.map((item) => (
                  <MenuItem key={item} value={item}>
                    {i18n(`tranbtn_position_${item}`)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {                                               }
            <Grid item xs={12} sm={12} md={6} lg={3}>
              <TextField
                fullWidth
                select
                size="small"
                name="hideTranBtn"
                value={hideTranBtn}
                label={i18n("hide_tran_button")}
                onChange={handleChange}
              >
                <MenuItem value={false}>{i18n("show")}</MenuItem>
                <MenuItem value={true}>{i18n("hide")}</MenuItem>
              </TextField>
            </Grid>
            {                             }
            <Grid item xs={12} sm={12} md={6} lg={3}>
              <TextField
                fullWidth
                select
                size="small"
                name="hideClickAway"
                value={hideClickAway}
                label={i18n("hide_click_away")}
                onChange={handleChange}
              >
                <MenuItem value={false}>{i18n("disable")}</MenuItem>
                <MenuItem value={true}>{i18n("enable")}</MenuItem>
              </TextField>
            </Grid>
            {                        }
            <Grid item xs={12} sm={12} md={6} lg={3}>
              <TextField
                fullWidth
                select
                size="small"
                name="simpleStyle"
                value={simpleStyle}
                label={i18n("use_simple_style")}
                onChange={handleChange}
              >
                <MenuItem value={false}>{i18n("disable")}</MenuItem>
                <MenuItem value={true}>{i18n("enable")}</MenuItem>
              </TextField>
            </Grid>
            {                                          }
            <Grid item xs={12} sm={12} md={6} lg={3}>
              <TextField
                fullWidth
                select
                size="small"
                name="followSelection"
                value={followSelection}
                label={i18n("follow_selection")}
                onChange={handleChange}
              >
                <MenuItem value={false}>{i18n("disable")}</MenuItem>
                <MenuItem value={true}>{i18n("enable")}</MenuItem>
              </TextField>
            </Grid>

            {                                      }
            <Grid item xs={12} sm={12} md={6} lg={3}>
              <ValidationInput
                fullWidth
                size="small"
                label={i18n("tranbtn_offset_x")}
                type="number"
                name="btnOffsetX"
                value={btnOffsetX}
                onChange={handleChange}
                min={-200}
                max={200}
              />
            </Grid>
            {                                      }
            <Grid item xs={12} sm={12} md={6} lg={3}>
              <ValidationInput
                fullWidth
                size="small"
                label={i18n("tranbtn_offset_y")}
                type="number"
                name="btnOffsetY"
                value={btnOffsetY}
                onChange={handleChange}
                min={-200}
                max={200}
              />
            </Grid>
            {                                   }
            <Grid item xs={12} sm={12} md={6} lg={3}>
              <ValidationInput
                fullWidth
                size="small"
                label={i18n("tranbox_offset_x")}
                type="number"
                name="boxOffsetX"
                value={boxOffsetX}
                onChange={handleChange}
                min={-200}
                max={200}
              />
            </Grid>
            {                                   }
            <Grid item xs={12} sm={12} md={6} lg={3}>
              <ValidationInput
                fullWidth
                size="small"
                label={i18n("tranbox_offset_y")}
                type="number"
                name="boxOffsetY"
                value={boxOffsetY}
                onChange={handleChange}
                min={-200}
                max={200}
              />
            </Grid>
            {                                           }
            <Grid item xs={12} sm={12} md={6} lg={3}>
              <TextField
                fullWidth
                select
                size="small"
                name="autoHeight"
                value={autoHeight}
                label={i18n("tranbox_auto_height")}
                onChange={handleChange}
              >
                <MenuItem value={false}>{i18n("disable")}</MenuItem>
                <MenuItem value={true}>{i18n("enable")}</MenuItem>
              </TextField>
            </Grid>

            {                            }
            <Grid item xs={12} sm={12} md={6} lg={3}>
              <TextField
                fullWidth
                select
                size="small"
                name="tranboxInteractMode"
                value={tranboxInteractMode}
                label={i18n("tranbox_interact_mode")}
                onChange={handleChange}
              >
                <MenuItem value="-">{i18n("disable")}</MenuItem>
                <MenuItem value={OPT_TRANBOX_INTERACT_CLICK}>
                  {i18n("tranbox_interact_click")}
                </MenuItem>
                <MenuItem value={OPT_TRANBOX_INTERACT_DBLCLICK}>
                  {i18n("tranbox_interact_dblclick")}
                </MenuItem>
              </TextField>
            </Grid>
            {                            }
            {!isExt && (
              <Grid item xs={12} sm={12} md={6} lg={3}>
                <ShortcutInput
                  value={tranboxShortcut}
                  onChange={handleShortcutInput}
                  label={i18n("trigger_tranbox_shortcut")}
                />
              </Grid>
            )}
          </Grid>
        </Box>

        {                          }
        <TextField
          size="small"
          label={i18n("blacklist")}
          helperText={i18n("pattern_helper")}
          name="blacklist"
          value={blacklist}
          onChange={handleChange}
          maxRows={10}
          multiline
        />
      </Stack>
    </Box>
  );
}
