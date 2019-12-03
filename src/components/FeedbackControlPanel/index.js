import "./style.scss";
import config from "../../config";

export default function FeedbackControlPanel() {
  let container = null;
  let onCloseHandler = null;
  // let statusOnChange = null;
  let commentOnChange = null;
  let additionalFieldInputOnChange = null;
  let onSubmitHandler = null;
  let onRemoveHandler = null;
  // let statusData = [];

  const state = {
    data: null,
    isSumbitCommentOnly: false
  };

  const statusLookup = {
    1: "Add to Modeling Extent",
    2: "Remove from Modeling Extent",
    3: "Comment on Predicted Habitat"
  };

  const init = (options = {}) => {
    container = options.containerID
      ? document.getElementById(options.containerID)
      : null;

    onCloseHandler = options.onCloseHandler || null;

    // statusOnChange = options.statusOnChange || null;

    commentOnChange = options.commentOnChange || null;

    additionalFieldInputOnChange = options.additionalFieldInputOnChange || null;

    onSubmitHandler = options.onSubmitHandler || null;

    onRemoveHandler = options.onRemoveHandler || null;

    if (!container) {
      console.error("containerID is required for FeedbackControlPanel");
      return;
    }

    // render();

    initEventHandler();
  };

  const initState = data => {
    state.data = data;
    state.isSumbitCommentOnly = +state.data.status === 3 ? true : false;
  };

  const toggleIsSumbitCommentOnly = () => {
    state.isSumbitCommentOnly = !state.isSumbitCommentOnly;
  };

  const resetState = () => {
    state.data = null;
    state.isSumbitCommentOnly = false;
  };

  const getStatusByIsInModeledRange = () => {
    return state.data.isHucInModeledRange ? 2 : 1;
  };

  const getNewStatus = () => {
    if (state.isSumbitCommentOnly) {
      return 3;
    } else {
      return getStatusByIsInModeledRange();
    }
  };

  const render = () => {
    const hucName = state.data.hucName || "";
    const comment = state.data.comment || "";
    // const statusIdx = +data.status || 0;
    // const message = data.isHucInModeledRange ? `Model is inaccurate, <span class='avenir-demi'>REMOVE</span> this HUC from range` : `Known occurances, <span class='avenir-demi'>ADD</span> this HUC to range`;

    const componentHtml = `
            <div id='feedbackControlPanelContainer' class='panel panel-black'>

                <div class='trailer-0 text-right close-btn'>
                    <span class='font-size--3 icon-ui-close js-close'></span>
                </div>

                <div class='leader-half trailer-half'>
                    <span class='font-size-0'>${hucName}</span>
                    <hr>
                </div>

                <div class='feedbackControlPanelData'>
                    <div id='actionDialogWrap'>
                        ${getHtmlForActions()}
                    </div>

                    <div class='comment-dialog'>
                        <label>
                            <span class='font-size--3'>Feedback Comment:</span>
                            <textarea type="text" placeholder="" class="comment-textarea" maxlength="4095">${comment}</textarea>
                        </label>
                    </div>

                    <div class='additional-field-dialog'>
                        ${getHtmlForAdditionalFields()}
                    </div>
                </div>

                <div class='trailer-half'>
                    ${getHtmlForBtns(state.data.isSaved)}
                </div>
            </div>
        `;

    container.innerHTML = componentHtml;

    addSwitcherOnChangeHandler();

    // console.log('render feedback control panel', state.data);
  };

  // const refreshActionDialog = ()=>{
  //     document.getElementById('actionDialogWrap').innerHTML = getHtmlForActions();
  // };

  // const getLabelForTextInput = ()=>{
  //     return state.isSumbitCommentOnly ? statusLookup[3] : 'Comment'
  // }

  const getHtmlForActions = () => {
    const status = getNewStatus();

    // const isChecked = state.isSumbitCommentOnly ? '' : 'is-checked';

    // const outputHtml = `<div class='action-dialog trailer-half font-size--1 ${isChecked}'>
    //     <div class='inline-block'>
    //         <span class='icon-ui-checkbox-checked js-toggle-is-comment-only'></span>
    //         <span class='icon-ui-checkbox-unchecked js-toggle-is-comment-only'></span>
    //     </div>
    //     <span class='action-message'>${statusLookup[+status]}</span>
    // </div>`

    // const isChecked = state.isSumbitCommentOnly ? '' : 'checked';

    const outputHtml = `
            <div class='flex-container'>
                <div class='inline-block'>
                    <label class="toggle-switch">
                        <input type="checkbox" class="toggle-switch-input" ${
                          state.isSumbitCommentOnly ? "" : "checked"
                        }>
                        <span class="toggle-switch-track margin-right-1"></span>
                    </label>
                </div>
                <div class='inline-block'>
                    <span class="toggle-switch-label font-size--2 action-message">${
                      statusLookup[+status]
                    }</span>
                </div>
            </div>
        `;

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
        fieldValue =
          state.data.additionalFields[addField.field] ||
          (addField.editable ? "" : "None set");
        outputHtml += `
                <label>
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
                  }" class="additional-field-select additional-field-input">
                    ${
                      fieldValue === ""
                        ? '<option value="null" selected>None set</option>'
                        : ""
                    }
                `;

            addField.editable.forEach(value => {
              outputHtml += `
                 <option value="${value}" ${
                fieldValue === value ? "selected" : ""
              }>${value}</option>
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
            }>${fieldValue ? fieldValue : ""}</textarea>
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
    const saveBtn = `<button class="btn btn-fill js-submit-feedback trailer-half"> Save </button>`;
    // const updateBtn = `<button class="btn btn-fill js-submit-feedback trailer-half"> Save </button>`;
    // const removeBtn = `<button class="btn btn-fill js-remove-feedback trailer-half"> Reset </button>`;

    const btnsForExistingItem = `
            <nav class='trailer-half'>
                <button class="btn btn-half btn-grouped btn-transparent js-remove-feedback"> Reset </button>
                <button class="btn btn-half btn-grouped js-submit-feedback"> Save </button>
            </nav>
        `;

    return isSaved ? btnsForExistingItem : saveBtn;
  };

  const addSwitcherOnChangeHandler = () => {
    container
      .querySelector(".toggle-switch-input")
      .addEventListener("change", evt => {
        console.log("toggle-switch-input on change");
        toggleIsSumbitCommentOnly();
        render();
      });
  };

  const initEventHandler = () => {
    container.addEventListener("click", function(event) {
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
      // else if (event.target.classList.contains('js-toggle-is-comment-only')){
      //     toggleIsSumbitCommentOnly();
      //     render();
      // }
      else {
        //
      }
    });

    // container.addEventListener('click', function (event){
    //     if (event.target.type === 'radio') {
    //         // console.log('click radio btn', event.target.value);
    //         if(statusOnChange){
    //             statusOnChange(event.target.value);
    //         }
    //     }
    // });

    container.addEventListener("input", function(event) {
      // console.log(event.target);
      if (event.target.classList.contains("comment-textarea")) {
        // console.log('textarea on input', event.target.value);
        if (commentOnChange) {
          commentOnChange(event.target.value);
        }
      } else if (event.target.classList.contains("additional-field-input")) {
        // add special case to event listener on changing one of the additonal fields
        if (additionalFieldInputOnChange) {
          if (
            event.target &&
            event.target.classList &&
            event.target.classList.contains("additional-field-input")
          ) {
            const targetField = event.target.id.replace(
              "additional-field-",
              ""
            );
            additionalFieldInputOnChange(targetField, event.target.value);
          }
        }
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

  // const setStatusData = (data=[])=>{
  //     statusData = data;
  //     // console.log('setStatusData', statusData);
  // };

  return {
    init,
    open,
    close
    // setStatusData
  };
}
