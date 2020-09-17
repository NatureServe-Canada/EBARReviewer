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

import translation from "../js/translation"

(async function initOAuthManager() {

  const logo = document.getElementById("logo");
  const nsImage = new Image();
  nsImage.src = ns;
  nsImage.width = "220";
  logo.appendChild(nsImage);

  const oauthManager = new OAuthManager(config.oauthAppID);
  await oauthManager.init();
  if (config.i18n)
  {
    
    $("[data-i18n=lang").css('display', 'block');

  }

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

  nsImageNav.width = "120"
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
    showMSdata: () => {
      mapControl.showMS();
    },
    runSetpEcoByStatusLoaded: () => {
      mapControl.setpEcoByStatusLoaded();
    },
    runSetpEcoByPresenceLoaded: () => {
      mapControl.setpEcoByPresenceLoaded();
    },
    runFullExtent: () => {
      mapControl.fullExtent();
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
    clearEcoPresenceGraphics: () => {
      mapControl.clearEcoPresenceGraphics();
    },

    showEcoFeatureOnMap: (ecoId = "", markup, len) => {
      mapControl.showEcoFeatureByStatus(ecoId, markup, len);
    },


    showEcoPresenceOnMap: (ecoId = "", presence = "", len) => {
      // Lock the UI as we draw pink graphics
      // const modal = document.getElementById("myModal");
      // modal.style.display = "block";

      mapControl.showEcoFeatureByPresence(ecoId, presence, len)

    },

    //addPreviewHucByID
    addPreviewEcoByID: ecoId => {
      mapControl.addPreviewEcoByID(ecoId);
    }

  });

  view.speciesSelector.init({
    onChange: val => {

      mapControl.clearAllGraphics();
      mapControl.fullExtentClear();
      const modal = document.getElementById("myModal");
      modal.style.display = "block";

      mapControl.setRangeMapShpDefQuery(val);

      controller.setSelectedSpecies(val);
      let m = controller.getMetadata(val);
      view.updateSpeciesMetadata(m);
      
      const revSub = document.getElementById("review_submitted");
      if (controller.dataModel.overallFeedback[val].datecompleted){        
        revSub.style.display = "block";
      } else {
        revSub.style.display = "none";
      }
    }
  });

  view.feedbackControlPanel.init({
    containerID: config.DOM_ID.feedbackControl,
    onCloseHandler: () => {
      controller.resetSelectedEcoFeature();
      mapControl.clearMSelection();
      mapControl.clearEcoPreviewGraphicLayer();
    },
    clearMultiSelectGraphics: () => {
      mapControl.clearMSelection();
    },
    commentOnChange: val => {
      controller.feedbackManager.feedbackDataModel.setComment(val);
    },
    additionalFieldInputOnChange: (field, value) => {
      controller.feedbackManager.feedbackDataModel.setAdditionalField(
        field,
        value
      );
    },
    entityFieldInputOnChange: (field, value) => {
      switch (field) {
        case "comment":
          controller.feedbackManager.feedbackDataModel.setComment(value);
          break;
        case "markup":
          controller.feedbackManager.feedbackDataModel.setMarkup(value);
          break;
        default:
          break;
      }
    },
    onSubmitHandler: status => {
      // console.log('submit btn on click, new status >', status);
      if (status) {
        controller.feedbackManager.feedbackDataModel.setStatus(status);
      }
      controller.feedbackManager.submit();

      mapControl.clearMSelection();
      mapControl.clearEcoPreviewGraphicLayer();
    },
    onRemoveHandler: () => {
      controller.feedbackManager.remove();
      mapControl.clearMSelection();
      mapControl.clearEcoPreviewGraphicLayer();
    },
    onRemoveMSHandler: () => {
      let dataList = [];
      let fb = controller.feedbackManager.getfeedbackData();
      let res = mapControl.getMultiSelectionList();
      // fb.status = 1;

      const _deepCopy = (feedBack) => {
        return {
          ...feedBack,
          hucForSpeciesData: feedBack.hucForSpeciesData.map((_hucForSpeciesData, _hucForSpeciesDataIndex) => { return { ..._hucForSpeciesData } }),
          additionalFields: { ...feedBack.additionalFields },
          ecoAtts: { ...feedBack.ecoAtts },
        }
      };

      res.forEach(el => {
        let _feedBack = _deepCopy(fb);
        _feedBack.ecoID = el.attributes.ecoshapeid;
        _feedBack.ecoAtts = el.attributes;
        dataList.push(_feedBack);

      });

      controller.feedbackManager.removeMS(dataList);
      mapControl.clearMSelection();
      mapControl.clearEcoPreviewGraphicLayer();
    },
    onSubmitMSHandler: () => {
      let dataList = [];
      let fb = controller.feedbackManager.getfeedbackData();
      let res = mapControl.getMultiSelectionList();


      const _deepCopy = (feedBack) => {
        return {
          ...feedBack,
          hucForSpeciesData: feedBack.hucForSpeciesData.map((_hucForSpeciesData, _hucForSpeciesDataIndex) => { return { ..._hucForSpeciesData } }),
          additionalFields: { ...feedBack.additionalFields },
          ecoAtts: { ...feedBack.ecoAtts }
        }
      };

      res.forEach(el => {
        let _feedBack = _deepCopy(fb);
        _feedBack.ecoID = el.attributes.ecoshapeid;
        _feedBack.ecoAtts = el.attributes;
        _feedBack.status = 1;
        _feedBack.isHucInModeledRange = false;
        if (controller && controller.dataModel && controller.dataModel.ecoShapesBySpecies) {

          for (var i = 0; i < controller.dataModel.ecoShapesBySpecies['1'].length; ++i) {

            if (controller.dataModel.ecoShapesBySpecies['1'][i]['ecoshapeid'] == _feedBack.ecoID) {
              _feedBack.isHucInModeledRange = true;
            }
          }
        }

        _feedBack.status = (_feedBack.isHucInModeledRange && _feedBack.markup=='R')? 2 : 1;

        if (_feedBack.isHucInModeledRange && _feedBack.isHucInModeledRange == true) {
          if (_feedBack.markup == "P") {
            _feedBack.markup = null;
            _feedBack.additionalFields.removalreason = null;
          }
        }
        else {
          if (_feedBack.markup == "R") {
            _feedBack.markup = "P";
            _feedBack.additionalFields.removalreason = null;
          }
        }

        dataList.push(_feedBack);
      
      });
     // console.log('DATA_LIST', dataList);
      controller.feedbackManager.submitMS(dataList);
      mapControl.clearMSelection();
      mapControl.clearEcoPreviewGraphicLayer();
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
      console.log('submit overall feedback', data);

      view.toggleControlPanel({
        target: view.overallFeedbackControlPanel,
        isVisible: false
      });

      controller.postOverallFeedback(data);
    },
    onSubmitSaveHandler: data => {

      // if (data && !data.datestarted)
      data.datecompleted = new Date().getTime();

      console.log('submit with save overall feedback', data);

      view.toggleControlPanel({
        target: view.overallFeedbackControlPanel,
        isVisible: false
      });

      controller.postOverallFeedback(data);
    }
  });

  view.init({
    openOverallBtnOnclick: async () => {
      // const data = controller.getOverallFeedback();
      // view.toggleOverallFeeback(true, data);

      view.toggleControlPanel({
        target: view.overallFeedbackControlPanel,
        isVisible: true,
        data: await controller.getOverallFeedback()
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

  /*   const userDiv = document.getElementById(config.DOM_ID.loggedInUser)
  if (userDiv) {
    let componentHTML = `<div><span class="font-size--2">${$.i18n('logged_in_as')}:<b> ` + oauthManager.getUserID() + `</b></span></div>`
    userDiv.innerHTML = componentHTML
  } */


  const toggleGraphicsLayers = document.getElementsByClassName('toggleGraphicsLayers');
  if (toggleGraphicsLayers) {
    for (var i = 0; i < toggleGraphicsLayers.length; i++) {
      toggleGraphicsLayers[i].addEventListener("click", function (event) {

        if (event && event.target)
          mapControl.graphicsVisibility(event);
      });
    }
  };

  const zoomToSpeciesRange = document.getElementById('zoomToSpeciesRange');
  if (zoomToSpeciesRange) {

    zoomToSpeciesRange.addEventListener("click", function () {

      //if (event && event.target)
      mapControl.fullExtent();
    });
  };

  // window.appDebugger = {
  //     signOut: oauthManager.signOut
  // };
};
