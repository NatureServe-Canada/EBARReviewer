"use strict";

module.exports = {
  oauthAppID: "JAdAlm4QJ8Ot9j6r",
  webMapID: "da46b909ed89444396e0a5068fa1214f",
  portalURL: "https://gis.natureserve.ca/portal",//arcgis",

  adminUser: "gisadmin11",

  FIELD_NAME: {
    ecoShapeLayerID: "ecoshapeid",
    statusType: "artext", //"StatusType",
    hucLayerHucName: "HUC8",  //referenced from CONTROLLER: openFeedbackManager

    speciesLookup: {
      rangeValForLookup: "rangemapid", //"speciesid", this has been back and forth from speciesID. but appears its rangemap needed as the dropdown species val to hook up properly with speciesDist table
      speciesCode: "speciesid", //THIS WAS RANGEMAPID, BUT CHANGED TO MAKE THE INITIAL SPECIES DROP DOWN WORK PER USER LOGGED IN
      rangemapID: "rangemapid",
      speciesName: "national_scientific_name", //"Scientific_Name",
      taxa: "tax_group", // "Taxonomic_Group",
      boundaryLayerLink: "BoundaryLayerLink",
      pdfLink: "PdfLink"
    },
    speciesDistribution: {
      rangeValForLookup: "rangemapid",  //this was added as the new matching item to speciesLookup
      speciesCode: "ecoshapeid", //"rangemapid", // "SpeciesCode",
      ecoShapeID: "ecoshapeid" // "HUCID"
    },
    rangeMap: {
      speciesID: "speciesid"
    },
    feedbackTable: {
      ecoShapeID: "ecoshapeid",// "HUCID",
      userID: "reviewid", //"UserID",
      species: "reviewid", //"Species",
      comment: "ecoshapereviewnotes", //"Comment_Long",
      status: "addremove", //"StatusType",
      retirementDate: "retirementdate", // "RetirementDate",
      datestarted: "dataloaddate",// "DataLoadDate",
      username: "username",
      markup: "markup",
      additionalFields: [
        {
          field: "reference",
          display: "Reference",
          editable: "textarea",
          length: 255,
          required: false,
          visible: true
        },
        {// this has been skipped in src\components\FeedbackControlPanel\index.js, but is used
          // when status=2 through getHtmlForActions()
          field: "removalreason",
          display: "removalreason",
          editable: "textarea",
          length: 1,
          required: false,
          visible: true
        },
        {
          field: "migrantstatus",
          display: "Migrant Status",
          editable: [
            { code: "SC", desc: "SC - Seasonal resident and confirmed breeder" },
            { code: "SP", desc: "SP - Seasonal resident and probable breeder" },
            { code: "S?", desc: "S? - Seasonal resident and possible breeder" },
            { code: "SH", desc: "SH - Seasonal resident and current nonbreeder, historical breeder" },
            { code: "SN", desc: "SN - Seasonal resident and nonbreeder" },
            { code: "YC", desc: "YC - Year-round resident and confirmed breeder" },
            { code: "YP", desc: "YP - Year-round resident and probable breeder" },
            { code: "Y?", desc: "Y? - Year-round resident and possible breeder" },
            { code: "YH", desc: "YH - Year-round resident and current nonbreeder, historical breeder" },
            { code: "YN", desc: "YN - Year-round resident and nonbreeder" },
            { code: "T", desc: "T - Transient" }
          ],
          required: false,
          visible: false
        }
      ]
    },
    overallFeedback: {
      userID: "username",// "UserID",
      species: "rangemapid", //"Species",
      comment: "reviewnotes", //"Comment_Long",
      rating: "overallstarrating", //"Rating",
      // retirementDate: "datecompleted", // "RetirementDate",
      datecompleted: "datecompleted", // "DateCompleted ",
      datestarted: "datestarted"// "DataLoadDate"
    },
    speciesByUser: {
      speciesCode: "speciesid",
      email: "username", //"Reviewer_email"  NOT USING EMAIL, USING "expertid" now
      includeinebarreviewer: "includeinebarreviewer"
    },
    pdfLookup: {
      speciesCode: "cutecode",
      url: "url"
    },
    datestarted: {
      species_code: "cutecode",
      datestarted: "dataloaddate"// "DataLoadDate"
    }
  },

  STATUS: [
    // { "attributes": { "artext": "Ecoshapes", "arcode": 0 } },
    // { "attributes": { "artext": "Add to Range", "arcode": 1 } },
    // { "attributes": { "artext": "Comment", "arcode": 2 } },
    // { "attributes": { "artext": "Remove from Range", "arcode": 3 } },
    // { "attributes": { "artext": "Present", "arcode": 4 } },
    // { "attributes": { "artext": "Presence Expected", "arcode": 5 } },
    // { "attributes": { "artext": "Historical", "arcode": 6 } }
    { "attributes": { "artext": "Ecoshapes", "arcode": 0 } },
    { "attributes": { "artext": "Add/Change", "arcode": 1 } },
    { "attributes": { "artext": "Remove", "arcode": 2 } },
    { "attributes": { "artext": "Present", "arcode": 3 } },
    { "attributes": { "artext": "Presence Expected", "arcode": 4 } },
    { "attributes": { "artext": "Historical", "arcode": 5 } }
  ],

  PRESENCE: [
    { "code": "P", "text": "Present" },
    { "code": "X", "text": "Presence Expected" },
    { "code": "H", "text": "Historical" }
  ],

  REMOVAL: [
    { "attributes": { "removalcode": "X", "removaltext": "Presumed Extirpated" } },
    { "attributes": { "removalcode": "N", "removaltext": "Never Was There" } },
    { "attributes": { "removalcode": "F", "removaltext": "Reported But False" } },
    { "attributes": { "removalcode": "T", "removaltext": "Transient/Vagrant" } },
    { "attributes": { "removalcode": "O", "removaltext": "Other" } }
  ],

  URL: {
    ecoShapes:
      "https://gis.natureserve.ca/arcgis/rest/services/ReviewerDev2/FeatureServer/0",
    speciesLookupTable:
      "https://gis.natureserve.ca/arcgis/rest/services/ReviewerDev2/FeatureServer/1",
    speciesDistribution:
      "https://gis.natureserve.ca/arcgis/rest/services/ReviewerDev2/FeatureServer/2",
    speciesByUser:
      "https://gis.natureserve.ca/arcgis/rest/services/ReviewerDev2/FeatureServer/1",
    statusTable:
      "https://gis.natureserve.ca/arcgis/rest/services/ReviewerDev2/FeatureServer/5", //queryDomains?layers=EcoshapeReview",
    feedbackTable:
      "https://gis.natureserve.ca/arcgis/rest/services/ReviewerDev2/FeatureServer/3",
    overallFeedback:
      "https://gis.natureserve.ca/arcgis/rest/services/ReviewerDev2/FeatureServer/4",

    //PredictedHabitat: {
    // "137976": "https://services.arcgis.com/jIL9msH9OI208GCb/arcgis/rest/services/Isotria_medeloides_Boundary/FeatureServer/0",
    // "941975": "https://services.arcgis.com/jIL9msH9OI208GCb/arcgis/rest/services/Lithobates_kauffeldi_Boundary/FeatureServer/0",
    // line:
    //   "https://gis.natureserve.ca/arcgis/rest/services/EBAR_KBA/FeatureServer/1",
    // polygon:
    //   "https://gis.natureserve.ca/arcgis/rest/services/EBAR_KBA/FeatureServer/2",
    // line2:
    //   "https://services.arcgis.com/EVsTT4nNRCwmHNyb/arcgis/rest/services/Predicted_Habitat_Line_Part_2/FeatureServer/0",
    // polygon2:
    //   "https://services.arcgis.com/EVsTT4nNRCwmHNyb/arcgis/rest/services/Predicted_Habitat_Polygon_Part_2/FeatureServer/0"
    //},
    // pdfLookup:
    //   "https://gis.natureserve.ca/arcgis/rest/services/Hosted/USA_Schema_WFL1/FeatureServer/6",
    // datestarted:
    //   "https://gis.natureserve.ca/arcgis/rest/services/Hosted/USA_Schema_WFL1/FeatureServer/9"
  },

  layerParameters: {
    ecoShapes: {
      minScale: 0,
      maxScale: 50000
    },
    datestarted: {
      defaultDate: "5/14/2019  7:00:00 AM"
    }
  },

  reference_layers: {
    vt: {
      itemId: "0fa1002f17b44c54b7c54b8256a50d46", //itemId: "e6f212bbd10b417c990928b46f78a64b",
      title: "Ecoshapes"
    },
    nawater: {
      itemId: "50a865f144e2437da3918b66e97f17e9", //itemId: "0598b4723e07429eac809dbb43fc7c32",
      title: "Major Lakes and Reservoirs of North America (CEC)"
    },
    protectedAreas: {
      itemId: "73ba6d7c112845c7bb1944238b7f8aa0",
      title: "World Database on Protected Areas (WDPA, UNEP)"
    },
    wetlands: {
      itemId: "10eac67a4ce941118f491fadeb46a01d",
      title: "Wetlands of North America (WWF-US, USGS)"
    },
    landcover: {
      itemId: "cda5c31158c84a38b72daba84f6a4266",
      title: "Land Cover of North America (CEC, USFS)"
    }
  },

  COLOR: {
    ecoBorder: [255, 255, 255, 0.3],
    ecoBorderIsModeled: [255, 0, 0, 1],//[255, 255, 255, 0.5],
    ecoBorderCommentWithoutAction: [255, 0, 0, 1],
    presenceOutline: [255, 255, 255, 0], //fully transparent line
    ecoFill: [217, 217, 217, 0.4],

    status0: [200, 200, 200, 0.5],
    status1: [166, 219, 160, 0.5],
    status2: [194, 165, 207, 0.5],
    actualModeledExtent: "#ffd400",
    present: [168, 0, 132, 0.55], //Cattleya Orchid 
    presenceexpected: [255, 115, 223, 0.55], //, Fuchsia Pink 
    historical: [255, 190, 232, 0.55], //Rhodolite Rose
  },

  fireflyStyle: {
    blue:
      "data:image/png;base64,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"
  },

  visibleRange: {
    predictedHabitat: {
      minScale: 1025000
    }
  },
  allowCommentOnNoDataSpecies: true,

  DOM_ID: {
    mainControl: "mainControlDiv",
    mapViewContainer: "viewDiv",
    loggedInUser: "loggedInDiv",
    speciesSelector: "selectorsDiv",
    speciesMetadata: "metadataDiv",
    feedbackControl: "feedbackControlDiv",
    overallFeedbackControl: "overallFeedbackDiv",
    legend: "legendDiv",
    listViewOverallFeedback: "listViewForOverallFeedbackDiv",
    listViewDeatiledFeedback: "listViewForDetailedFeedbackDiv",
    listViewForFeedbacksByHuc: "listViewForFeedbacksByEcoShpDiv",
    searchWidgetDiv: "searchWidgetDiv",
    layerListDiv: "layerListDiv"
  },
};
