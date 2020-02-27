import "./style.scss";
import config from "../../config";
import { debuglog } from "util";

export default function FeedbackControlPanel() {
  let container = null;
  let onCloseHandler = null;
  // let statusOnChange = null;
  let commentOnChange = null;
  let additionalFieldInputOnChange = null;
  let onSubmitHandler = null;
  let onRemoveHandler = null;
  let onRemoveMSHandler = null;
  let entityFieldInputOnChange = null;
  let feedbackObjects = [];
  let clearMultiSelectGraphics = null;
  let onSubmitMSHandler = null;

  // let statusData = [];

  //const 
  let state = {
    data: null,
    isSumbitCommentOnly: false,
    isMultiSelection: true
  };

  // const statusLookup = {
  //   // 1: "Add to Range",
  //   // 2: "Remove from Range",
  //   // 3: "Comment Only"
  //   1: "Add/Change",
  //   2: "Remove",
  // };

  const init = (options = {}) => {
    container = options.containerID
      ? document.getElementById(options.containerID)
      : null;

    onCloseHandler = options.onCloseHandler || null;

    // statusOnChange = options.statusOnChange || null;

    commentOnChange = options.commentOnChange || null;

    additionalFieldInputOnChange = options.additionalFieldInputOnChange || null;
    entityFieldInputOnChange = options.entityFieldInputOnChange || null;

    onSubmitHandler = options.onSubmitHandler || null;

    onRemoveHandler = options.onRemoveHandler || null;
    clearMultiSelectGraphics = options.clearMultiSelectGraphics || null;
    onSubmitMSHandler = options.onSubmitMSHandler || null;
    onRemoveMSHandler = options.onRemoveMSHandler || null

    if (!container) {
      console.error("containerID is required for FeedbackControlPanel");
      return;
    }

    feedbackObjects.push({ id: "field-markup", req: true, rep: "field-", value: null });
    feedbackObjects.push({ id: "field-comment", req: true, rep: "field-", value: null });
    config.FIELD_NAME.feedbackTable.additionalFields.forEach(addField => {
      feedbackObjects.push({ id: "additional-field-" + addField.field, req: addField.required, rep: "additional-field-", value: null });
    });

    initEventHandler();
  };

  const initState = data => {
    state.data = data;
    state.isSumbitCommentOnly = false;//+state.data.status === 3 ? true : false;
    state.isMultiSelection = data.isMultiSelection;
  };

  // const toggleIsSumbitCommentOnly = () => {
  //   state.isSumbitCommentOnly = !state.isSumbitCommentOnly;
  // };

  const toggleIsMultiSelection = () => {
    // alert(state.isMultiSelection);
    state.isMultiSelection = !state.isMultiSelection;
    if (state.isMultiSelection === true) {
      document.getElementById("feedbackControlPanelMultiSelectInfo").style.display = "block";
      document.getElementsByClassName('esri-sketch')[0].style.display = "block";
      const modal = document.getElementById("myModal");
      modal.setAttribute('multi_selection', 'true');
      try { document.getElementById("fbSaveMS").style.display = "block"; } catch{ }
      try { document.getElementById("fbSave").style.display = "none"; } catch{ }
      // document.getElementById("markupLabel").style.display = "none";
      try { document.getElementById("fbReset").style.display = "none"; } catch{ }
      try { document.getElementById("fbResetMS").style.display = "block"; } catch{ }
      document.getElementById('curEcoSelected').style.display = "none";
      document.getElementById('fbTitle').innerText = 'Multiple Ecoshapes selected';
      try { document.getElementById('field-comment').value = ""; } catch{ }
      try { document.getElementById('additional-field-reference').value = ""; } catch{ }
      document.getElementById("field-markup").selectedIndex = "0";

    }
    else {
      document.getElementById("feedbackControlPanelMultiSelectInfo").style.display = "none";
      document.getElementsByClassName('esri-sketch')[0].style.display = "none";
      clearMultiSelectGraphics();
      const modal = document.getElementById("myModal");
      modal.setAttribute('multi_selection', 'false');
      try { document.getElementById("fbSaveMS").style.display = "none"; } catch{ }
      try { document.getElementById("fbSave").style.display = "block"; } catch{ }
      // document.getElementById("markupLabel").style.display = "block";
      try { document.getElementById("fbReset").style.display = "block"; } catch{ }
      try { document.getElementById("fbResetMS").style.display = "none"; } catch{ }
      document.getElementById('curEcoSelected').style.display = "block";
      const hucName = state.data.ecoAtts.ecoshapename || "";
      document.getElementById('fbTitle').innerText = `Ecoshape: ${hucName}`;
      try { document.getElementById('field-comment').value = ""; } catch{ }
      try { document.getElementById('additional-field-reference').value = ""; } catch{ }
      try { document.getElementById('field-comment').value = document.getElementById('field-comment').getAttribute('defaultvalue'); } catch{ }
      try { document.getElementById('additional-field-reference').value = document.getElementById('additional-field-reference').getAttribute('defaultvalue'); } catch{ }
      document.getElementById("field-markup").selectedIndex = "0";
      //need to clear graphics
      //defaultvalue
    }

  };

  const resetState = () => {
    state.data = null;
    state.isSumbitCommentOnly = false;
  };


  const render = () => {
    try {
      const modal = document.getElementById("myModal");
      var ms = modal.getAttribute('multi_selection');
      if (ms && ms == "true") state.isMultiSelection = true;
    }
    catch (e) {
      console.log(e);
    }

    if (state.data) {
      feedbackObjects.map(el => {
        switch (el.rep) {
          case "field-":
            el.value = state.data[el.id.replace(el.rep, '')];
            break;
          case "additional-field-":
            el.value = state.data.additionalFields[el.id.replace(el.rep, '')];
            break;
        }
      });
    }

    const hucName = state.data.ecoAtts.ecoshapename || "";
    const comment = state.data.comment || "";

    let componentHtml = `
            <div id='feedbackControlPanelContainer' class='panel panel-black'>

                <div class='trailer-0 text-right close-btn'>
                    <span class='icon-ui-left-arrow js-close'></span>
                </div>

                <div class='leader-half trailer-half' style='margin-top:0px'>`;
    componentHtml += (state.isMultiSelection) ? `<span class='font-size-0' id="fbTitle">Multiple Ecoshapes selected</span>` : `<span class='font-size-0' id="fbTitle">Ecoshape: ${hucName}</span>`;
    componentHtml += `  
                    <hr>
                </div>

                <div class='feedbackControlPanelData'>
                    <div id='actionDialogWrap'>`;
    // componentHtml += (state.isMultiSelection) ? `<span class='font-size-0'>Ecoshape: ${hucName}</span>` : ``;

    componentHtml += `${getHtmlForActions()}
                    </div>

                    <div id='removeReason'>
                    
                    </div>

                    <div class='comment-dialog'>
                        <label class="feedback">
                            <br>
                            <span class='font-size--3'>Comment (required):</span>
                            <textarea type="text" id="field-comment" placeholder="" class="comment-textarea" maxlength="4095" defaultValue="${comment}">${comment}</textarea>
                        </label>
                    </div>

                    <div class='additional-field-dialog'>
                        ${getHtmlForAdditionalFields()}
                    </div>

<!--
                    <div class='flex-container' style="margin-left:2px;">
                      <div class='inline-block'>
                      <span class="toggle-switch-label font-size--3 action-message">
                       Multi-Selection 
                      </span>
                        <label class="toggle-switch feedback">
                          <input type="checkbox" class="toggle-switch-input" id="toggleMS" ${
      state.isMultiSelection ? "checked" : ""
      }>
                        <span class="toggle-switch-track margin-right-1"></span>
                      </label>
                     </div> 
                    </div>
-->
                    <div id="feedbackControlPanelMultiSelectInfo" style="flex;flex-direction:row;display:${state.isMultiSelection ? "block" : "none"};" class="font-size--3 meta">
                    <span style="color:lightpink">WARNING: existing Markup for the selected Ecoshapes will be replaced on Save.</span>
                       <div>Ecoshape(s):<span id="feedbackControlPanelMSIecoshapes" style="margin-left:5px;"></span></div>
                       <div>Terrestrial Area:<span id="feedbackControlPanelMSIarea" style="margin-left:5px;"></span></div>
                        <div>Terrestrial Proportion:<span id="feedbackControlPanelMSIproportion" style="margin-left:5px;"></span></div>
                   
                        </div>

                </div>

                <div class='trailer-half'>
                    ${getHtmlForBtns(state.data.isSaved)}
                </div>
            </div>
        `;

    container.innerHTML = componentHtml;
    addSwitcherOnMultiSelectionHandler();
    enableSaveButton();
    enableSaveMSButton();
    // console.log('render feedback control panel', state.data);
  };

  // const refreshActionDialog = ()=>{
  //     document.getElementById('actionDialogWrap').innerHTML = getHtmlForActions();
  // };

  // const getLabelForTextInput = ()=>{
  //     return state.isSumbitCommentOnly ? statusLookup[3] : 'Comment'
  // }

  const getHtmlForActions = () => {
    //let status = getNewStatus();

    // const isChecked = state.isSumbitCommentOnly ? '' : 'is-checked';

    // const outputHtml = `<div class='action-dialog trailer-half font-size--1 ${isChecked}'>
    //     <div class='inline-block'>
    //         <span class='icon-ui-checkbox-checked js-toggle-is-comment-only'></span>
    //         <span class='icon-ui-checkbox-unchecked js-toggle-is-comment-only'></span>
    //     </div>
    //     <span class='action-message'>${statusLookup[+status]}</span>
    // </div>`

    // const isChecked = state.isSumbitCommentOnly ? '' : 'checked';

    let EA = state.data.ecoAtts;
    let parentEco = EA.parentecoregionfr ? EA.parentecoregion + " (" + EA.parentecoregionfr + ")" : EA.parentecoregion;
    let ecoZone = EA.ecozonefr ? EA.ecozone + " (" + EA.ecozonefr + ")" : EA.ecozone;
    let terrArea = (EA.terrestrialarea / 1000000).toLocaleString('en-us', { 'maximumFractionDigits': 2 });
    let terrProp = EA.terrestrialproportion * 100;
    let huc = state.data.hucForSpeciesData;
    let presence = ' '
    let hucNotes = ' '
    // Only have presence or notes for previously modelled ecoshapes, ones to be added do not have presence
    if (huc.length > 0) {
      hucNotes = huc[0].rangemapecoshapenotes;
      if (config.PRESENCE) {
        config.PRESENCE.map(d => {
          if (d.code == huc[0].presence) {
            presence = d.text;
          }
        });
      }
    }


    let outputHtml = ``;

    if (!state.isMultiSelection) {
      outputHtml += `<div class='flex-container'>
    <div class='inline-block' id="curEcoSelected">
      <p class="font-size--3 meta">
        <!--<strong>Ecoshape:</strong> ${EA.ecoshapename} <br>-->
        <strong>Parent Ecoregion:</strong> ${parentEco} <br>
        <strong>Ecozone:</strong> ${ecoZone}<br>
        <strong>Terrestrial Area:</strong> ${terrArea} km&sup2;<br>
        <strong>Terrestrial Proportion:</strong> ${terrProp.toFixed(1)}%    <br>  
        <strong>Presence:</strong> ${presence}  <br>     
        <strong>Metadata:</strong> ${hucNotes} <br>     
      </p>  
    </div>
    </div>       
    `;
    }
    let range = [];


    if (state && state.data) {

      range.push({ code: "null", text: "None set", status: true });

      config.PRESENCE.map(d => {

        if (state && state.data && state.data.isHucInModeledRange) {
          if (state && state.data && state.data.hucForSpeciesData && state.data.hucForSpeciesData.length > 0 &&
            state.data.hucForSpeciesData[0].presence.toUpperCase() != d.code.toUpperCase()) {
            if (state && state.data && state.data.markup && state.data.markup.toUpperCase() == d.code.toUpperCase()) {
              range.push({ code: d.code, text: d.text, status: true });
            } else {
              range.push({ code: d.code, text: d.text, status: false });
            }
          }
        } else {
          if (state && state.data && state.data.markup && state.data.markup.toUpperCase() == d.code.toUpperCase()) {
            range.push({ code: d.code, text: d.text, status: true });
          } else {
            range.push({ code: d.code, text: d.text, status: false });
          }

        }

      });
      if (state && state.data && state.data.isHucInModeledRange) {
        if (state.data.markup && state.data.markup.toUpperCase() === "R") {
          range.push({ code: "R", text: "Remove", status: true });
        }
        else {
          range.push({ code: "R", text: "Remove", status: false });
        }
      }
    }


    // outputHtml += `
    //     <div class='flex-container'><label class="feedback" id="markupLabel" style="display:${state.isMultiSelection ? "none" : "block"};"> <span class="font-size--3">Markup (required):</snap>
    //         <select style="width:100%" id="field-markup" required>`;
    outputHtml += `<br>
    <div class='flex-container'><label class="feedback" id="markupLabel" > <span class="font-size--3">Markup (required):</snap>
        <select style="width:100%" id="field-markup" required>`;

    range.map(item => {

      if (item) {

        if (item['status']) {
          outputHtml += '<option style="background-color:lightgray;" value="' + item['code'] + '" disabled selected>' + item['text'] + '</option>';
        }
        else {
          outputHtml += '<option value="' + item['code'] + '">' + item['text'] + '</option>';
        }
      }
    });

    outputHtml += `</select></label></div>`;
    return outputHtml;
  };


  // Adds select, textarea, text, and label entries to the feedback container depending on configuration
  const getHtmlForAdditionalFields = () => {
    let outputHtml = "";

    if (
      config.FIELD_NAME.feedbackTable.additionalFields &&
      config.FIELD_NAME.feedbackTable.additionalFields.length > 0
    ) {
      outputHtml += `<div class='vertical-flex-container'>`;

      let fieldValue = null;
      config.FIELD_NAME.feedbackTable.additionalFields.forEach(addField => {

        if (addField.field == "removalreason") { return; }
        if (!addField.visible) { return; }

        fieldValue =
          state.data.additionalFields[addField.field] ||
          (addField.editable ? "" : ((typeof addField.editable === "object") ? { code: "null", desc: "None set" } : "None set"));
        outputHtml += `<br>
                <label class="markup"  >
                    <span class='font-size--3'>${
          addField.display ? addField.display : addField.field
          }:</span>
                `;

        if (addField.editable) {
          if (
            typeof addField.editable === "object" &&
            addField.editable.length
          ) {
            outputHtml += `
                  <select id="additional-field-${
              addField.field
              }" class="additional-field-select additional-field-input"  defaultValue="">
                    ${
              fieldValue === ""
                ? '<option value="null" selected>None set</option>'
                : ""
              }
                `;

            addField.editable.forEach(value => {

              outputHtml += `
                 <option value="${value.code}" ${
                fieldValue === value.code ? "selected" : ""
                }>${value.desc}</option>
                    `;
            });

            outputHtml += `
                  </select>
                `;
          } else if (addField.editable === "textarea") {
            outputHtml += `
              <textarea id="additional-field-${
              addField.field
              }" class="additional-field-textarea additional-field-input" ${
              addField.maxlength ? `maxlength="${addField.maxlength}"` : ""
              } defaultvalue="${fieldValue ? fieldValue : ""}">${fieldValue ? fieldValue : ""}</textarea>
            `;
          } else {
            outputHtml += `
                    <input type="text" id="additional-field-${
              addField.field
              }" class="additional-field-text additional-field-input" ${
              addField.maxlength ? `maxlength="${addField.maxlength}"` : ""
              } value="${fieldValue ? fieldValue : ""}"/>
            `;
          }
        } else {
          outputHtml += `
                    <span class='font-size--2'>${fieldValue}</span>
            `;
        }
        outputHtml += `</label>`;
      });

      outputHtml += `</div>`;
    }
    return outputHtml;
  };

  const getHtmlForBtns = isSaved => {
    // const newStatus = isHucInModeledRange ? 2 : 1;
    let saveBtn = `<button disabled class="btn btn-fill js-submit-feedback trailer-half" id="fbSave" style="display:${state.isMultiSelection ? "none" : "block"};"> Save </button>`;

    if (!state.isMultiSelection) {
      saveBtn += ` <button class="btn btn-half btn-grouped js-submit-feedbackMS" style="display:none;width:100%" id="fbSaveMS"> Save Multi-Selection</button>`;
    }
    else {
      saveBtn += ` <button class="btn btn-half btn-grouped js-submit-feedbackMS" style="display:block;width:100%" id="fbSaveMS"> Save Multi-Selection</button>
      <button class="btn btn-half btn-grouped js-remove-feedbackMS" style="display:none;width:100%" id="fbResetMS"> Reset Multi-Selection</button>`;
    }

    // const updateBtn = `<button class="btn btn-fill js-submit-feedback trailer-half"> Save </button>`;
    // const removeBtn = `<button class="btn btn-fill js-remove-feedback trailer-half"> Reset </button>`;

    let btnsForExistingItem = `
            <nav class='trailer-half'>
                <button class="btn btn-half btn-grouped btn-transparent js-remove-feedback trailer-half;color: lightblue;" id="fbReset" style="display:${state.isMultiSelection ? "none" : "block"};"> Reset </button>`;
    btnsForExistingItem += `<button class="btn btn-half btn-grouped js-submit-feedback trailer-half" id="fbSave" style="display:${state.isMultiSelection ? "none" : "block"};"> Save </button>`;

    if (!state.isMultiSelection)
      btnsForExistingItem += `
      <button class="btn btn-half btn-grouped js-remove-feedbackMS btn-transparent trailer-half" style="display:none;width:50%;color: lightblue;padding: 5px;" id="fbResetMS"> Reset Multi-Selection</button>
      <button class="btn btn-half btn-grouped js-submit-feedbackMS trailer-half" style="display:none;width:50%;padding: 5px;" id="fbSaveMS"> Save Multi-Selection</button>
      `;
    else
      btnsForExistingItem += `
      <button class="btn btn-half btn-grouped js-remove-feedbackMS btn-transparent trailer-half" style="display:block;width:50%;color: lightblue;padding: 5px;" id="fbResetMS"> Reset Multi-Selection</button>
      <button class="btn btn-half btn-grouped js-submit-feedbackMS trailer-half"  style="display:block;width:50%;margin-left:2px;padding: 5px;" id="fbSaveMS"> Save Multi-Selection</button>
      `;

    btnsForExistingItem += `</nav>`;

    return isSaved ? btnsForExistingItem : saveBtn;
  };


  const addSwitcherOnMultiSelectionHandler = () => {
    var element = document.getElementById('toggleMS');
    element.addEventListener("change", evt => {
      console.log("toggle-switch-input MS on change", evt);
      toggleIsMultiSelection();
    });
  }

  const getNewStatus = () => {
    let markup = feedbackObjects.find(el => { return el.id == 'field-markup' });
    return state.data.isHucInModeledRange && markup && markup.value == 'R' ? 2 : 1;
  };

  const enableSaveButton = () => {
    try {
      var enable = true;
      feedbackObjects.map(el => {
        if (
          (el.req && el.id != "additional-field-removalreason" && (!el.value || el.value == '' || el.value == 'null'))
          || (el.req && el.id == "additional-field-removalreason" && (fieldMarkupVal == 'R') && (!el.value || el.value == '' || el.value == 'null'))
        ) enable = false;
      });
      const btn = document.getElementsByClassName("js-submit-feedback");
      if (btn) {
        if (!enable) {
          btn[0].disabled = true;
        } else {
          btn[0].disabled = false;
        }
      }
    } catch{ }
  }

  const enableSaveMSButton = () => {
    try {
      var enable = true;
      feedbackObjects.map(el => {
        if (
          (el.req && el.id != "field-markup" && el.id != "additional-field-removalreason" && (!el.value || el.value == '' || el.value == 'null'))
          // || (el.req && el.id == "additional-field-removalreason" && (fieldMarkupVal == 'R') && (!el.value || el.value == '' || el.value == 'null'))
        ) enable = false;
      });
      const btn = document.getElementsByClassName("js-submit-feedbackMS");
      if (btn) {
        if (!enable) {
          btn[0].disabled = true;
        } else {
          btn[0].disabled = false;
        }
      }
    } catch{ }
  }


  const initEventHandler = () => {
    container.addEventListener("click", function (event) {
      if (event.target.classList.contains("js-close")) {
        // console.log('close feedback control panel');
        if (onCloseHandler) {
          onCloseHandler();
        }
      } else if (event.target.classList.contains("js-submit-feedback")) {
        // console.log('close feedback control panel');
        // const newStatus = event.target.dataset.status || null;
        const newStatus = getNewStatus();
        if (onSubmitHandler) {
          onSubmitHandler(newStatus);
        }
      } else if (event.target.classList.contains("js-remove-feedback")) {
        if (onRemoveHandler) {
          onRemoveHandler();
        }
      }
      else if (event.target.classList.contains("js-submit-feedbackMS")) {
        if (onSubmitMSHandler) {
          onSubmitMSHandler();
        }
      }
      else if (event.target.classList.contains("js-remove-feedbackMS")) {
        if (onRemoveMSHandler) {
          onRemoveMSHandler();
        }
      }
    });


    container.addEventListener("input", function (event) {
      if (!(event && event.target)) return;

      var fieldMarkupVal = null;
      var targetField = "";
      feedbackObjects.map(el => {

        if (el.id == event.target.id) {
          el.value = event.target.value;
          targetField = event.target.id.replace(
            el.rep,
            ""
          );
          switch (el.rep) {
            case 'field-':
              var fieldName = el.id.replace('field-', '');
              if (entityFieldInputOnChange) {
                entityFieldInputOnChange(fieldName, event.target.value);
              }
              break;
            case 'additional-field-':
              if (additionalFieldInputOnChange) {
                additionalFieldInputOnChange(targetField, event.target.value);
              }
              break;
            default:
          }
        }
        if (el.id == "field-markup") fieldMarkupVal = el.value;

      });
      console.log('feedbackObjects', feedbackObjects)

      enableSaveButton();
      enableSaveMSButton();
    });




    container.addEventListener('change', function (event) {
      if (!(event && event.target && event.target.id)) return;
      if (event.target.id != "field-markup") return;

      var selValue = event.srcElement.value;
      var removeReason = document.getElementById('removeReason');

      if (selValue == "R") {

        if (document.getElementById('esriRemovalReason') != null) return;
        // Add a removal reason drop down only when removing a species
        var outputHtml = '<div id="esriRemovalReason">';
        outputHtml += `<span class='font-size--3'>Removal Reason (required):</span>
      <select id="additional-field-removalreason" class="additional-field-select additional-field-input" style="width:100%;">`;
        outputHtml += `<option value="null">Not set</option>`;
        const remReasons = config.REMOVAL;
        remReasons.map(d => {
          let c = d.attributes.removalcode;
          let t = d.attributes.removaltext;
          let s = "";
          if (state.data.additionalFields.removalreason) {
            if (c === state.data.additionalFields.removalreason) {
              s = "selected";
            }
          }
          outputHtml += `<option ${s} value="${c}">${t}</option>`;
        });

        // outputHtml += `</select></label></div>`;
        outputHtml += `</select></div>`;
        removeReason.innerHTML = outputHtml;
      }
      else {
        removeReason.innerHTML = '';
      }


    });

    // container.addEventListener('click', function (event){
    //     if (event.target.classList.contains('js-submit-feedback')) {
    //         // console.log('close feedback control panel');
    //         const newStatus = event.target.dataset.status || null;
    //         if(onSubmitHandler){
    //             onSubmitHandler(newStatus);
    //         }
    //     }
    // });
  };

  const open = (data = {}) => {
    initState(data);
    render();
  };

  const close = () => {
    resetState();
    container.innerHTML = "";
  };

  const setTotal = (data = []) => {

  };

  // const setStatusData = (data=[])=>{
  //     statusData = data;
  //     // console.log('setStatusData', statusData);
  // };

  return {
    init,
    open,
    close,
    setTotal
    // setStatusData
  };
}
