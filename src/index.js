import "./style/index.scss";

import "@babel/polyfill";

import config from "./config";
import Controller from "./core/Controller";
import View from "./core/View";
import MapControl from "./core/MapControl";
import OAuthManager from "./core/OauthManager";
import CsvLoader from "./core/CsvLoader";

import ns from "./static/ns.png";
import ns_white from "./static/ns_white.png";

import PolyfillForIE from "./utils/PolyfillForIE";

(async function initOAuthManager() {


  const logo = document.getElementById("logo");
  const nsImage = new Image();
  nsImage.src = ns;
  nsImage.width = "220";
  logo.appendChild(nsImage);

  const oauthManager = new OAuthManager(config.oauthAppID);
  await oauthManager.init();

  document.querySelector(".js-accept-terms").addEventListener("click", evt => {
    // console.log('agress');
    initApp(oauthManager);
  });

})();

const initApp = async oauthManager => {
  if (!oauthManager) {
    console.error("oauth manager is required to init the app...");
    return;
  }

  const view = new View();

  const mapControl = new MapControl({
    webMapID: config.webMapID,
    mapViewContainerID: config.DOM_ID.mapViewContainer,
    onScaleChange: (newScale = 0) => {
      // console.log('newScale', newScale);
      view.legend.render(newScale);
    }
  });

  const navLogo = document.getElementById("navlogo");
  const nsImageNav = new Image();
  nsImageNav.src = ns_white;
  nsImageNav.width="120"
  navLogo.appendChild(nsImageNav);

  const controller = new Controller({
    oauthManager,

    speciesDataOnReady: data => {
      // console.log('speciesDataOnReady', data);
      view.speciesSelector.render({ data });
    },
    legendDataOnReady: data => {
      view.legend.init({ data });
    },
    feedbackManagerOnOpen: data => {
      view.toggleControlPanel({
        target: view.feedbackControlPanel,
        isVisible: true,
        data
      });
    },
    feedbackManagerOnClose: () => {
      view.toggleControlPanel({
        target: view.feedbackControlPanel,
        isVisible: false
      });
    },
    speciesOnSelect: () => {
      view.enableOpenOverallFeedbackBtnBtn();
    },
    onDeatiledFeedbackSubmit: data => {
      // console.log('onDeatiledFeedbackSubmit', data);
      const species = data.species;
      view.speciesSelector.setSpeciesSelectorOptionAsReviewed(
        species,
        "detailed"
      );
    },
    onOverallFeedbackSubmit: data => {
      // console.log('onOverallFeedbackSubmit', data);
      const species =
        data.attributes[config.FIELD_NAME.overallFeedback.species];
      view.speciesSelector.setSpeciesSelectorOptionAsReviewed(
        species,
        "overall"
      );
    },

    onReviewMode: () => {
      view.switchToReviewModeView();
      view.initViewComponentsForReviewMode();
    },
    overallFeedbackForReviewModeOnReady: (data = null) => {
      view.openListView(view.listViewForOverallFeedback, data);
    },
    feedbackByUsersForReviewModeOnReady: (data = null) => {
      view.openListView(view.listViewForDetailedFeedback, data);
    },
    feedbackByHucsForReviewModeOnReady: (data = null) => {
      view.openListView(view.listViewForFeedbacksByHuc, data);
    },
    hucFeatureOnSelectForReviewMode: feature => {
      if (view.listViewForDetailedFeedback.isVisible()) {
        view.listViewForDetailedFeedback.setActiveRow(
          feature.attributes[config.FIELD_NAME.ecoShapeLayerID]
        );
      } else {
        controller.getFeedbacksByHucForReviewMode(feature);
      }
    },

    /*     
    highligtEcosOnMap: ecoIds => {
      console.log('highligtEcosOnMap', data);
      mapControl.highlightEcos(ecoIds);
    },
     */

    /*     
    showToPredictedHabitatOnMap: (speciesCode = "") => {
      mapControl.showPredictedHabitatLayers(speciesCode);
    }, */

    zoomToEcoShpsOnMap: (ecoIds = []) => {
      mapControl.zoomToEcoShps(ecoIds);
    },
    clearMapGraphics: (targetLayer = "") => {
      // console.log('clearMapGraphics', targetLayer);
      mapControl.clearMapGraphics(targetLayer);
    },
    clearEcoPresenceGraphics: () =>{
      mapControl.clearEcoPresenceGraphics();
    },

    showEcoFeatureOnMap: (ecoId = "", status) => {
      //console.log('showEcoFeatureOnMap', ecoId, status);
      mapControl.showEcoFeatureByStatus(ecoId, status);
    },

    showEcoPresenceOnMap: (ecoId = "", presence = "") => {
      // Lock the UI as we draw pink graphics
      const modal = document.getElementById("myModal");
      modal.style.display = "block";
      mapControl.showEcoFeatureByPresence(ecoId, presence)
    },

    //addPreviewHucByID
    addPreviewEcoByID: ecoId => {
      mapControl.addPreviewEcoByID(ecoId);
    },

    pdfUrlOnChange: (url = "") => {
      view.toggleDownloadAsPdfBtn(url);
    }
  });

  view.speciesSelector.init({
    onChange: val => {
      console.log(val);
      mapControl.clearAllGraphics();
      controller.setSelectedSpecies(val);
      let m = controller.getMetadata(val);
      view.updateSpeciesMetadata(m);     
    }
  });

  view.feedbackControlPanel.init({
    containerID: config.DOM_ID.feedbackControl,
    onCloseHandler: () => {
      controller.resetSelectedEcoFeature();
    },
    commentOnChange: val => {
      // console.log(val);
      controller.feedbackManager.feedbackDataModel.setComment(val);
    },
    additionalFieldInputOnChange: (field, value) => {
      controller.feedbackManager.feedbackDataModel.setAdditionalField(
        field,
        value
      );
    },
    onSubmitHandler: status => {
      // console.log('submit btn on click, new status >', status);
      if (status) {
        controller.feedbackManager.feedbackDataModel.setStatus(status);
      }
      controller.feedbackManager.submit();
    },
    onRemoveHandler: () => {
      controller.feedbackManager.remove();
    }
  });

  view.overallFeedbackControlPanel.init({
    containerID: config.DOM_ID.overallFeedbackControl,
    onCloseHandler: () => {
      // view.toggleOverallFeeback(false);

      view.toggleControlPanel({
        target: view.overallFeedbackControlPanel,
        isVisible: false
      });
    },
    onSubmitHandler: data => {
      // console.log('submit overall feedback', data);
      // view.toggleOverallFeeback(false);

      view.toggleControlPanel({
        target: view.overallFeedbackControlPanel,
        isVisible: false
      });

      controller.postOverallFeedback(data);
    }
  });

  view.init({
    // downloadPdfBtnOnClick: ()=>{
    //     controller.downloadPdf();
    // },
    openOverallBtnOnclick: () => {
      // const data = controller.getOverallFeedback();
      // view.toggleOverallFeeback(true, data);
      view.toggleControlPanel({
        target: view.overallFeedbackControlPanel,
        isVisible: true,
        data: controller.getOverallFeedback()
      });
    },
    layerOpacitySliderOnUpdate: val => {
      // console.log(val);
      mapControl.setLayersOpacity(val);
    },
    listViewForOverallFeedbackOnClick: userID => {
      controller.getFeedbacksByUserForReviewMode(userID);
    },
    listViewForDetailedFeedbackOnClose: () => {
      controller.renderListOfHucsWithFeedbacks();
    },
    listViewForDetailedFeedbackOnClick: ecoId => {
      mapControl.addPreviewEcoByID(ecoId);
    },
    listViewForFeedbacksByHucOnClose: () => {
      controller.resetSelectedEcoFeature();
    },
    signOutBtnOnClick: () => {
      controller.signOut();
    }
  });

  controller.init({
    // token: credential.token
  });

  mapControl.init({
    ecoFeatureOnSelectHandler: ecoFeature => {
      console.log('selected ecoFeature', ecoFeature);
      controller.setSelectedHucFeature(ecoFeature);
    }
  });

  const csvLoader = new CsvLoader({
    targetDomElementId: config.DOM_ID.mapViewContainer,
    onLoadHandler: csvData => {
      if (csvData.features && csvData.features.length) {
        // console.log('csv data deatures', csvData.features);
        mapControl.addCsvLayer(csvData.features);
      }
    }
  });
  csvLoader.init();

  const userDiv = document.getElementById(config.DOM_ID.loggedInUser)
  if(userDiv){
    let componentHTML = "<div><span class='font-size--2'>Logged in as:<b> " + oauthManager.getUserID() + "</b></span></div>"
    userDiv.innerHTML = componentHTML
  }


  const toggleGraphicsLayers = document.getElementsByClassName('toggleGraphicsLayers');
  if (toggleGraphicsLayers) {
    for (var i = 0; i < toggleGraphicsLayers.length; i++) {
      toggleGraphicsLayers[i].addEventListener("click", function (event) {

        if (event && event.target)
          mapControl.graphicsVisibility(event);
      });
    }
  }
  
  // window.appDebugger = {
  //     signOut: oauthManager.signOut
  // };
};
