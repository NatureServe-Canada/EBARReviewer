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
      document.getElementById('sketchWidget').style.display = "block";
      const modal = document.getElementById("myModal");
      modal.setAttribute('multi_selection', 'true');
      try { document.getElementById("fbSaveMS").style.display = "block"; } catch{ }
      try { document.getElementById("fbSave").style.display = "none"; } catch{ }
      // document.getElementById("markupLabel").style.display = "none";
      try { document.getElementById("fbReset").style.display = "none"; } catch{ }
      try { document.getElementById("fbResetMS").style.display = "block"; } catch{ }
      try { document.getElementById('curEcoSelected').style.display = "none"; } catch{ }
      try { document.getElementById('fbTitle').innerText = 'Multiple Ecoshapes selected'; } catch{ }
      try { document.getElementById('field-comment').value = ""; } catch{ }
      try { document.getElementById('additional-field-reference').value = ""; } catch{ }
      try { document.getElementById("field-markup").selectedIndex = "0"; } catch{ }

      
      // add multiple selections dropdown options if hasn't added yet
      let x = document.getElementById("field-markup");
      let valueArr = []

      for (let i = 0; i< x.options.length; i++)
      {
        valueArr.push(x.options[i].value)
      }

      let newOption = document.createElement("option");
      if (valueArr.includes('R'))
      {
        newOption.text = "Present";
        newOption.value = "P"
        x.add(newOption, x.options[1]);
      }
      else 
      {
        newOption.text = "Remove";
        newOption.value = "R"
        x.add(newOption);
      }
    }
    else {
      document.getElementById("feedbackControlPanelMultiSelectInfo").style.display = "none";
      document.getElementsByClassName('esri-sketch')[0].style.display = "none";
      document.getElementById('sketchWidget').style.display = "none";
      clearMultiSelectGraphics();
      const modal = document.getElementById("myModal");
      modal.setAttribute('multi_selection', 'false');
      try { document.getElementById("fbSaveMS").style.display = "none"; } catch{ }
      try { document.getElementById("fbSave").style.display = "block"; } catch{ }
      // document.getElementById("markupLabel").style.display = "block";
      try { document.getElementById("fbReset").style.display = "block"; } catch{ }
      try { document.getElementById("fbResetMS").style.display = "none"; } catch{ }
      try { document.getElementById('curEcoSelected').style.display = "block"; } catch{ }
      try {
        const hucName = state.data.ecoAtts.ecoshapename || "";
        document.getElementById('fbTitle').innerText = `Ecoshape: ${hucName}`;
      } catch{ }
      try { document.getElementById('field-comment').value = ""; } catch{ }
      try { document.getElementById('additional-field-reference').value = ""; } catch{ }
      try { document.getElementById('field-comment').value = document.getElementById('field-comment').getAttribute('defaultvalue'); } catch{ }
      try { document.getElementById('additional-field-reference').value = document.getElementById('additional-field-reference').getAttribute('defaultvalue'); } catch{ }
      try { document.getElementById("field-markup").selectedIndex = "0"; } catch{ }
      // remove the options added for the multi-select
      let x = document.getElementById("field-markup");
      if (state.data.isHucInModeledRange) x.remove(1)
      else x.remove(4)
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
      if (ms && ms == "true") { 
        state.isMultiSelection = true; 
        document.getElementsByClassName('esri-sketch')[0].style.display = "block"; 
        document.getElementById('sketchWidget').style.display = "block";
      }
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
    componentHtml += (state.isMultiSelection) ? `<span class='font-size-0' id="fbTitle" data-i18n="multi_sel_title">${$.i18n('multi_sel_title')}</span>` : `<span class='font-size-0' id="fbTitle">Ecoshape: ${hucName}</span>`;
    componentHtml += `  
                    <hr>
                </div>

                <div class='feedbackControlPanelData' id="feedbackMainArea">
                    <div id='actionDialogWrap'>`;
    // componentHtml += (state.isMultiSelection) ? `<span class='font-size-0'>Ecoshape: ${hucName}</span>` : ``;

    componentHtml += `${getHtmlForActions()}
                    </div>

                    <div id='removeReason'>
                    ${getHtmlForAdditionalFieldsRemoveReason()}
                    </div>

                    <div class='comment-dialog'>
                        <label class="feedback">
                            <br>
                            <span class='font-size--3'>${$.i18n('comment')}</span>
                            <textarea type="text" id="field-comment" placeholder="" class="comment-textarea" maxlength="4095" defaultValue="${comment}">${comment}</textarea>
                        </label>
                    </div>

                    <div class='additional-field-dialog'>
                         ${getHtmlForAdditionalFields()} 
                    </div>


                    <div class='flex-container' style="margin-left:2px;display:${config.isMultiSelection ? "block" : "none"};">
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

                    <div id="feedbackControlPanelMultiSelectInfo" style="flex;flex-direction:row;display:${state.isMultiSelection ? "block" : "none"};" class="font-size--3 meta">
                      <span style="color:lightpink">${$.i18n('warning_markup')}</span>
                       <div>Ecoshape(s):<span id="feedbackControlPanelMSIecoshapes" style="margin-left:5px;"></span></div>
                       <div>${$.i18n('ter_area')}<span id="feedbackControlPanelMSIarea" style="margin-left:5px;"></span></div>
                        <div>${$.i18n('ter_proportion')}<span id="feedbackControlPanelMSIproportion" style="margin-left:5px;"></span></div>
                   
                        </div>

                </div>

                <div class='trailer-half' id="fbBtns">
                    ${getHtmlForBtns(state.data.isSaved)}
                </div>
            </div>
        `;

    container.innerHTML = componentHtml;
    addSwitcherOnMultiSelectionHandler();
    enableSaveButton();
    enableSaveMSButton();

    let ecoTitle = document.getElementById('fbTitle');
    let feedbackDiv = document.getElementById('feedbackMainArea')
    console.log(ecoTitle.offsetHeight)
    
    if (ecoTitle && feedbackDiv){
      //let ecoTitleLen = ecoTitle.innerHTML.length;
      //console.log('title length: ', ecoTitleLen);
      // 19 appears to be the height when its a single line.
      if (ecoTitle.offsetHeight > 19){
        feedbackDiv.style = "height:84%"
      }
      else{
        feedbackDiv.style = "height:87%"
      }
    }
  };

  // const refreshActionDialog = ()=>{
  //     document.getElementById('actionDialogWrap').innerHTML = getHtmlForActions();
  // };


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
    // get the Species dropdown selected value from the dom 
    let e = document.getElementById('speciesSelector')
    let selectedSpecies = e.options[e.selectedIndex].innerText
    if (!state.isMultiSelection) {
      outputHtml += `<div class='flex-container'>
    <div class='inline-block' id="curEcoSelected">

      <p class="font-size--3 meta">
        <!--<strong>Ecoshape:</strong> ${EA.ecoshapename} <br>-->
        <strong>${$.i18n('parent_ecoregion')}:</strong> ${parentEco} <br>
        <strong>${$.i18n('ecozone')}:</strong> ${ecoZone}<br>
        <strong>${$.i18n('ter_area')}:</strong> ${terrArea} km&sup2;<br>

        <strong>${$.i18n('ter_proportion')}:</strong> ${terrProp.toFixed(1)}%    <br>  
        <strong>${$.i18n('presence')}:</strong> ${presence}  <br>
        <strong>${$.i18n('species')}:</strong> ${selectedSpecies} <br>     
        <strong>${$.i18n('metadata')}</strong> ${hucNotes} <br>

      </p>  
    </div>
    </div>       
    `;
    }
    let range = [];

    if (state && state.data) {
      range.push({ code: "null", text: "None set", status: true });
      // if the multi select is turned on, add all options
      if (state.isMultiSelection)
      {
        config.PRESENCE.map(d => {
          range.push({ code: d.code, text: d.text, status:false });
        })
        range.push({ code: "R", text: "Remove", status: false });
      }
      else 
      {
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
          else {
            if (state && state.data && state.data.hucForSpeciesData && state.data.hucForSpeciesData.length == 0 && d.code.toUpperCase() != 'P') {
              range.push({ code: d.code, text: d.text, status: (state.data.markup && state.data.markup.toUpperCase() == d.code.toUpperCase()) ? true : false });
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
    }


    // outputHtml += `
    //     <div class='flex-container'><label class="feedback" id="markupLabel" style="display:${state.isMultiSelection ? "none" : "block"};"> <span class="font-size--3">Markup (required):</snap>
    //         <select style="width:100%" id="field-markup" required>`;
    outputHtml += `<br>
    <div class='flex-container'><label class="feedback" id="markupLabel" > <span class="font-size--3">${$.i18n('markup_req')}:</snap>
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


  const getHtmlForAdditionalFieldsRemoveReason = () => {
    let outputHtml = "";
    if (!state.data.markup || (state.data.markup && state.data.markup != 'R')) return outputHtml;
    if (
      config.FIELD_NAME.feedbackTable.additionalFields &&
      config.FIELD_NAME.feedbackTable.additionalFields.length > 0
    ) {

      config.FIELD_NAME.feedbackTable.additionalFields.forEach(addField => {
        if (addField.field == "removalreason") {

          if (state.data.additionalFields.removalreason && state.data.additionalFields.removalreason.length > 0) {
            outputHtml = '<div id="esriRemovalReason">';
            outputHtml += `<br><span class='font-size--3'>${$.i18n('rem_reason_req')}:</span>
          <select id="additional-field-removalreason" class="additional-field-select additional-field-input" style="width:100%;">`;
            outputHtml += `<option style="background-color:lightgray;" disabled selected value="null">None set</option>`;
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

            outputHtml += `</select></div>`;
          }
        }
      });
    }
    return outputHtml;
  }

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

        var display = addField.display ? $.i18n(addField.display) : addField.field;

        // outputHtml += `<br><label class="markup" ><span class='font-size--3'>${addField.display ? addField.display : addField.field}:</span >`;
        outputHtml += `<br><label class="markup" ><span class='font-size--3'>${display}:</span >`;

        if (addField.editable) {
          if (
            typeof addField.editable === "object" &&
            addField.editable.length
          ) {
            outputHtml += `
      < select id = "additional-field-${
              addField.field
              } " class="additional - field - select additional - field - input"  defaultValue="">
    ${
              fieldValue === ""
                ? '<option disabled value="null" selected>None set</option>'
                : ""
              }
    `;

            addField.editable.forEach(value => {

              outputHtml += `
      < option value = "${value.code}" ${
                fieldValue === value.code ? "selected" : ""
                }> ${value.desc}</option >
      `;
            });

            outputHtml += `
                  </select >
    `;
          } else if (addField.editable === "textarea") {
            outputHtml += `<textarea id="additional-field-${addField.field}" class="additional-field-textarea additional-field-input" ${addField.maxlength ? `maxlength="${addField.maxlength}"` : ""} defaultvalue="${fieldValue ? fieldValue : ""}" > ${fieldValue ? fieldValue : ""}</textarea>`;
          } else {
            outputHtml += `<input type = "text" id = "additional-field-${addField.field}" class="additional-field-text additional-field-input" ${addField.maxlength ? `maxlength="${addField.maxlength}"` : ""} value = "${fieldValue ? fieldValue : ""}" />`;
          }
        } else {
          outputHtml += `<span class='font-size--2' > ${fieldValue}</span>`;
        }
        outputHtml += `</label > `;
      });

      outputHtml += `</div > `;
    }
    return outputHtml;
  };

  const getHtmlForBtns = isSaved => {
    // const newStatus = isHucInModeledRange ? 2 : 1;
    let MS = $.i18n('multi_sel');
    let reset = $.i18n('reset');
    let save = $.i18n('save');
    let btnsForExistingItem = ``;

    let saveBtn = `<button disabled class="btn btn-fill js-submit-feedback trailer-half" id="fbSave" style="display:${state.isMultiSelection ? 'none' : 'block'}" > ${save} </button > `;


    // let saveBtn = `< button disabled class="btn btn-fill js-submit-feedback trailer-half" id="fbSave" style="display:${state.isMultiSelection} ? 'none' : 'block';" > ${save} </button > `;

    if (!state.isMultiSelection) {
      saveBtn += ` <button class="btn btn-half btn-grouped js-submit-feedbackMS" style = "display:none;width:100%" id="fbSaveMS" > ${save} ${MS}</button> `;
    }
    else {
      saveBtn += ` <button class="btn btn-half btn-grouped js-submit-feedbackMS" style = "display:block;width:100%" id="fbSaveMS" > ${save} ${MS}</button>
  <button class="btn btn-half btn-grouped js-remove-feedbackMS" style="display:none;width:100%" id="fbResetMS"> ${reset} ${MS}</button>`;
    }

    // const updateBtn = `< button class="btn btn-fill js-submit-feedback trailer-half" > Save </button > `;
    // const removeBtn = `< button class="btn btn-fill js-remove-feedback trailer-half" > Reset </button > `;

    btnsForExistingItem = `<nav class='trailer-half' > <button class="btn btn-half btn-grouped btn-transparent js-remove-feedback trailer-half;color: lightblue;" id="fbReset" style="display:${state.isMultiSelection ? 'none' : 'block'};" > ${reset} </button> `;
    btnsForExistingItem += `<button class="btn btn-half btn-grouped js-submit-feedback trailer-half" id="fbSave" style="display:${state.isMultiSelection ? 'none' : 'block'};" > ${save} </button> `;

    if (!state.isMultiSelection)
      btnsForExistingItem += `<button class="btn btn-half btn-grouped js-remove-feedbackMS btn-transparent trailer-half" style = "display:none;width:50%;color:lightblue;padding: 5px;" id="fbResetMS" > ${reset} ${MS}</button>
    <button class="btn btn-half btn-grouped js-submit-feedbackMS trailer-half" style="display:none;width:50%;padding: 5px;" id="fbSaveMS"> ${save} ${MS}</button>`;
    else
      btnsForExistingItem += `<button class="btn btn-half btn-grouped js-remove-feedbackMS btn-transparent trailer-half" style="display:block;width:50%;color: lightblue;padding: 5px;" id="fbResetMS" > ${reset} ${MS}</button>
    <button class="btn btn-half btn-grouped js-submit-feedbackMS trailer-half" style="display:block;width:50%;margin-left:2px;padding: 5px;" id="fbSaveMS"> ${save} ${MS}</button>`;

    btnsForExistingItem += `</nav > `;

    return isSaved ? btnsForExistingItem : saveBtn;

  };


  const addSwitcherOnMultiSelectionHandler = () => {
    var element = document.getElementById('toggleMS');
    // protect for now as MS toggle is hidden
    if (element) {
      element.addEventListener("change", evt => {
        //  console.log("toggle-switch-input MS on change", evt);
        toggleIsMultiSelection();
      });
    }
  }

  const getNewStatus = () => {
    let markup = feedbackObjects.find(el => { return el.id == 'field-markup' });
    return state.data.isHucInModeledRange && markup && markup.value == 'R' ? 2 : 1;
  };

  const enableSaveButton = () => {
    if (state.data.datecompleted) {
      document.getElementById("feedbackControlPanelContainer").style.pointerEvents = "none";
      document.getElementById("fbBtns").style.opacity = "0.5";
      $('.js-close')[0].style.pointerEvents = "auto";
    }
    try {
      var enable = true;
      var fieldMarkupVal = (feedbackObjects.find(el => { return el.id == "field-markup"; })).value;
      feedbackObjects.map(el => {
        if (
          (el.req && el.id == "field-markup" && (!el.value || el.value == '' || el.value == 'null'))
          ||
          (el.req && el.id != "additional-field-removalreason" && ( !el.value || el.value == '' || el.value == 'null'))
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
      if (state.data.datecompleted) {
        document.getElementById("feedbackControlPanelContainer").style.pointerEvents = "none";
        document.getElementById("fbBtns").style.opacity = "0.5";
        $('.js-close')[0].style.pointerEvents = "auto";
      }
    } catch{ }
    try {
      var enable = true;
      var fieldMarkupVal = (feedbackObjects.find(el => { return el.id == "field-markup"; })).value;
      feedbackObjects.map(el => {
        if (
          (el.req && el.id == "field-markup" && (!el.value || el.value == '' || el.value == 'null'))
          ||
          (el.req && el.id != "field-markup" && el.id != "additional-field-removalreason" && (!el.value || el.value == '' || el.value == 'null'))
          || (el.req && el.id == "additional-field-removalreason" && (fieldMarkupVal == 'R') && (!el.value || el.value == '' || el.value == 'null'))
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
              if (el.id == "field-markup") {
                feedbackObjects.map(e => {
                  if (e.id == "additional-field-removalreason")
                    e.value = null;
                  state.data.additionalFields.removalreason = null;
                });
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

      });
      console.log('feedbackObjects', feedbackObjects)

      enableSaveButton();
      enableSaveMSButton();
    });

  // store dropdown value from 'change' event. 
  // Making sure drop down could also control the enable/disable button
    const handleNonChromeDropDown = () =>{
      feedbackObjects.map(el => {
        if (el.id == event.target.id) {
          el.value = event.target.value}})
          enableSaveButton();
          enableSaveMSButton();
    }

    const checkBrowser = () => {
      let sBrowser, sUsrAg = navigator.userAgent;

      // The order matters here, and this may report false positives for unlisted browsers.
      if (sUsrAg.indexOf("Firefox") > -1) {
        sBrowser = "Mozilla Firefox";
        // "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:61.0) Gecko/20100101 Firefox/61.0"
      } else if (sUsrAg.indexOf("SamsungBrowser") > -1) {
        sBrowser = "Samsung Internet";
        // "Mozilla/5.0 (Linux; Android 9; SAMSUNG SM-G955F Build/PPR1.180610.011) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/9.4 Chrome/67.0.3396.87 Mobile Safari/537.36
      } else if (sUsrAg.indexOf("Opera") > -1 || sUsrAg.indexOf("OPR") > -1) {
        sBrowser = "Opera";
        // "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 OPR/57.0.3098.106"
      } else if (sUsrAg.indexOf("Trident") > -1) {
        sBrowser = "Microsoft Internet Explorer";
        // "Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; Zoom 3.6.0; wbx 1.0.0; rv:11.0) like Gecko"
      } else if (sUsrAg.indexOf("Edge") > -1) {
        sBrowser = "Microsoft Edge";
        // "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36 Edge/16.16299"
      } else if (sUsrAg.indexOf("Chrome") > -1) {
        sBrowser = "Google Chrome or Chromium";
        // "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/66.0.3359.181 Chrome/66.0.3359.181 Safari/537.36"
      } else if (sUsrAg.indexOf("Safari") > -1) {
        sBrowser = "Apple Safari";
        // "Mozilla/5.0 (iPhone; CPU iPhone OS 11_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.0 Mobile/15E148 Safari/604.1 980x1306"
      } else {
        sBrowser = "unknown";
      }

      return sBrowser
    }

    container.addEventListener('change', function (event) {
      if (!(event && event.target && event.target.id)) return;
      // ----------------------------------------------------
      // below section is to handle IE not listening 'input'
      let browserType = checkBrowser()
      if (browserType != 'Google Chrome or Chromium') handleNonChromeDropDown()
      // feedbackObjects.map(el => {
      //   if (el.id == event.target.id) {
      //     el.value = event.target.value}})
      //     enableSaveButton();
      //     enableSaveMSButton();
      // ----------------------------------------------------
      if (event.target.id != "field-markup") return;
      // update the 'field-markup' value

      var selValue = event.srcElement.value;
      var removeReason = document.getElementById('removeReason');

      if (selValue == "R") {

        if (document.getElementById('esriRemovalReason') != null) return;
        // Add a removal reason drop down only when removing a species
        var outputHtml = '<div id="esriRemovalReason">';
        outputHtml += `<br> <span class='font-size--3'>${$.i18n('rem_reason_req')}:</span>
  <select id="additional-field-removalreason" class="additional-field-select additional-field-input" style="width:100%;">`;
        outputHtml += `<option style="background-color:lightgray;" disabled selected value="null">None set</option>`;
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

        // outputHtml += `</select></label ></div > `;
        outputHtml += `</select ></div > `;
        removeReason.innerHTML = outputHtml;
      }
      else {
        removeReason.innerHTML = '';
      }
    });

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
