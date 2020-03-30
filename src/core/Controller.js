"use strict";

import DataModel from "./DataModel";
import DataModelForReviewMode from "./DataModelForReviewMode";
import FeedbackManager from "./FeedbackManager";
import config from "../config";
//import OAuthManager from "./OauthManager";
import ApiManager from "./ApiManager";
//import View from "./View";
//import MapControl from "./MapControl";

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
      const portalUser = oauthManager.getPoralUser();
      const speciesByUsers = await apiManager.querySpeciesByUser({
        username: portalUser.username
      });
      console.log("speciesByUsers result: ", speciesByUsers)
      const distinctUserSpecies = getDistinctSpeciesCodeToReview(
        speciesByUsers
      );

      const userIsAdmin = distinctUserSpecies.some(itm => itm == -1);
      //console.log("is admin? ", userIsAdmin)
      //Can do an override here for admin to query all or not... 
      const sepeciesData =
        portalUser.username === config.adminUser ||
          (distinctUserSpecies && distinctUserSpecies.length > 0 && userIsAdmin)
          ? await apiManager.queryAllFeaturesFromSpeciesLookupTable()
          : await apiManager.querySpeciesLookupTable({
            speciesCode: distinctUserSpecies,
            username: portalUser.username
          });
      console.log("sepeciesData == ", sepeciesData);

      const statusData = config.STATUS;
      state.domains = statusData;

      initStatusTable(statusData);

      initFeedbackManager();

      const deatiledFeedbacks = await queryFeedbacksByUser();

      const overallFeedbacks = await queryOverallFeedbacksByUser();
      // console.log(deatiledFeedbacks, overallFeedbacks);

      initSpeciesLookupTable(sepeciesData, deatiledFeedbacks, overallFeedbacks);

    } catch (err) {
      console.error(err);
    }
  };

  const initFeedbackManager = () => {
    feedbackManager.init({
      onOpenHandler: data => {
        const prevFeedbackData = dataModel.getOverallFeedback(dataModel.selectedSpecies);
        data['datecompleted'] = (prevFeedbackData && prevFeedbackData.datecompleted) ? prevFeedbackData.datecompleted : null;
        controllerProps.feedbackManagerOnOpen(data);
        if (document.getElementsByClassName('esri-icon-trash')[0]){ 
          var elem = document.getElementsByClassName('esri-icon-trash')[0].click();
        }
      },

      onCloseHandler: () => {
        controllerProps.feedbackManagerOnClose();
        try {
          document.getElementsByClassName('esri-sketch')[0].style.display = "none";
        } catch (e) { }
      },

      onSubmitHandler: data => {
        postFeedback(data);
        showEcoFeatureOnMap(data.ecoID, data.markup, data);
        resetSelectedEcoFeature();

        controllerProps.onDeatiledFeedbackSubmit(data);
      },
      onSubmitMSHandler: data => {
        //console.log('MS DATA feedback manager onSubmitHandler', data);
        postFeedbackMS(data);
        data.forEach(element => {
          showEcoFeatureOnMap(element.ecoID, element.markup, element);
        });

        resetSelectedEcoFeature();
      },

      onSubmitSaveHandler: data => {
        //console.log('feedback manager onSubmitSaveHandler', data);

        postFeedbackWithSave(data);
        showEcoFeatureOnMap(data.ecoID, data.markup, data);
        resetSelectedEcoFeature();

        controllerProps.onDeatiledFeedbackSubmit(data);
      },

      onRemoveHandler: data => {
        // console.log('feedback manager onRemoveHandler', data);
        deleteFeedback(data);
        showEcoFeatureOnMap(data.ecoID);
        resetSelectedEcoFeature();
      },

      onRemoveMSHandler: data => {
        // console.log('feedback manager onRemoveHandler', data);
        deleteFeedbackMS(data);
        data.forEach(element => {
          showEcoFeatureOnMap(element.ecoID);
        });
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

    const speciesWithOverallFeedback = {};
    const speciesWithDeatiledFeedback = {};
    console.log("deatiledFeedbacks foreach: ", deatiledFeedbacks)
    deatiledFeedbacks.forEach(d => {
      const species = d.attributes[config.FIELD_NAME.feedbackTable.species];
      speciesWithDeatiledFeedback[species] = true;
    });
    console.log("overallFeedbacks foreach: ", overallFeedbacks)
    overallFeedbacks.forEach(d => {
      const species = d.attributes[config.FIELD_NAME.overallFeedback.species];

      if (+d.attributes[config.FIELD_NAME.overallFeedback.rating]) {
        speciesWithOverallFeedback[species] = true;
      }
    });

    data = data.map(d => {
      const species = d.attributes[config.FIELD_NAME.speciesLookup.speciesCode];
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
  };


  const initStatusTable = data => {
    console.log('initStatusTable', data);

    data = data.map(d => {
      const lineBreakPattern = /(\r\n\t|\n|\r\t)/g;
      let statusType = d.attributes[config.FIELD_NAME.statusType];

      if (lineBreakPattern.test(statusType)) {
        statusType = statusType.replace(lineBreakPattern, " ");
      }
      return statusType;
    });

    dataModel.setStatus(data);

    controllerProps.legendDataOnReady(getStatusDataForLegend(data));
  };

  // get list of ecos by the species code (modelling extent), then render these ecos on map
  const searchEcoShapesBySpecies = async speciesKey => {
    //console.log("the speciesKey from searchEcoShapesBySpecies is: ", speciesKey)
    let data = dataModel.getEcoShpsBySpecies(speciesKey);
    //console.log("is there data in searchEcoShapesBySpecies: ", data)
    if (data) {
      renderEcoShpsBySpeciesDataOnMap({ data, speciesKey });
    } else {
      try {
        //console.log("No Data in searchEcoShapesBySpecies, so trying to do a query")
        data = await apiManager.queryEcoShapeBySpecies(speciesKey);
        data = data.map(d => {
          return d.attributes;
        });
        //console.log("this is from the try of searchEcoShapesBySpecies: ", data)
        dataModel.setEcoShpsBySpecies(speciesKey, data);

        renderEcoShpsBySpeciesDataOnMap({ data, speciesKey });
      } catch (err) {
        console.error("this is an error when trying to select ecoshapes and render:", err);
        // if no ecos features returned, pass an empty array so the map will re-render the ecos layers with no highlighted features
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
    console.log(userID)
    const onSuccessHandler = options.onSuccessHandler;
    const whereClauseParts = [
      `${config.FIELD_NAME.feedbackTable.username} = '${userID}'`
    ];
    if (options.species) {
      whereClauseParts.push(
        `${config.FIELD_NAME.feedbackTable.species} = '${options.species}'`
      );
    }

    try {
      //console.log("in TRY of queryFeedbacksByUser")
      const feedbacks = await apiManager.fetchFeedback({
        requestUrl: config.URL.feedbackTable + "/query",
        where: whereClauseParts.join(" AND ")
      });
      console.log("this is the result of feedbacks: ", feedbacks)
      const formattedFeedbackData = feedbacks.map(d => {
        let retObj = {
          reviewid: d.attributes[config.FIELD_NAME.feedbackTable.userID],
          ecoID: d.attributes[config.FIELD_NAME.feedbackTable.ecoShapeID],
          comment: d.attributes[config.FIELD_NAME.feedbackTable.comment],
          markup: d.attributes[config.FIELD_NAME.feedbackTable.markup],
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
        //console.log("this is the final retObj returned: ", retObj)
        return retObj;

      });

      if (onSuccessHandler) {
        onSuccessHandler(formattedFeedbackData);
      } else {
        feedbackManager.batchAddToDataStore(formattedFeedbackData);
      }
      //console.log("this is  the feedbacks: ", feedbacks)
      return feedbacks;
    } catch (err) {
      console.log("ERROR!! IN queryFeedbacksByUser")
      console.error(err);
    }
  };

  const queryOverallFeedbacksByUser = async () => {

    const userID = oauthManager.getUserID();

    try {
      const feedbacks = await apiManager.fetchFeedback({
        requestUrl: config.URL.overallFeedback + "/query",
        where: `${config.FIELD_NAME.overallFeedback.userID} = '${userID}'`
      });
      console.log("This is the queryOverallFeedbacksByUser feedback: ", feedbacks)
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
        where: `${config.FIELD_NAME.overallFeedback.species} = '${species}' AND ${config.FIELD_NAME.overallFeedback.datecompleted} is NULL`
      });
      //console.log("in getOverallFeedbacksForReviewMode ...but why in here?  feedbacks: ", feedbacks)
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
        [config.FIELD_NAME.overallFeedback.userID]: data.reviewid, //userID,
        [config.FIELD_NAME.overallFeedback.species]: species,
        [config.FIELD_NAME.overallFeedback.rating]: data.rating,
        [config.FIELD_NAME.overallFeedback.comment]: data.comment,
        [config.FIELD_NAME.overallFeedback.username]: data.userID,
        [config.FIELD_NAME.overallFeedback.datestarted]: data.datestarted,
        [config.FIELD_NAME.overallFeedback.datecompleted]: data.datecompleted
      }
    };

    saveOverallFeedbackToDataModel([feature]);

    try {
      //NOT USING DATALOADDATETABLE...
      //const dataLoadDate = await apiManager.getDataLoadDate(species);
      // console.log(dataLoadDate);

      const feedbacks = await apiManager.fetchFeedback({
        requestUrl: config.URL.overallFeedback + "/query",
        where: `${config.FIELD_NAME.overallFeedback.userID} = '${userID}' AND ${config.FIELD_NAME.overallFeedback.species} = '${species}'` //AND ${config.FIELD_NAME.overallFeedback.datecompleted} is null`
      });
      //console.log(feedbacks[0]);

      const requestUrl = feedbacks[0]
        ? config.URL.overallFeedback + "/updateFeatures"
        : config.URL.overallFeedback + "/addFeatures";

      if (feedbacks[0]) {
        feature.attributes.ObjectId = feedbacks[0].attributes.objectid;
        // if (!feature.attributes.datestarted) {
        //   feature.attributes.datestarted = new Date().getTime();
        // }
      }
      // else {
      //   feature.attributes.datestarted = new Date().getTime();
      // }
      // REVIEWER TABLE HAS NO DATE FIELDS...
      /* 
      if (dataLoadDate) {
        feature.attributes[
          config.FIELD_NAME.overallFeedback.datestarted
        ] = dataLoadDate;
      }
     */
      apiManager
        .applyEditToFeatureTable(requestUrl, [feature])
        .then(res => {
          console.log("post edit to OverallFeedback table - SAVE", res);
          const revSub = document.getElementById("review_submitted");
          if (feature.attributes.datecompleted){
            revSub.style.display = "block";
          }
          try {
            if (res['data']['addResults']) {
              let resArray = res['data']['addResults'];
              if (resArray[0]['success'] == false) {
                alert(resArray[0]['error']['description']);
                console.error("post edit to OverallFeedback table - SAVE ADD NEW", resArray);
              }
            }
            if (res['data']['updateResults']) {
              let resArray = res['data']['updateResults'];
              if (resArray[0]['success'] == false) {
                alert(resArray[0]['error']['description']);
                console.error("post edit to OverallFeedback table - SAVE UPDATE", resArray);
              }
            }
          } catch{ }
        })
        .catch(err => {
          console.log(`${feedbackFailMessage}`);
          alert(`${feedbackFailMessage}`);
          revSub.style.display = "none";
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
        console.log("getFeedbacksByUserForReviewMode and then going to showEcoFeatureOnMap", data)
        data.forEach(d => {
          showEcoFeatureOnMap(d.ecoID, d.markup, d);
        });

        controllerProps.feedbackByUsersForReviewModeOnReady(data);
      }
    });
  };

  const getFeedbacksByHucForReviewMode = async hucFeature => {
    const ecoID = hucFeature.attributes[config.FIELD_NAME.ecoShapeLayerID];
    const ecoName = hucFeature.attributes[config.FIELD_NAME.ecoShapeLayerID];
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
        ecoName
      });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteFeedbackMS = async dataList => {
    dataList.forEach(element => {
      deleteFeedback(element);
    });
  }

  const deleteFeedback = async (data = {}) => {
    // query feedback table to see if such feature already exists, if so, call update feature operation, otherwise, call add feature operation

    try {
      const feedbacks = await apiManager.fetchFeedback({
        requestUrl: config.URL.feedbackTable + "/query",
        //where: `${config.FIELD_NAME.feedbackTable.userID} = '${data.userID}' AND ${config.FIELD_NAME.feedbackTable.species} = '${data.species}' AND ${config.FIELD_NAME.feedbackTable.ecoShapeID} = '${data.ecoID}'`
        where: `${config.FIELD_NAME.feedbackTable.species} = '${data.reviewid}' AND ${config.FIELD_NAME.feedbackTable.ecoShapeID} = '${data.ecoID}'`
      });

      if (feedbacks[0]) {
        const requestUrl = config.URL.feedbackTable + "/deleteFeatures";
        const objectID = feedbacks[0].attributes.objectid;

        apiManager.deleteFromFeedbackTable(requestUrl, objectID).then(res => {
          console.log("deleted from feedback table", res);
        });
      }
    } catch (err) {
      console.error(err);
    }
  };


  const postFeedbackMS = async (dataList = []) => {
    try {
      dataList.forEach(data => {
        console.log(data);
        postFeedback(data);
      });
    }
    catch (e) { console.error(e); }
  }

  // add data load date
  const postFeedback = async (data = {}) => {
    //console.log('data.species', data.species);
    //alert(data.species);
    try {
      //const dataLoadDate = await apiManager.getDataLoadDate(data.species);

      let feedbackFeature = {
        attributes: {
          [config.FIELD_NAME.feedbackTable.userID]: data.reviewid, //data.userID,
          [config.FIELD_NAME.feedbackTable.ecoShapeID]: data.ecoID,
          //[config.FIELD_NAME.feedbackTable.status]: data.status,
          [config.FIELD_NAME.feedbackTable.comment]: data.comment,
          //[config.FIELD_NAME.feedbackTable.species]: data.species,
          [config.FIELD_NAME.feedbackTable.username]: data.userID,
          [config.FIELD_NAME.feedbackTable.markup]: data.markup,
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
            // if (addField.editable) {
            if (addField.visible) {
              feedbackFeature.attributes[addField.field] =
                data.additionalFields[addField.field];
            }
          }
        });
      }

      const feedbacks = await apiManager.fetchFeedback({
        requestUrl: config.URL.feedbackTable + "/query",
        //where: `${config.FIELD_NAME.feedbackTable.userID} = '${data.userID}' AND ${config.FIELD_NAME.feedbackTable.species} = '${data.species}' AND ${config.FIELD_NAME.feedbackTable.ecoShapeID} = '${data.ecoID}'`
        where: `${config.FIELD_NAME.feedbackTable.species} = '${data.reviewid}' AND ${config.FIELD_NAME.feedbackTable.ecoShapeID} = '${data.ecoID}'`
      });

      const requestUrl = feedbacks[0]
        ? config.URL.feedbackTable + "/updateFeatures"
        : config.URL.feedbackTable + "/addFeatures";

      if (feedbacks[0]) {
        feedbackFeature.attributes.objectid = feedbacks[0].attributes.objectid;   // objectid cAsE must match the FS field
      }

      // REVIEWER TABLE HAS NO DATE FIELDS...
      /*
      if (dataLoadDate) {
        feedbackFeature.attributes[
          config.FIELD_NAME.feedbackTable.datestarted
        ] = dataLoadDate;
      } */

      apiManager
        .applyEditToFeatureTable(requestUrl, [feedbackFeature])
        .then(res => {

          console.log("post edit to Feedback table", res);
          try {
            if (res['data']['addResults']) {
              let resArray = res['data']['addResults'];
              if (resArray[0]['success'] == false) {
                alert(resArray[0]['error']['description']);
                console.error("post edit to Feedback table", resArray);
              }
            }
            if (res['data']['updateResults']) {
              let resArray = res['data']['updateResults'];
              if (resArray[0]['success'] == false) {
                alert(resArray[0]['error']['description']);
                console.error("post edit to Feedback table", resArray);
              }
            }
          } catch{ }
        })
        .catch(err => {
          alert(`${feedbackFailMessage}`);
        });


    } catch (err) {
      console.error(err);
    }
  };


  const postFeedbackWithSave = async (data = {}) => {

    try {
      //const dataLoadDate = await apiManager.getDataLoadDate(data.species);

      let feedbackFeature = {
        attributes: {
          [config.FIELD_NAME.feedbackTable.userID]: data.reviewid,
          [config.FIELD_NAME.feedbackTable.ecoShapeID]: data.ecoID,
          [config.FIELD_NAME.feedbackTable.comment]: data.comment,
          [config.FIELD_NAME.feedbackTable.species]: data.species,
          [config.FIELD_NAME.feedbackTable.username]: data.userID,
          [config.FIELD_NAME.feedbackTable.datecompleted]: data.datecompleted,
          [config.FIELD_NAME.feedbackTable.markup]: data.markup,
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
        where: `${config.FIELD_NAME.feedbackTable.species} = '${data.reviewid}' AND ${config.FIELD_NAME.feedbackTable.ecoShapeID} = '${data.ecoID}'`
      });

      const requestUrl = feedbacks[0]
        ? config.URL.feedbackTable + "/updateFeatures"
        : config.URL.feedbackTable + "/addFeatures";

      if (feedbacks[0]) {
        feedbackFeature.attributes.objectid = feedbacks[0].attributes.objectid;   // objectid cAsE must match the FS field
      }

      // REVIEWER TABLE HAS NO DATE FIELDS...
      /*
      if (dataLoadDate) {
        feedbackFeature.attributes[
          config.FIELD_NAME.feedbackTable.datestarted
        ] = dataLoadDate;
      } */

      apiManager
        .applyEditToFeatureTable(requestUrl, [feedbackFeature])
        .then(res => {
          console.log("post edit to Feedback table", res);
          try {
            if (res['data']['addResults']) {
              let resArray = res['data']['addResults'];
              if (resArray[0]['success'] == false) {
                alert(resArray[0]['error']['description']);
                console.error("post edit to Feedback table", resArray);
              }
            }
            if (res['data']['updateResults']) {
              let resArray = res['data']['updateResults'];
              if (resArray[0]['success'] == false) {
                alert(resArray[0]['error']['description']);
                console.error("post edit to Feedback table", resArray);
              }
            }
          } catch{ }
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
          outFields: `${config.FIELD_NAME.feedbackTable.ecoShapeID}, ${config.FIELD_NAME.feedbackTable.markup}`,
          returnDistinctValues: true
        });
        //console.log("now setting the feedbacks into the datamodelforreivew: ", feedbacks)
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

    controllerProps.clearEcoPresenceGraphics();
    if (ecoIds.length === 0) {
      const species = dataModel.getSelectedSpecies();
      const reviewId = dataModel.getReviewId(species)
      const feedbackData = feedbackManager.getFeedbackDataBySpecies(reviewId);
      if (feedbackData) {
        Object.keys(feedbackData).forEach(function (key) {
          ecoIds.push(feedbackData[key].ecoID);
        });
      }
    }
    // controllerProps.zoomToEcoShpsOnMap(ecoIds);
    var dataCount = Object.keys(ecos).length;
    const modal = document.getElementById("myModal");
    modal.style.display = "block";

    if (ecos) {
      let cnt =0;
      Object.keys(ecos).forEach(function (key) {
        cnt++;
        const ecoID = ecos[key].ecoshapeid;
        const presence = ecos[key].presence;
        //showEcoFeatureOnMap(ecoID, status, data[key]);   
      
        // Timer for very large number of ecoshapes. Lariurus for example draws 1500 polys,
        //  spamming all those at once causes a resource issue and many fail to draw.
        //  this slight pause, while not ideal allows the requests to complete successfully
        // NEED TO REVISIT and further down in the draw > query functions, do less requests.
        if (cnt % 300 == 0){
            setTimeout(function(){},300);
        } 

        controllerProps.showEcoPresenceOnMap(ecoID, presence, dataCount);
        //controllerProps.zoomToEcoShpsOnMap(ecoIds);

      });
    }
    if (!isReviewMode) {
      renderEcoWithFeedbackDataOnMap();
    }
  };

  const renderEcoWithFeedbackDataOnMap = data => {
    //console.log("THIS IS WHERE THE FEEDBACK DRAW ALL BEGINS....")
    let species = dataModel.getSelectedSpecies();
    if (species) {
      species = parseInt(species);
      const reviewId = dataModel.getReviewId(species);
      data = data || feedbackManager.getFeedbackDataBySpecies(reviewId);
    }
    //data = data || feedbackManager.getFeedbackDataBySpecies(reviewId);

    //console.log('renderEcoWithFeedbackDataOnMap >>> species', species);
    //console.log('renderEcoWithFeedbackDataOnMap >>> data', data);

    if (dataModel.selectedSpecies) {  
      let overfb = dataModel.getOverallFeedback(dataModel.selectedSpecies);
      if (!overfb.datestarted) {
        overfb.datestarted = new Date().getTime();
        dataModel.saveToOverallFeedback(dataModel.selectedSpecies, overfb);
        postOverallFeedback(overfb);
      }
      //----temp delete
      // overfb.datestarted = null;
      // dataModel.saveToOverallFeedback(dataModel.selectedSpecies, overfb);
      // postOverallFeedback(overfb);
    }

    if (data) {
      var dataCount = Object.keys(data).length;
      const modal = document.getElementById("myModal");
      modal.style.display = "block";

      Object.keys(data).forEach(function (key) {
        const ecoID = data[key].ecoID;
        const markup = data[key].markup
        //console.log("renderEcoWithFeedbackDataOnMap ::  ecoid: " + ecoID + " markup: " + markup)
        showEcoFeatureOnMap(ecoID, markup, data[key], dataCount);
      });
    }
    else {
      controllerProps.runSetpEcoByStatusLoaded();
    }
  };

  const setSelectedHucFeature = (feature = null) => {
    state.selectedHucFeature = feature;
    const ecoID =
      state.selectedHucFeature.attributes[config.FIELD_NAME.ecoShapeLayerID];
    console.log("setSelectedHucFeature ", ecoID)
    if (!isReviewMode) {
      dataModel.setSelectedEcoShp(ecoID);
      openFeedbackManager(feature.attributes);
    } else {
      // console.log('query feedbacks for selected huc', ecoID);
      controllerProps.hucFeatureOnSelectForReviewMode(state.selectedHucFeature);
    }
  };

  const resetSelectedEcoFeature = () => {
    state.selectedHucFeature = null;
    feedbackManager.close();
  };

  const openFeedbackManager = (ecoAtts = {}) => {

    if (document.getElementById('overallFeedbackControlPanelContainer')) {
      document.getElementById('overallFeedbackControlPanelContainer').style.display = "none";
    }

    const userID = oauthManager.getUserID();
    const species = parseInt(dataModel.getSelectedSpecies());
    const ecoID = dataModel.getSelectedEcoShp();
    //const hucName = state.selectedHucFeature.attributes[config.FIELD_NAME.hucLayerHucName];
    const isHucInModeledRange = dataModel.isHucInModeledRange(ecoID, species);
    const reviewid = dataModel.getReviewId(species);

    // this was in additional fields, but need hucForSpeciesData Presence and Notes to put on UI
    const hucsBySpeciesData = dataModel.getEcoShpsBySpecies(species);
    const hucForSpeciesData = hucsBySpeciesData
      ? hucsBySpeciesData.filter(
        hucData =>
          hucData[config.FIELD_NAME.speciesDistribution.ecoShapeID] === ecoID) : [];

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

    if (userID && species && ecoID) {
      var obj = {
        userID,
        species,
        reviewid,
        ecoID,
        //hucName,
        isHucInModeledRange,
        additionalFields,
        ecoAtts,
        hucForSpeciesData
      };

      feedbackManager.open(obj);
      controllerProps.showMSdata();
    } else {
      console.error(
        "userID, species name and eco id are required to open the feedback manager..."
      );
      resetSelectedEcoFeature();
    }
  };

  const getOverallFeedback = () => {
    const species = dataModel.getSelectedSpecies();

    const prevFeedbackData = dataModel.getOverallFeedback(species);
    console.log(prevFeedbackData);

    const data = prevFeedbackData
      ? {
        rating: prevFeedbackData[config.FIELD_NAME.overallFeedback.rating],
        comment: prevFeedbackData[config.FIELD_NAME.overallFeedback.comment],
        datecompleted: prevFeedbackData[config.FIELD_NAME.overallFeedback.datecompleted]
      }
      : {};
    // if (!data.datecompleted) {
    //   document.getElementById("overallFeedbackControlPanelContainer").style.pointerEvents = "none";
    // }
    return data;
  };

  const saveOverallFeedbackToDataModel = features => {
    features.forEach(feature => {
      const key = feature.attributes[config.FIELD_NAME.overallFeedback.species];

      const val = {
        [config.FIELD_NAME.overallFeedback.rating]:
          feature.attributes[config.FIELD_NAME.overallFeedback.rating],
        [config.FIELD_NAME.overallFeedback.comment]:
          feature.attributes[config.FIELD_NAME.overallFeedback.comment],
        [config.FIELD_NAME.overallFeedback.datecompleted]:
          feature.attributes[config.FIELD_NAME.overallFeedback.datecompleted],
        [config.FIELD_NAME.overallFeedback.datestarted]:
          feature.attributes[config.FIELD_NAME.overallFeedback.datestarted]
      };

      dataModel.saveToOverallFeedback(key, val);
    });
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
        feature.attributes[config.FIELD_NAME.feedbackTable.markup]
        //feature.attributes[config.FIELD_NAME.feedbackTable.status]
      );
    });
  };

  const showEcoFeatureOnMap = (ecoId = "", markup = null, data = null, len = 0) => {

    console.log("showEcoFeatureOnMap ecoId:", ecoId, markup)
    if (!ecoId) {
      console.error("ecoID is missing...");
      return;
    }

    controllerProps.showEcoFeatureOnMap(ecoId, markup, len);
  };

  const setSelectedSpecies = async val => {
    console.log("setSelectedSpecies was called using the value:  " + val)

    dataModel.setSelectedSpecies(val);

    searchEcoShapesBySpecies(val);

    resetSelectedEcoFeature();

    controllerProps.speciesOnSelect();

    if (isReviewMode) {
      getOverallFeedbacksForReviewMode();
      getHucsWithFeedbacksForReviewMode();
    }
    //debugger
    let sel = dataModel.selectedSpecies;
    //dataModel.overallFeedback

  };

  const getMetadata = val => {
    return dataModel.getSpeciesInfo(val);
  }

  const getStatusDataForLegend = data => {
    data = data.map((d, i) => {
      return {
        label: d
        // color: config.COLOR['status' + i]
      };
    });

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
    getOverallFeedback,
    setSelectedSpecies,
    getMetadata,
    postOverallFeedback,
    getFeedbacksByUserForReviewMode,
    renderListOfHucsWithFeedbacks,
    getFeedbacksByHucForReviewMode,
    signOut
    // openFeedbackManager
  };
}
