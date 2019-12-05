"use strict";

import DataModel from "./DataModel";
import DataModelForReviewMode from "./DataModelForReviewMode";
import FeedbackManager from "./FeedbackManager";
import config from "../config";
import OAuthManager from "./OauthManager";
import ApiManager from "./ApiManager";

export default function Controller(props = {}) {
  const feedbackFailMessage =
    "Error doing something......";

  // const oauthManager = new OAuthManager(config.oauthAppID);
  const oauthManager = props.oauthManager;
  const dataModel = new DataModel();
  const dataModelForReviewMode = new DataModelForReviewMode();
  const feedbackManager = new FeedbackManager();
  const apiManager = new ApiManager({ oauthManager });

  const controllerProps = props;

  const state = {
    selectedHucFeature: null,
    domains: null
  };
  const isReviewMode =
    window.location.search.indexOf("reviewMode=true") !== -1 ? true : false;

  const init = async () => {
    if (isReviewMode) {
      controllerProps.onReviewMode();
    }

    try {
      // const portalUser = await oauthManager.init();

      const portalUser = oauthManager.getPoralUser();
      const speciesByUsers = await apiManager.querySpeciesByUser({
        email: portalUser.email
      });
      console.log("speciesByUsers result: ", speciesByUsers)
      const distinctUserSpecies = getDistinctSpeciesCodeToReview(
        speciesByUsers
      );

      const userIsAdmin = distinctUserSpecies.some(itm => itm == -1);
      console.log("admin: ", userIsAdmin)
      //overriding admin user because we want to test as a user, despite being logged in as admin
      const sepeciesData =
        portalUser.username === "gisadmin11" ||
        (distinctUserSpecies && distinctUserSpecies.length > 0 && userIsAdmin)
          ? await apiManager.queryAllFeaturesFromSpeciesLookupTable()
          : await apiManager.querySpeciesLookupTable({
              speciesCode: distinctUserSpecies,
              email: 2 //portalUser.email
            });
      console.log("sepeciesData == ", sepeciesData);
  
      const statusData = await apiManager.queryStatusTable();
      state.domains = statusData;
      console.log("this is the status data: ", statusData)
      
/*       for (var i=0; i< statusData.length; i++){
        if (statusData[i].description =="Add Remove"){
          initStatusTable(statusData[i]);
        }
      } */
      initStatusTable(statusData);

      initFeedbackManager();

      const deatiledFeedbacks = await queryFeedbacksByUser();

      const overallFeedbacks = await queryOverallFeedbacksByUser();

      initSpeciesLookupTable(sepeciesData, deatiledFeedbacks, overallFeedbacks);

      // console.log(deatiledFeedbacks, overallFeedbacks);
    } catch (err) {
      console.error(err);
    }
  };

  const initFeedbackManager = () => {
    feedbackManager.init({
      onOpenHandler: data => {
        // console.log('feedbackManager onOpenHandler', data);
        controllerProps.feedbackManagerOnOpen(data);
      },

      onCloseHandler: () => {
        // console.log('feedbackManager is closed');
        controllerProps.feedbackManagerOnClose();
      },

      onSubmitHandler: data => {
        console.log('feedback manager onSubmitHandler', data);
        postFeedback(data);
        showEcoFeatureOnMap(data.hucID, data.status, data);
        resetSelectedEcoFeature();

        controllerProps.onDeatiledFeedbackSubmit(data);
      },

      onRemoveHandler: data => {
        // console.log('feedback manager onRemoveHandler', data);
        deleteFeedback(data);
        showEcoFeatureOnMap(data.hucID);
        resetSelectedEcoFeature();
      }
    });
  };

  const initSpeciesLookupTable = async (
    data,
    deatiledFeedbacks,
    overallFeedbacks
  ) => {
    const speciesWithDataLoaded = await apiManager.getDistinctSpeciesCodeFromModelingExtent();
    console.log("initSpeciesLookupTable: ", speciesWithDataLoaded)

    const speciesWithOverallFeedback = {};
    const speciesWithDeatiledFeedback = {};

    deatiledFeedbacks.forEach(d => {
      const species = d.attributes[config.FIELD_NAME.feedbackTable.species];
      speciesWithDeatiledFeedback[species] = true;
    });

    overallFeedbacks.forEach(d => {
      const species = d.attributes[config.FIELD_NAME.overallFeedback.species];

      if (+d.attributes[config.FIELD_NAME.overallFeedback.rating]) {
        speciesWithOverallFeedback[species] = true;
      }
    });
    
    data = data.map(d => {
      const species = d.attributes[config.FIELD_NAME.speciesLookup.speciesCode];
      //console.log("initSpecies lookup  " + d.attributes[config.FIELD_NAME.speciesLookup.rangemapID])
      //const species = d.attributes[config.FIELD_NAME.speciesLookup.rangemapID];
      d.attributes.hasOverallFeedback = speciesWithOverallFeedback[species]
        ? true
        : false;
      d.attributes.hasDeatiledFeedback = speciesWithDeatiledFeedback[species]
        ? true
        : false;
      d.attributes.hasDataLoaded =
        speciesWithDataLoaded.indexOf(species) !== -1 ? true : false;
      return d.attributes;
    });
    console.log("this data is going from initSpeciesLookupTable in controller to the dataModel.setSpeciesLookup:", data)
    dataModel.setSpeciesLookup(data);

    controllerProps.speciesDataOnReady(data);

    // console.log('init species lookup table', data);
  };
  

   const initStatusTable = data => {
    data = data.map(d => {
      const lineBreakPattern = /(\r\n\t|\n|\r\t)/g;
      //console.log(d)
      let statusType = d.attributes[config.FIELD_NAME.statusType];
      
      if (lineBreakPattern.test(statusType)) {
        statusType = statusType.replace(lineBreakPattern, " ");
      }
      console.log(statusType)
      return statusType;
    });

    dataModel.setStatus(data);

    controllerProps.legendDataOnReady(getStatusDataForLegend(data));
  }; 

  // get list of hucs by the species code (modelling extent), then render these hucs on map
  const searchEcoShapesBySpecies = async speciesKey => {
    console.log("the speciesKey from searchEcoShapesBySpecies is: ", speciesKey)
    let data = dataModel.getEcoShpsBySpecies(speciesKey);
    console.log("is there data in searchEcoShapesBySpecies: ", data)
    if (data) {
      renderEcoShpsBySpeciesDataOnMap({ data, speciesKey });
    } else {
      try {
        console.log("No Data in searchEcoShapesBySpecies, so trying to do a query")
        data = await apiManager.queryEcoShapeBySpecies(speciesKey);

        data = data.map(d => {
          return d.attributes;
        });

        dataModel.setEcoShpsBySpecies(speciesKey, data);
        
        renderEcoShpsBySpeciesDataOnMap({ data, speciesKey });
      } catch (err) {
        console.error(err);
        // if no hucs features returned, pass an empty array so the map will re-render the hucs layers with no highlighted features
        renderEcoShpsBySpeciesDataOnMap({
          data: [],
          speciesKey
        });
      }
    }
  };

  // get previous feedbacks provided by the user
  const queryFeedbacksByUser = async (
    options = {
      userID: "",
      species: "",
      onSuccessHandler: null
    }
  ) => {
    const userID = options.userID || oauthManager.getUserID();
    const onSuccessHandler = options.onSuccessHandler;
    const whereClauseParts = [
      `${config.FIELD_NAME.feedbackTable.userID} = '${userID}'`,
      `${config.FIELD_NAME.feedbackTable.retirementDate} IS NULL`
    ];

    if (options.species) {
      whereClauseParts.push(
        `${config.FIELD_NAME.feedbackTable.species} = '${options.species}'`
      );
    }

    try {
      const feedbacks = await apiManager.fetchFeedback({
        requestUrl: config.URL.feedbackTable + "/query",
        where: whereClauseParts.join(" AND ")
      });

      const formattedFeedbackData = feedbacks.map(d => {
        let retObj = {
          userID: d.attributes[config.FIELD_NAME.feedbackTable.userID],
          hucID: d.attributes[config.FIELD_NAME.feedbackTable.ecoShapeID],
          species: d.attributes[config.FIELD_NAME.feedbackTable.species],
          status: d.attributes[config.FIELD_NAME.feedbackTable.status],
          comment: d.attributes[config.FIELD_NAME.feedbackTable.comment]
        };

        // If additional fields, then we need to set them for the feedbackDatastore
        if (
          config.FIELD_NAME.feedbackTable.additionalFields &&
          config.FIELD_NAME.feedbackTable.additionalFields.length > 0
        ) {
          retObj.additionalFields = {};
          config.FIELD_NAME.feedbackTable.additionalFields.forEach(addField => {
            if (addField.editable) {
              retObj.additionalFields[addField.field] =
                d.attributes[addField.field];
            }
          });
        }

        return retObj;
      });

      if (onSuccessHandler) {
        onSuccessHandler(formattedFeedbackData);
      } else {
        feedbackManager.batchAddToDataStore(formattedFeedbackData);
      }

      return feedbacks;
    } catch (err) {
      console.error(err);
    }
  };

  const queryOverallFeedbacksByUser = async () => {
    const userID = oauthManager.getUserID();

    try {
      const feedbacks = await apiManager.fetchFeedback({
        requestUrl: config.URL.overallFeedback + "/query",
        where: `${config.FIELD_NAME.overallFeedback.userID} = '${userID}' AND ${config.FIELD_NAME.overallFeedback.retirementDate} IS NULL`
      });

      saveOverallFeedbackToDataModel(feedbacks);

      return feedbacks;
    } catch (err) {
      console.error(err);
    }
  };

  // get overall feedbacks for the selected species that are from all users
  const getOverallFeedbacksForReviewMode = async () => {
    const species = dataModel.getSelectedSpecies();

    try {
      const feedbacks = await apiManager.fetchFeedback({
        requestUrl: config.URL.overallFeedback + "/query",
        where: `${config.FIELD_NAME.overallFeedback.species} = '${species}' AND ${config.FIELD_NAME.overallFeedback.retirementDate} is NULL`
      });

      controllerProps.overallFeedbackForReviewModeOnReady(feedbacks);
    } catch (err) {
      console.error(err);
    }
  };

  // add data load date
  const postOverallFeedback = async (
    data = {
      rating: 0,
      comment: ""
    }
  ) => {
    const userID = oauthManager.getUserID();
    const species = dataModel.getSelectedSpecies();

    const feature = {
      attributes: {
        [config.FIELD_NAME.overallFeedback.userID]: userID,
        [config.FIELD_NAME.overallFeedback.species]: species,
        [config.FIELD_NAME.overallFeedback.rating]: data.rating,
        [config.FIELD_NAME.overallFeedback.comment]: data.comment
      }
    };

    saveOverallFeedbackToDataModel([feature]);

    try {
      const dataLoadDate = await apiManager.getDataLoadDate(species);
      // console.log(dataLoadDate);

      const feedbacks = await apiManager.fetchFeedback({
        requestUrl: config.URL.overallFeedback + "/query",
        where: `${config.FIELD_NAME.overallFeedback.userID} = '${userID}' AND ${config.FIELD_NAME.overallFeedback.species} = '${species}' AND ${config.FIELD_NAME.overallFeedback.retirementDate} is null`
      });

      const requestUrl = feedbacks[0]
        ? config.URL.overallFeedback + "/updateFeatures"
        : config.URL.overallFeedback + "/addFeatures";
      // let operationName = 'addFeatures';

      if (feedbacks[0]) {
        feature.attributes.ObjectId = feedbacks[0].attributes.ObjectId;
      }

      if (dataLoadDate) {
        feature.attributes[
          config.FIELD_NAME.overallFeedback.data_load_date
        ] = dataLoadDate;
      }

      apiManager
        .applyEditToFeatureTable(requestUrl, feature)
        .then(res => {
          console.log("post edit to OverallFeedback table", res);
        })
        .catch(err => {
          alert(`${feedbackFailMessage}`);
        });

      controllerProps.onOverallFeedbackSubmit(feature);
    } catch (err) {
      console.error(err);
    }
  };

  const getFeedbacksByUserForReviewMode = (userID = "") => {
    queryFeedbacksByUser({
      userID,
      species: dataModel.getSelectedSpecies(),
      onSuccessHandler: data => {
        controllerProps.clearMapGraphics();

        data.forEach(d => {
          showEcoFeatureOnMap(d.hucID, d.status, d);
        });

        controllerProps.feedbackByUsersForReviewModeOnReady(data);
      }
    });
  };

  const getFeedbacksByHucForReviewMode = async hucFeature => {
    const ecoID = hucFeature.attributes[config.FIELD_NAME.ecoShapeLayerID];
    const hucName = hucFeature.attributes[config.FIELD_NAME.ecoShapeLayerID];

    try {
      const feedbacks = await apiManager.fetchFeedback({
        requestUrl: config.URL.feedbackTable + "/query",
        where: `${config.FIELD_NAME.feedbackTable.ecoShapeID} = '${ecoID}' AND ${
          config.FIELD_NAME.feedbackTable.species
        } = '${dataModel.getSelectedSpecies()}' AND ${
          config.FIELD_NAME.feedbackTable.retirementDate
        } is null`
      });

      controllerProps.feedbackByHucsForReviewModeOnReady({
        data: feedbacks,
        hucName
      });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteFeedback = async (data = {}) => {
    // // query feedback table to see if such feature already exists, if so, call update feature operation, otherwise, call add feature operation

    try {
      const feedbacks = await apiManager.fetchFeedback({
        requestUrl: config.URL.feedbackTable + "/query",
        where: `${config.FIELD_NAME.feedbackTable.userID} = '${data.userID}' AND ${config.FIELD_NAME.feedbackTable.species} = '${data.species}' AND ${config.FIELD_NAME.feedbackTable.ecoShapeID} = '${data.hucID}'`
      });

      if (feedbacks[0]) {
        const requestUrl = config.URL.feedbackTable + "/deleteFeatures";
        const objectID = feedbacks[0].attributes.ObjectId;

        apiManager.deleteFromFeedbackTable(requestUrl, objectID).then(res => {
          console.log("deleted from feedback table", res);
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // add data load date
  const postFeedback = async (data = {}) => {
    // console.log(data);

    try {
      const dataLoadDate = await apiManager.getDataLoadDate(data.species);
      // console.log(dataLoadDate);

      let feedbackFeature = {
        attributes: {
          [config.FIELD_NAME.feedbackTable.userID]: data.userID,
          [config.FIELD_NAME.feedbackTable.ecoShapeID]: data.hucID,
          [config.FIELD_NAME.feedbackTable.status]: data.status,
          [config.FIELD_NAME.feedbackTable.comment]: data.comment,
          [config.FIELD_NAME.feedbackTable.species]: data.species
        }
      };

      // If additional fields, then we need to set them
      if (
        config.FIELD_NAME.feedbackTable.additionalFields &&
        config.FIELD_NAME.feedbackTable.additionalFields.length > 0
      ) {
        config.FIELD_NAME.feedbackTable.additionalFields.forEach(addField => {
          if (
            data.additionalFields[addField.field] !== null &&
            data.additionalFields[addField.field] !== "null"
          ) {
            if (addField.editable) {
              feedbackFeature.attributes[addField.field] =
                data.additionalFields[addField.field];
            }
          }
        });
      }

      const feedbacks = await apiManager.fetchFeedback({
        requestUrl: config.URL.feedbackTable + "/query",
        where: `${config.FIELD_NAME.feedbackTable.userID} = '${data.userID}' AND ${config.FIELD_NAME.feedbackTable.species} = '${data.species}' AND ${config.FIELD_NAME.feedbackTable.ecoShapeID} = '${data.hucID}'`
      });

      const requestUrl = feedbacks[0]
        ? config.URL.feedbackTable + "/updateFeatures"
        : config.URL.feedbackTable + "/addFeatures";
      // let operationName = 'addFeatures';

      if (feedbacks[0]) {
        feedbackFeature.attributes.ObjectId = feedbacks[0].attributes.ObjectId;
      }

      if (dataLoadDate) {
        feedbackFeature.attributes[
          config.FIELD_NAME.feedbackTable.data_load_date
        ] = dataLoadDate;
      }

      apiManager
        .applyEditToFeatureTable(requestUrl, feedbackFeature)
        .then(res => {
          console.log("post edit to Feedback table", res);
        })
        .catch(err => {
          alert(`${feedbackFailMessage}`);
        });
    } catch (err) {
      console.error(err);
    }
  };

  const getHucsWithFeedbacksForReviewMode = async () => {
    const species = dataModel.getSelectedSpecies();

    if (dataModelForReviewMode.getEcosWithFeedbacks(species)) {
      renderListOfHucsWithFeedbacks();
    } else {
      try {
        const feedbacks = await apiManager.fetchFeedback({
          requestUrl: config.URL.feedbackTable + "/query",
          where: `${config.FIELD_NAME.feedbackTable.species} = '${species}'`,
          outFields: `${config.FIELD_NAME.feedbackTable.ecoShapeID}, ${config.FIELD_NAME.feedbackTable.status}`,
          returnDistinctValues: true
        });

        dataModelForReviewMode.setEcosWithFeedbacks(species, feedbacks);

        renderListOfHucsWithFeedbacks();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const renderEcoShpsBySpeciesDataOnMap = (
    options = {
      data: null,
      speciesKey: ""
    }
  ) => {
    const ecos = options.data || dataModel.getEcoShpsBySpecies();

    if (options.speciesKey) {
      // // TODO: need to use a single feature service instead of separate ones
      // const speciesInfo = dataModel.getSpeciesInfo(options.speciesKey);
      // const actualBoundaryLayerUrl = speciesInfo[config.FIELD_NAME.speciesLookup.boundaryLayerLink];
      // const actualBoundaryLayerUrl =config.URL.PredictedHabitat[options.speciesKey];
      // // TODO: need to create the boundary layer in nature serve's org
      // if(actualBoundaryLayerUrl){
      //     controllerProps.addActualBoundaryLayerToMap(actualBoundaryLayerUrl);
      // }
      //controllerProps.showToPredictedHabitatOnMap(options.speciesKey);
    }

    // mapControl.highlightEcos(hucs);
    const ecoIds = [
      ...new Set(
        ecos.map(data => {
          let currId = data[config.FIELD_NAME.speciesDistribution.ecoShapeID];
          while (currId.length != 8) {
            currId = `0${currId}`;
          }
          return currId;
        })
      )
    ];

    if (ecoIds.length === 0) {
      const species = dataModel.getSelectedSpecies();
      const feedbackData = feedbackManager.getFeedbackDataBySpecies(species);
      if (feedbackData) {
        Object.keys(feedbackData).forEach(function(key) {
          ecoIds.push(feedbackData[key].hucID);
        });
      }
    }
    controllerProps.zoomToEcoShpsOnMap(ecoIds);
    
    controllerProps.highligtEcosOnMap(ecoIds);

    if (!isReviewMode) {
      renderEcoWithFeedbackDataOnMap();
    }
  };
  
  const renderEcoWithFeedbackDataOnMap = data => {
    const species = dataModel.getSelectedSpecies();
    data = data || feedbackManager.getFeedbackDataBySpecies(species);

    // console.log('renderEcoWithFeedbackDataOnMap >>> species', species);
    // console.log('renderEcoWithFeedbackDataOnMap >>> data', data);

    if (data) {
      Object.keys(data).forEach(function(key) {
        // console.log(key, data[key]);

        const ecoID = data[key].hucID;
        const status = data[key].status;
        console.log("renderEcoWithFeedbackDataOnMap ::  ecoid: " + ecoID + " status: " + status)
        showEcoFeatureOnMap(ecoID, status, data[key]);
      });
    }
  };

  const setSelectedHucFeature = (feature = null) => {
    state.selectedHucFeature = feature;

    const ecoID =
      state.selectedHucFeature.attributes[config.FIELD_NAME.ecoShapeLayerID];
    console.log("setSelectedHucFeature ", ecoID)
    if (!isReviewMode) {
      dataModel.setSelectedEcoShp(ecoID);

      // console.log(selectedHucFeature);
      openFeedbackManager();
    } else {
      // console.log('query feedbacks for selected huc', ecoID);
      controllerProps.hucFeatureOnSelectForReviewMode(state.selectedHucFeature);
    }
  };

  const resetSelectedEcoFeature = () => {
    state.selectedHucFeature = null;

    dataModel.setSelectedEcoShp();

    // mapControl.cleanPreviewEcoGraphic();

    controllerProps.clearMapGraphics("ecoPreview");

    feedbackManager.close();
  };

  const openFeedbackManager = (options = {}) => {
    const userID = oauthManager.getUserID();
    const species = dataModel.getSelectedSpecies();
    const ecoID = dataModel.getSelectedEcoShp();
    const hucName =
      state.selectedHucFeature.attributes[config.FIELD_NAME.hucLayerHucName];
    const isHucInModeledRange = dataModel.isHucInModeledRange(ecoID, species);

    // Adding addditional fields to feedback table for view/edit, pulling initial values from hucs by species extent table
    let additionalFields = {};
    if (
      config.FIELD_NAME.feedbackTable.additionalFields &&
      config.FIELD_NAME.feedbackTable.additionalFields.length > 0
    ) {
      const hucsBySpeciesData = dataModel.getEcoShpsBySpecies(species);
      const hucForSpeciesData = hucsBySpeciesData
        ? hucsBySpeciesData.filter(
            hucData =>
              hucData[config.FIELD_NAME.speciesDistribution.ecoShapeID] === ecoID
          )
        : [];
      if (hucForSpeciesData && hucForSpeciesData.length > 0) {
        config.FIELD_NAME.feedbackTable.additionalFields.forEach(addField => {
          // Pull from huc either by special hucField in the feedback additional fields, or by the same field name as in the feedback table
          additionalFields[addField.field] =
            hucForSpeciesData[0][addField.hucField || addField.field];
        });
      }
    }

    // console.log('isHucInModeledRange', isHucInModeledRange);
    console.log("openFeedbackManager", userID, species, ecoID)
    if (userID && species && ecoID) {
      feedbackManager.open({
        userID,
        species,
        ecoID,
        hucName,
        isHucInModeledRange,
        additionalFields
      });
    } else {
      console.error(
        "userID, species name and huc id are required to open the feedback manager..."
      );
      resetSelectedEcoFeature();
    }
  };

  const getPdfUrlForSelectedSpecies = async () => {
    const species = dataModel.getSelectedSpecies();
    // const url = config.URL.pdf[species];
    // const url = dataModel.getSpeciesInfo(species)[config.FIELD_NAME.speciesLookup.pdfLink];
    try {
      const pdfLookupFeatures = await apiManager.queryPdfTable(species);

      if (
        pdfLookupFeatures[0] &&
        pdfLookupFeatures[0].attributes[config.FIELD_NAME.pdfLookup.url]
      ) {
        // console.log('pdfLookupFeatures[0].url', pdfLookupFeatures[0].attributes[config.FIELD_NAME.pdfLookup.url])
        return pdfLookupFeatures[0].attributes[config.FIELD_NAME.pdfLookup.url];
      } else {
        return null;
      }
    } catch (err) {
      return null;
    }
  };

  const downloadPdf = async () => {
    // console.log('controller: download pdf');
    // const url = await getPdfUrlForSelectedSpecies();
    // console.log(url);
    // if (url) {
    //   window.open(url);
    // } else {
    //   console.error("no pdf file is found for selected species", species);
    // }
  };

  const getOverallFeedback = () => {
    const species = dataModel.getSelectedSpecies();

    const prevFeedbackData = dataModel.getOverallFeedback(species);

    // console.log(prevFeedbackData);

    const data = prevFeedbackData
      ? {
          rating: prevFeedbackData[config.FIELD_NAME.overallFeedback.rating],
          comment: prevFeedbackData[config.FIELD_NAME.overallFeedback.comment]
        }
      : {};

    return data;
  };

  const saveOverallFeedbackToDataModel = features => {
    // const data = {};

    features.forEach(feature => {
      const key = feature.attributes[config.FIELD_NAME.overallFeedback.species];

      const val = {
        [config.FIELD_NAME.overallFeedback.rating]:
          feature.attributes[config.FIELD_NAME.overallFeedback.rating],
        [config.FIELD_NAME.overallFeedback.comment]:
          feature.attributes[config.FIELD_NAME.overallFeedback.comment]
      };

      dataModel.saveToOverallFeedback(key, val);
    });

    // console.log(data);
  };

  const renderListOfHucsWithFeedbacks = () => {
    const species = dataModel.getSelectedSpecies();
    const features = dataModelForReviewMode.getEcosWithFeedbacks(species);

    // mapControl.clearAllGraphics();

    controllerProps.clearMapGraphics();
    console.log("render eco shapes with feedback:")
    console.log(features)
    features.forEach(feature => {
      showEcoFeatureOnMap(
        feature.attributes[config.FIELD_NAME.feedbackTable.ecoShapeID],
        feature.attributes[config.FIELD_NAME.feedbackTable.status]
      );
    });
  };

  const showEcoFeatureOnMap = (hucID = "", status = 0, data = null) => {
    if (!hucID) {
      console.error("hucID is missing...");
      return;
    }

    controllerProps.showEcoFeatureOnMap(hucID, status);
  };

  const setSelectedSpecies = async val => {
    // console.log('setSelectedSpecies', val);
    console.log("setSelectedSpecies was called using the value:  "+ val)
    dataModel.setSelectedSpecies(val);

    searchEcoShapesBySpecies(val);

    resetSelectedEcoFeature();

    controllerProps.speciesOnSelect();

    //controllerProps.pdfUrlOnChange(await getPdfUrlForSelectedSpecies());

    if (isReviewMode) {
      getOverallFeedbacksForReviewMode();
      getHucsWithFeedbacksForReviewMode();
    }
  };

  const getStatusDataForLegend = data => {
    data = data.map((d, i) => {
      return {
        label: d
        // color: config.COLOR['status' + i]
      };
    });

/*     data.unshift({
      label: "Predicted Habitat",
      minVisibleScale: config.visibleRange.predictedHabitat.minScale
      // color: config.COLOR.actualModeledExtent
    }); */

    return data;
  };

  const getDistinctSpeciesCodeToReview = data => {
    const distinctSpeciesCode = data.map(d => {
      return d.attributes[config.FIELD_NAME.speciesByUser.speciesCode];
    });
    console.log("Return of distinct species code:  " + distinctSpeciesCode)
    return distinctSpeciesCode;
  };

  const signOut = () => {
    oauthManager.signOut();
  };

  return {
    init,
    dataModel,
    feedbackManager,
    setSelectedHucFeature,
    resetSelectedEcoFeature,
    downloadPdf,
    getOverallFeedback,
    setSelectedSpecies,
    postOverallFeedback,
    getFeedbacksByUserForReviewMode,
    renderListOfHucsWithFeedbacks,
    getFeedbacksByHucForReviewMode,
    signOut
    // openFeedbackManager
  };
}
