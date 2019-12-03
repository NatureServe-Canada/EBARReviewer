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
  // let downloadPdfBtnOnClick = null;
  // let openOverallBtnOnclick = null;
  // let opacitySliderOnUpdate = null;

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
      // downloadPdfBtnOnClick: null,
      // openOverallBtnOnclick: null,
      // layerOpacitySliderOnUpdate: null
    }
  ) => {
    // feedbackControlPanel.init({
    //     containerID: config.DOM_ID.feedbackControl
    // });

    viewProps = options;

    // downloadPdfBtnOnClick = options.downloadPdfBtnOnClick;
    // openOverallBtnOnclick = options.openOverallBtnOnclick;
    // opacitySliderOnUpdate = options.layerOpacitySliderOnUpdate;

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

    // document.querySelectorAll('.js-download-pdf').forEach(element=>{
    //     element.addEventListener('click', viewProps.downloadPdfBtnOnClick);
    // });

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

  const toggleDownloadAsPdfBtn = url => {
    // const isActive = url ? true : false;
    // document
    //   .getElementById("downloadPdfBtn")
    //   .classList.toggle("is-active", isActive);
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
      onClickHandler: hucID => {
        // controllerProps.addPreviewHucByID(hucID);
        viewProps.listViewForDetailedFeedbackOnClick(hucID);
      }
    });

    listViewForFeedbacksByHuc.init({
      onCloseHandler: () => {
        openListView(listViewForOverallFeedback);
        // resetSelectedHucFeature();
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

  return {
    init,
    legend,
    speciesSelector,
    feedbackControlPanel,
    toggleMainControl,
    overallFeedbackControlPanel,
    // toggleOverallFeeback,
    toggleDownloadAsPdfBtn,
    enableOpenOverallFeedbackBtnBtn,
    listViewForOverallFeedback,
    listViewForDetailedFeedback,
    listViewForFeedbacksByHuc,
    switchToReviewModeView,
    initViewComponentsForReviewMode,
    openListView,
    toggleControlPanel
  };
}
