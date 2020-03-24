import axios from "axios";
import config from "../config";

const Promise = require("es6-promise").Promise;

export default function ApiManager(props = {}) {
  const querySpeciesByUser = (
    options = {
      username: ""
    }
  ) => {
    const requestUrl = config.URL.speciesByUser + "/query";
    // was using id, now using portal login username 
    let whereClause = `${config.FIELD_NAME.speciesByUser.email} = '${options.username}'`; //???
      whereClause = "("+ whereClause + ") AND " + `${config.FIELD_NAME.speciesByUser.includeinebarreviewer} = 1`;
    //const whereClause = `${config.FIELD_NAME.speciesByUser.email} = 2`;
  
     
    console.log("query species by user url: ", requestUrl)
    console.log("query species by user where: ", whereClause)
    return queryForFeaturesGet(requestUrl, {
      where: whereClause,
      outFields: "*",
      f: "json",
      token: props.oauthManager.getToken()
    });
  };

  const querySpeciesLookupTable = (
    options = {
      speciesCode: []
    }
  ) => {
    const requestUrl = config.URL.speciesLookupTable + "/query";

    let whereClause = options.speciesCode
      .map(d => {
        return `${config.FIELD_NAME.speciesLookup.speciesCode} = '${d}'`;
      })
      .join(" OR ");
    // NS: need the username and to filter includereviewer to filter records properly
    whereClause = "("+ whereClause + ") AND " +`${config.FIELD_NAME.speciesByUser.email} = '${options.username}'`+ 
     "AND " + `${config.FIELD_NAME.speciesByUser.includeinebarreviewer} = 1`
    const bodyFormData = new FormData();
    console.log("USER: querySpeciesLookupTable whereClause: ", whereClause)

    bodyFormData.append("where", whereClause);
    bodyFormData.append("outFields", "*");
    bodyFormData.append("f", "json");
    bodyFormData.append("token", props.oauthManager.getToken());
    return queryForFeaturesPost(
      requestUrl,
      bodyFormData,
      "no features in species lookup table"
    );
  };

  const queryAllFeaturesFromSpeciesLookupTable = () => {
    console.log("DID AN ALL QUERY for _species _ BECAUSE ITS THE ADMIN....")
    const requestUrl = config.URL.speciesLookupTable + "/query";

    const bodyFormData = new FormData();
    bodyFormData.append("where", "1=1");
    bodyFormData.append("outFields", "*");
    bodyFormData.append("f", "json");
    bodyFormData.append("token", props.oauthManager.getToken());

    return queryForFeaturesPost(
      requestUrl,
      bodyFormData,
      "no species in species lookup table"
    );
  };


  const queryEcoShapeBySpecies = speciesKey => {
    // const requestUrl = config.URL.speciesExtent[speciesKey] ? config.URL.speciesExtent[speciesKey] + '/query' : null;
    const requestUrl = config.URL.speciesDistribution + "/query";
    const whereClause = `${config.FIELD_NAME.speciesDistribution.rangeValForLookup} = ${speciesKey}`;

    if (requestUrl) {
      console.log("queryEcoShapeBySpecies url: " + requestUrl)
      console.log("queryEcoShapeBySpecies where: " +  whereClause)
      return queryForFeaturesGet(
        requestUrl,
        {
          where: whereClause,
          outFields: "*",
          f: "json",
          token: props.oauthManager.getToken()
        },
        "no ecoshape features for selected species"
      );
    } else {
      console.log("species extent table url is not found for", speciesKey);
    }
  };

  const fetchFeedback = (options = {}) => {
    console.log("came from queryFeedbacksByUser try to do fetchFeedback")
    const requestUrl = options.requestUrl;  //config.URL.feedbackTable + '/query'; 
    console.log("fetchFeedback url: " + requestUrl)
    const whereClause = options.where || "1=1"; // options.where = "reviewid = 'gisadmin' AND retirementdate IS NULL" ???
    console.log("  fetchFeedback  whereClause: ", whereClause)
    const outFields = options.outFields || "*";
    const returnDistinctValues = options.returnDistinctValues || false;
    const orderByFields = options.returnDistinctValues ? outFields : null;

    return queryForFeaturesGet(
      requestUrl,
      {
        where: whereClause,
        outFields,
        returnDistinctValues,
        orderByFields,
        f: "json",
        token: props.oauthManager.getToken()
      },
      "no features found from the feedback table",
      true
    );
  };

  const deleteFromFeedbackTable = (requestUrl, objectID) => {
    // const requestUrl = config.URL.feedbackTable + '/deleteFeatures';

    const bodyFormData = new FormData();
    bodyFormData.append("objectIds", objectID);
    bodyFormData.append("rollbackOnFailure", false);
    bodyFormData.append("f", "pjson");
    bodyFormData.append("token", props.oauthManager.getToken());

    return new Promise((resolve, reject) => {
      axios
        .post(requestUrl, bodyFormData)
        .then(function(response) {
          // console.log(response);
          resolve(response);
        })
        .catch(err => {
          console.error(err);
          reject(err);
        });
    });
  };

  const applyEditToFeatureTable = (requestUrl, feature) => {
    // const requestUrl = config.URL.feedbackTable + '/' + operationName;
    const bodyFormData = new FormData();
    bodyFormData.append("features", JSON.stringify(feature));
    bodyFormData.append("rollbackOnFailure", false);
    bodyFormData.append("f", "pjson");
    bodyFormData.append("token", props.oauthManager.getToken());

    return new Promise((resolve, reject) => {
      axios
        .post(requestUrl, bodyFormData)
        .then(function(response) {
          // console.log(response);
          resolve(response);
        })
        .catch(err => {
          console.error(err);
          reject(err);
        });
    });
  };

  const getDistinctSpeciesCodeFromModelingExtent = () => {
    const requestUrl = config.URL.speciesDistribution + "/query";
    console.log("getDistinctSpeciesCodeFromModelingExtent URL: " + requestUrl)
    return new Promise(async (resolve, reject) => {
      let feats = await queryForFeaturesGet(
        requestUrl,
        {
          where: "1=1",
          outFields: config.FIELD_NAME.speciesDistribution.speciesCode,
          returnDistinctValues: true,
          f: "json",
          token: props.oauthManager.getToken()
        },
        "failure to query for distinct codes in extent",
        true
      );

      feats = feats.map(d => {
        return d.attributes[config.FIELD_NAME.speciesDistribution.speciesCode];
      });
      resolve(feats);
    });
  };

/* 
  const getDataLoadDate = (speciesCode = "") => {
    const fieldNameDataLoadDate =
      config.FIELD_NAME.datestarted.datestarted;
    const requestUrl = config.URL.datestarted + "/query";
    const where = `${config.FIELD_NAME.datestarted.species_code} = '${speciesCode}'`;

    return new Promise(async (resolve, reject) => {
      const queryResult = await queryForFeaturesGet(requestUrl, {
        where,
        outFields: fieldNameDataLoadDate,
        f: "json",
        token: props.oauthManager.getToken()
      });

      const dataLoadDate =
        queryResult && queryResult[0]
          ? queryResult[0].attributes[fieldNameDataLoadDate]
          : config.layerParameters.datestarted.defaultDate;

      resolve(dataLoadDate);
    });
  };
 */

  const queryForFeaturesGet = (
    requestUrl,
    params,
    rejectMessage,
    allowEmpty
  ) => {
    return new Promise((resolve, reject) => {
      let arrOfAllFeatures = [];

      const getFeatures = resultOffset => {
        if (resultOffset) {
          params.resultOffset = resultOffset;
        } else {
          resultOffset = 0;
        }

        axios
          .get(requestUrl, {
            params: params
          })
          .then(function(response) {
            if (
              response.data &&
              response.data.features &&
              response.data.features.length
            ) {
              arrOfAllFeatures = [
                ...arrOfAllFeatures,
                ...response.data.features
              ];
              if (response.data.exceededTransferLimit) {
                getFeatures(response.data.features.length + resultOffset);
              } else {
                resolve(arrOfAllFeatures);
              }
            } else {
              if (rejectMessage) {
                if (allowEmpty && response.data && response.data.features) {
                  resolve([]);
                } else {
                  reject(rejectMessage);
                }
              } else {
                resolve([]);
              }
            }
          })
          .catch(err => {
            // console.error(err);
            reject(err);
          });
      };

      getFeatures();
    });
  };

  const queryForFeaturesPost = (
    requestUrl,
    bodyFormData,
    rejectMessage,
    allowEmpty
  ) => {
    return new Promise((resolve, reject) => {
      let arrOfAllFeatures = [];

      const getFeatures = resultOffset => {
        if (resultOffset) {
          bodyFormData.append("resultOffset", resultOffset);
        } else {
          resultOffset = 0;
        }

        axios
          .post(requestUrl, bodyFormData)
          .then(function(response) {
            if (
              response.data &&
              response.data.features &&
              response.data.features.length
            ) {
              arrOfAllFeatures = [
                ...arrOfAllFeatures,
                ...response.data.features
              ];

              if (response.data.exceededTransferLimit) {
                getFeatures(response.data.features.length + resultOffset);
              } else {
                resolve(arrOfAllFeatures);
              }
            } else {
              if (rejectMessage) {
                if (allowEmpty && response.data && response.data.features) {
                  resolve([]);
                } else {
                  reject(rejectMessage);
                }
              } else {
                resolve([]);
              }
            }
          })
          .catch(err => {
            // console.error(err);
            reject(err);
          });
      };

      getFeatures();
    });
  };

  return {
    querySpeciesLookupTable,
    queryAllFeaturesFromSpeciesLookupTable,
    queryEcoShapeBySpecies,
    fetchFeedback,
    deleteFromFeedbackTable,
    applyEditToFeatureTable,
    querySpeciesByUser,
    getDistinctSpeciesCodeFromModelingExtent,
    //getDataLoadDate
  };
}
