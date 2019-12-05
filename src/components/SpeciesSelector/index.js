import "./style.scss";

import config from "../../config";

export default function SpeciesSelector(
  props = {
    containerID: ""
  }
) {
  const container = props.containerID
    ? document.getElementById(props.containerID)
    : null;

  let onChangeHandler = null;
  let data = null;
  let selectedTaxa = null;

  const init = (options = {}) => {
    onChangeHandler = options.onChange || null;

    render();

    initEventHandler();
  };

  const getHtmlForTaxaSelector = () => {
    const distinctTaxa = [];
    
    data.forEach(d => {
      const value = d[config.FIELD_NAME.speciesLookup.taxa];
      //console.log(d)
      //console.log(value)
      if (distinctTaxa.indexOf(value) === -1) {
        distinctTaxa.push(value);
      }
    });

    distinctTaxa.sort((a, b) => {
      if (a < b) {
        return -1;
      }
      if (a > b) {
        return 1;
      }
      return 0;
    });

    // console.log(distinctTaxa);

    const optionsHtml = distinctTaxa
      .map(d => {
        return `<option class='select-option' value="${d}">${d}</option>`;
      })
      .join("");

    const taxaSelectorHtml = `
            <label class='trailer-half'>
                <select id='taxaSelector' class="select-full">
                    <option value="" selected disabled hidden>Select Taxa</option>
                    ${optionsHtml}
                </select>
            </label>
        `;

    return taxaSelectorHtml;
  };

  const getHtmlForSpeciesSelector = () => {
    console.log("getHtmlForSpeciesSelector: ", data)
    const dataForSelectedTaxa = data.filter(d => {
      return d[config.FIELD_NAME.speciesLookup.taxa] === selectedTaxa;
    });
    console.log("this is the species selector data:", dataForSelectedTaxa)
    //console.log(dataForSelectedTaxa)
    dataForSelectedTaxa.sort((a, b) => {
      if (
        a[config.FIELD_NAME.speciesLookup.speciesName] <
        b[config.FIELD_NAME.speciesLookup.speciesName]
      ) {
        return -1;
      }
      if (
        a[config.FIELD_NAME.speciesLookup.speciesName] >
        b[config.FIELD_NAME.speciesLookup.speciesName]
      ) {
        return 1;
      }
      return 0;
    });

    const optionsHtml = dataForSelectedTaxa
      .map(d => {
        const val = d[config.FIELD_NAME.speciesLookup.rangeValForLookup];
        const label = d[config.FIELD_NAME.speciesLookup.speciesName];
        const hasOverallFeedback = d.hasOverallFeedback
          ? getOptionDecorationClass("overall")
          : "";
        const hasDeatiledFeedback = d.hasDeatiledFeedback
          ? getOptionDecorationClass("detailed")
          : "";
        // if no data has been loaded for this species, disable the option if not allowing commenting on these
        const isDisabled =
          !config.allowCommentOnNoDataSpecies && !d.hasDataLoaded
            ? "disabled"
            : "";

        // If no data and allowing commenting, have changed background style for these items
        const isNoDataLoaded =
          config.allowCommentOnNoDataSpecies && !d.hasDataLoaded
            ? getOptionDecorationClass("noDataLoaded")
            : "";
        return `<option class='select-option species-option ${hasOverallFeedback} ${hasDeatiledFeedback} ${isDisabled} ${isNoDataLoaded}' value="${val}" ${isDisabled}>${label}</option>`;
      })
      .join("");

    const speciesSelectorHtml = `
            <label class='trailer-half'>
                <select id='speciesSelector' class="select-full" ${
                  optionsHtml === "" ? "disabled" : ""
                }>
                    <option value="" selected disabled hidden>Select Species</option>
                    ${optionsHtml}
                </select>
            </label>
        `;

    return speciesSelectorHtml;
  };

  const render = (
    options = {
      data: []
    }
  ) => {
    data = options.data || data;

    // console.log(data);

    // const options = data.map(d=>{
    //     const val = d.SpeciesCode;
    //     const label = d.SpeciesName;
    //     return `<option class='select-option' value="${val}">${label}</option>`
    // }).join('');

    // const taxaSelectorHtml = `
    //     <label>
    //         <select class="select-full">
    //             <option value="" selected disabled hidden>Select Taxa</option>
    //         </select>
    //     </label>
    // `;

    const componentHTML = `
            <div id='taxaSelectorDiv'>
                ${getHtmlForTaxaSelector()}
            </div>
            <div id='speciesSelectorDiv'>
                ${getHtmlForSpeciesSelector()}
            </div>
        `;

    container.innerHTML = componentHTML;
  };

  const updateSpeciesSelector = () => {
    // console.log(getHtmlForSpeciesSelector());
    document.getElementById(
      "speciesSelectorDiv"
    ).innerHTML = getHtmlForSpeciesSelector();
  };

  const initEventHandler = (options = {}) => {
    // const changeEventHandler = (event)=>{
    //     if(event.target.value && onChangeHandler){
    //         onChangeHandler(event.target.value);
    //     }
    // };

    // const taxaSelectorOnChange = (event)=>{
    //     console.log(event.target.value);
    // };

    // container.querySelector('#speciesSelector').onchange = changeEventHandler;

    // container.querySelector('#taxaSelector').onchange = taxaSelectorOnChange;

    container.addEventListener("change", evt => {
      const actionsByElementID = {
        taxaSelector: () => {
          // console.log('taxtSelector on change', event.target.value);
          selectedTaxa = evt.target.value;
          updateSpeciesSelector();
        },
        speciesSelector: () => {
          // console.log('speciesSelector on change', event.target.value);
          onChangeHandler(evt.target.value);
        }
      };

      if (actionsByElementID[evt.target.id]) {
        actionsByElementID[evt.target.id]();
      }
    });
  };

  // feedback type values: 'overall' | 'detailed'. Need to use it to determine which class to add (is-bold | is-italic)
  const setSpeciesSelectorOptionAsReviewed = (
    speciesCode = "",
    feedbackType = ""
  ) => {
    const selectOption = document.querySelector(
      `.select-option[value='${speciesCode}']`
    );

    const decorationClass = getOptionDecorationClass(feedbackType);

    selectOption.classList.add(decorationClass);

    // console.log(speciesCode);

    data.forEach(d => {
      if (d[config.FIELD_NAME.speciesLookup.speciesCode] === speciesCode) {
        if (feedbackType === "detailed") {
          d.hasDeatiledFeedback = true;
        }

        if (feedbackType === "overall") {
          d.hasOverallFeedback = true;
        }
      }
    });
  };

  // feedback type values: 'overall' | 'detailed'
  // for species has overall feedback provided, style it as bold text
  // for species has detailed feedback provided, style it as italic text
  const getOptionDecorationClass = (feedbackType = "") => {
    const decorationClasses = {
      overall: "has-overall-feedback",
      detailed: "has-detailed-feedback",
      noDataLoaded: "has-no-data-loaded"
    };

    return decorationClasses[feedbackType] || "undefined-class";
  };

  return {
    init,
    render,
    setSpeciesSelectorOptionAsReviewed
  };
}
