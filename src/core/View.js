import config from "../config";

import SpeciesSelector from "../components/SpeciesSelector";
import FeedbackControlPanel from "../components/FeedbackControlPanel";
import OverallFeedbackControlPanel from "../components/OverallFeedbackControl";
import ListViewForOverallFeedback from "../components/ListViewForOverallFeedback";
import ListViewForDetailedFeedback from "../components/ListViewForDetailedFeedback";
import ListViewForFeedbacksByHucs from "../components/ListViewForFeedbacksByHucs";
import Legend from "../components/Legend";

export default function View() {
  let viewProps = null;

  const speciesSelector = new SpeciesSelector({
    containerID: config.DOM_ID.speciesSelector
  });

  const feedbackControlPanel = new FeedbackControlPanel();

  const overallFeedbackControlPanel = new OverallFeedbackControlPanel();

  const listViewForOverallFeedback = new ListViewForOverallFeedback({
    containerID: config.DOM_ID.listViewOverallFeedback
  });

  const listViewForDetailedFeedback = new ListViewForDetailedFeedback({
    containerID: config.DOM_ID.listViewDeatiledFeedback
  });

  const listViewForFeedbacksByHuc = new ListViewForFeedbacksByHucs({
    containerID: config.DOM_ID.listViewForFeedbacksByHuc
  });

  const legend = new Legend({
    container: config.DOM_ID.legend
  });

  const $mainControlPanel = document.getElementById(config.DOM_ID.mainControl);

  const init = (
    options = {
    }
  ) => {
    // feedbackControlPanel.init({
    //     containerID: config.DOM_ID.feedbackControl
    // });

    viewProps = options;

    // hide agreement info
    document.getElementById("agreementDiv").classList.add("hide");

    // show mainControlDiv when init view
    document.getElementById("mainControlDiv").classList.remove("hide");
    document.getElementById("viewDiv").classList.remove("hide");

    initEventHandlers();
  };

  const initEventHandlers = () => {
    // document.querySelectorAll('.js-toggle-basemap-gallery').forEach(element=>{
    //     // console.log(element);
    //     element.addEventListener('click', toggleBasemapGallery);
    // });

    document.querySelectorAll(".js-open-overall-feedback").forEach(element => {
      // console.log('js-open-overall-feedback on click');
      element.addEventListener("click", viewProps.openOverallBtnOnclick);
    });

    document.querySelectorAll(".js-toggle-ui-component").forEach(element => {
      element.addEventListener("click", evt => {
        const targetDomID = element.dataset.target;
        document.getElementById(targetDomID).classList.toggle("hide");
      });
    });

    // document.querySelector('#sliderForLayerOpacity').addEventListener('change', (evt)=>{
    //     // console.log(evt.target.value);
    //     // opacitySliderOnUpdate(evt.target.value);
    //     viewProps.layerOpacitySliderOnUpdate(evt.target.value)
    // });

    document.querySelectorAll(".js-sign-out").forEach(element => {
      element.addEventListener("click", viewProps.signOutBtnOnClick);
    });
  };

  // const toggleOverallFeeback = (isVisible=false, data={})=>{
  //     if(isVisible){
  //         overallFeedbackControlPanel.open(data);
  //     } else {
  //         overallFeedbackControlPanel.close();
  //     }

  //     toggleMainControl(!isVisible);
  // };

  const toggleControlPanel = (
    options = {
      target: null,
      isVisible: false,
      data: null
    }
  ) => {
    if (options.target) {
      if (options.isVisible) {
        options.target.open(options.data);
      } else {
        options.target.close();
      }

      toggleMainControl(!options.isVisible);
    }
  };

  // const toggleBasemapGallery = ()=>{
  //     // console.log('toggleBasemapGallery');
  //     document.getElementById('basemapGalleryControl').classList.toggle('is-collapsed');
  // };

  const toggleMainControl = isVisible => {
    if (isVisible) {
      $mainControlPanel.classList.remove("hide");
    } else {
      $mainControlPanel.classList.add("hide");
    }
  };

  const enableOpenOverallFeedbackBtnBtn = url => {
    document
      .getElementById("openOverallFeedbackBtn")
      .classList.remove("btn-disabled");
  };

  const switchToReviewModeView = () => {
    document.getElementById("openOverallFeedbackBtnDiv").classList.add("hide");
  };

  const initViewComponentsForReviewMode = () => {
    listViewForOverallFeedback.init({
      onClickHandler: userID => {
        // reviewFeedbacksByUser(userID);
        viewProps.listViewForOverallFeedbackOnClick(userID);
      }
    });

    listViewForDetailedFeedback.init({
      onCloseHandler: () => {
        openListView(listViewForOverallFeedback);
        // renderListOfHucsWithFeedbacks();
        viewProps.listViewForDetailedFeedbackOnClose();
      },
      onClickHandler: ecoId => {
        // controllerProps.addPreviewEcoByID(ecoId);
        viewProps.listViewForDetailedFeedbackOnClick(ecoId);
      }
    });

    listViewForFeedbacksByHuc.init({
      onCloseHandler: () => {
        openListView(listViewForOverallFeedback);
        // resetSelectedEcoFeature();
        viewProps.listViewForFeedbacksByHucOnClose();
      }
    });
  };

  // const openListViewForOverallFeedback = (data)=>{
  //     listViewForOverallFeedback.toggleVisibility(true);
  //     listViewForOverallFeedback.render(data);

  //     listViewForDetailedFeedback.toggleVisibility(false);
  // }

  // const openListViewForDetailedFeedback = (data)=>{
  //     listViewForOverallFeedback.toggleVisibility(false);
  //     listViewForDetailedFeedback.toggleVisibility(true);
  //     listViewForDetailedFeedback.render(data);
  // }

  const openListView = (targetListView, data) => {
    [
      listViewForOverallFeedback,
      listViewForDetailedFeedback,
      listViewForFeedbacksByHuc
    ].forEach(item => {
      if (item === targetListView) {
        item.toggleVisibility(true);

        if (data) {
          item.render(data);
        }
      } else {
        item.toggleVisibility(false);
      }
    });
  };

  const updateSpeciesMetadata = (m) => {

    const rversion = document.getElementById("rversion");
    rversion.innerHTML = "";
    if (m['rangeversion']){
      rversion.innerHTML = m['rangeversion'];
    }
    
    const rstage = document.getElementById("rstage");
    rstage.innerHTML = "";
    if (m['rangestage']){
      rstage.innerHTML = m['rangestage'];
    }
    
    const rdate = document.getElementById("rdate");
    rdate.innerHTML = "";
    if (m['rangedate']){
      rdate.innerHTML = new Date(m['rangedate']).toLocaleDateString();
    }
    
    const rlink = document.getElementById("rlink");
    rlink.innerHTML = "";
    if (m['national_scientific_name']){
      let url = `http://explorer.natureserve.org/servlet/NatureServe?searchSciOrCommonName=${m['national_scientific_name']}&x=0&y=0`;
      rlink.innerHTML = `<a href="${url}" target="_blank" class="link-white">go to NatureServe Explorer</a>`;
    }

    const rmetadata = document.getElementById("rmetadata");
    rmetadata.innerHTML = "";
    if (m['rangemetadata']){
      rmetadata.innerHTML = m['rangemetadata'];
    }
    
    const rnotes = document.getElementById("rnotes");
    rnotes.innerHTML = "";
    if (m['rangemapnotes']){
      rnotes.innerHTML = m['rangemapnotes']
    }
    
    const rscope = document.getElementById("rscope");
    rscope.innerHTML = "";
    config.RANGEMAPSCOPE.forEach(c => {
      if (c['code'] == m['rangemapscope']){
        rscope.innerHTML = c['text'];
      }
    });
    
  };

  return {
    init,
    legend,
    speciesSelector,
    feedbackControlPanel,
    toggleMainControl,
    overallFeedbackControlPanel,
    // toggleOverallFeeback,
    enableOpenOverallFeedbackBtnBtn,
    listViewForOverallFeedback,
    listViewForDetailedFeedback,
    listViewForFeedbacksByHuc,
    switchToReviewModeView,
    initViewComponentsForReviewMode,
    openListView,
    updateSpeciesMetadata,
    toggleControlPanel
  };
}
