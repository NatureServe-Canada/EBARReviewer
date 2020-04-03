"use strict";

import config from "../config";
import * as esriLoader from "esri-loader";
//import hatchRed from "../static/remove.png";
//import hatchBlack from "../static/add.png";

const Promise = require("es6-promise").Promise;

const esriLoaderOptions = {
  url: "https://js.arcgis.com/4.10"
};

const MapControl = function ({
  fullExtentArray = [],
  webMapID = "",
  mapViewContainerID = "",
  onScaleChange = null
} = {}) {

  let mapView = null;
  let ecoShpLayer = null;
  let ecoShpByStatusGraphicLayer = null;
  let ecoPreviewGraphicLayer = null;
  let ecoFeatureOnSelectHandler = null;
  let isMapMultiSelectionClick = false;

  let ecoPresenceGraphicLayer = null;
  let ecoMultiSelection = null;
  var pEcoByStatusCount = 0;
  var pEcoByStatusLoaded = false;
  var pEcoByPresenceCount = 0;
  var pEcoByPresenceLoaded = false;
  let multiSelectionList = [];
  let currentSelectedFeature = null;
  let rangeMapShapes = null;

  let largeDrawError = false;


  // need to attach a completely transparent outline to each presence symbol below, otherwise they draw as full black
  const outline = {
    color: config.COLOR.presenceOutline,
    width: "1px"
  }
  const presenceSymbols = {
    "P": {
      type: "simple-fill", // autocasts as new SimpleFillSymbol()
      color: config.COLOR.present,
      outline: outline
    },
    "X": {
      type: "simple-fill",
      color: config.COLOR.presenceexpected,
      outline: outline
    },
    "H": {
      type: "simple-fill",
      color: config.COLOR.historical,
      outline: outline
    }
  };

  const init = (options = {}) => {
    if (!webMapID || !mapViewContainerID) {
      console.error(
        "web map ID and map view container DOM ID is required to init map control"
      );
      return;
    }

    ecoFeatureOnSelectHandler = options.ecoFeatureOnSelectHandler || null;
    initMapView();
    //console.log("done init: map view")
  };

  const initMapView = () => {
    esriLoader
      .loadModules(["esri/views/MapView", "esri/WebMap", "esri/config"], esriLoaderOptions)
      .then(([MapView, WebMap, esriConfig]) => {
        esriConfig.portalUrl = config.portalURL; //"https://gis.natureserve.ca/arcgis";

        const webmap = new WebMap({
          portalItem: {
            id: webMapID
          }
        });

        mapView = new MapView({
          map: webmap,
          container: mapViewContainerID,
          popup: {
            dockEnabled: false,
            dockOptions: {
              buttonEnabled: false
            }
          },
          highlightOptions: {
            color: [255, 255, 0, 1],
            haloOpacity: 0.9,
            fillOpacity: 0.2
          }
        });

        mapView.when(mapViewOnReadyHandler);

      });
  };

  const initLayerList = mapView => {
    esriLoader
      .loadModules(["esri/widgets/LayerList"], esriLoaderOptions)
      .then(([LayerList]) => {
        const layerlist = new LayerList({
          container: config.DOM_ID.layerListDiv,
          view: mapView
        });
      })
      .catch(err => {
        console.error(err);
      });
  };


  const initBaseMapLayer = () => {
    esriLoader
      .loadModules(["esri/Basemap"], esriLoaderOptions)
      .then(([Basemap]) => {

        let basemapid = getCookie("basemap");
        if (basemapid) {
          var basemap = new Basemap({
            portalItem: {
              id: basemapid
            }
          });

          mapView.map.basemap = basemap;
        }
      })
      .catch(err => {
        console.error(err);
      });
  };


  const initReferenceLayers = mapView => {

    esriLoader
      .loadModules(
        [
          "esri/layers/MapImageLayer",
          "esri/layers/ImageryLayer",
          "esri/layers/FeatureLayer",
          "esri/layers/VectorTileLayer"
        ],
        esriLoaderOptions
      )
      .then(([MapImageLayer, ImageryLayer, FeatureLayer, VectorTileLayer]) => {
        const defaultOpacity = 0.7;

        const vt = new VectorTileLayer({
          portalItem: {
            // autocasts as esri/portal/PortalItem
            id: config.reference_layers.vt.itemId
          },
          title: config.reference_layers.vt.title,
          opacity: defaultOpacity,
          visible: true,
          popupEnabled: false
        });

        const nawater = new FeatureLayer({
          portalItem: {
            // autocasts as esri/portal/PortalItem
            id: config.reference_layers.nawater.itemId
          },
          title: config.reference_layers.nawater.title,
          opacity: defaultOpacity,
          visible: false,
          popupEnabled: false
        });

        const protectedAreas = new MapImageLayer({
          portalItem: {
            id: config.reference_layers.protectedAreas.itemId
          },
          title: config.reference_layers.protectedAreas.title,
          opacity: defaultOpacity,
          visible: false
        });

        const wetlands = new MapImageLayer({
          portalItem: {
            id: config.reference_layers.wetlands.itemId
          },
          title: config.reference_layers.wetlands.title,
          opacity: defaultOpacity,
          visible: false
        });

        const landcover = new MapImageLayer({
          portalItem: {
            id: config.reference_layers.landcover.itemId
          },
          title: config.reference_layers.landcover.title,
          opacity: defaultOpacity,
          visible: false
        });

        rangeMapShapes = new MapImageLayer({
          portalItem: {
            id: config.URL.polyInfoShapes
          },  
          sublayers: [{
            id: 0,
            title: "Range Map Input Shapes",
            definitionExpression: "rangemapid = -1",
            popupEnabled: true
          }],
          title: "Range Map Inputs",
          visible: false         
        });       

        // KH -- Need to do a test where if a layer isn't avaialble, will it blow up the app here
        // also to test if that fails, does it fail using addMany
        // ...really should probably be using addMany anyways....

        // mapView.map.addMany([usaProtectedAreas, nlcdLandCover, forestType, wetLand]);
        mapView.map.add(vt, 0);
        mapView.map.add(nawater, 0);
        mapView.map.add(protectedAreas, 0);
        mapView.map.add(wetlands, 0);
        mapView.map.add(landcover, 0);
        mapView.map.add(rangeMapShapes)
      })
      .catch(err => {
        console.error(err);
      });
  };

  const setRangeMapShpDefQuery = rmapID => {
    // Reseting the draw error here as I know species select/changes calls here
    largeDrawError = false;
    
    let rmapShp = rangeMapShapes.findSublayerById(0);
    rmapShp.definitionExpression = "rangemapid = " + rmapID;
    rmapShp.popupTemplate = {
      title: formatTitle, //"{datasetsourcename} - {maxdate}",
      outFields: ["*"],
      content: [{        
        type: "fields", // Autocasts as new FieldsContent()
        // Autocasts as new FieldInfo[]
        fieldInfos: [{
          fieldName: "nationalscientificname",
          label: "National Scientific Name"
        }, {
          fieldName: "synonymname",
          label: "Synonym Name"
        }, {
          fieldName: "datasetsourcename",
          label: "Data Source Name"
        }, {
          fieldName: "datasettype",
          label: "Dataset Type"
        }, {
          fieldName: "accuracy",
          label: "Accuracy",
          format: {
            digitSeparator: true,
            places: 0
          }
        }, {
          fieldName: "maxdate",
          label: "Max Date",
          format:{
            dateFormat: "short-date"
          }
        }, {
          fieldName: "coordinatesobscured",
          label: "Coordinates Obscured"
        }, {
          fieldName: "originalgeometrytype",
          label: "Original Geometry Type"
        }]
      }],
      expressionInfos: [{
        name: "coordinatesobscured",
        title: "Coordinates Obscured",
        expression: "$feature.coordinatesobscured" * 5
      }]
    }
  };

  function formatTitle(feature){
    let d =  new Date(feature.graphic.attributes.maxdate).toLocaleDateString();
    console.log(feature)
    return feature.graphic.attributes.datasetsourcename + " - " + d;
  };

  const initEcoLayer = mapView => {
    esriLoader
      .loadModules(["esri/layers/FeatureLayer"], esriLoaderOptions)
      .then(([FeatureLayer]) => {
        ecoShpLayer = new FeatureLayer({
          url: config.URL.ecoShapes,
          opacity: 0.9,
          listMode: "hide",
          legendEnabled: false,
          renderer: {
            type: "simple", // autocasts as new SimpleRenderer()
            symbol: {
              type: "simple-fill", // autocasts as new SimpleFillSymbol()
              color: [0, 0, 0, 0],
              outline: {
                // autocasts as new SimpleLineSymbol()
                color: [0, 0, 0, 1],
                width: "0"
              }
            }
          },
          // minScale:
          //   config.layerParameters.ecoShapes.minScale,
          // maxScale:
          //   config.layerParameters.ecoShapes.maxScale 
        });

        //NS: Don't actually draw this layer. We use VT for the general ecoshape position
        //  and we grab only shapes we need to draw based on species selection which are shown
        //  via a GraphicsLayer
        //mapView.map.add(ecoShpLayer);

        // initEcoShpReviewReferenceLayers(mapView); /HM: It gives duplication. MUST BE REMOVED!!!!!

      });
  };


  const initEcoShpReviewReferenceLayers = mapView => {
    esriLoader
      .loadModules(["esri/layers/GraphicsLayer"], esriLoaderOptions)
      .then(([GraphicsLayer]) => {
        ecoShpByStatusGraphicLayer = new GraphicsLayer({
          //opacity: 0.6,
          listMode: "hide"
        });

        ecoPreviewGraphicLayer = new GraphicsLayer({
          listMode: "hide"
        });

        ecoPresenceGraphicLayer = new GraphicsLayer({
          listMode: "hide"
        });

        ecoMultiSelection = new GraphicsLayer({
          listMode: "hide",
          title: "Selection"
        });

        mapView.map.addMany([ ecoPreviewGraphicLayer, ecoPresenceGraphicLayer, ecoShpByStatusGraphicLayer,ecoMultiSelection]);

      });
  };

  const initMapEventHandlers = () => {
    mapView.on("click", event => {
      const modal = document.getElementById("myModal");
      var ms = modal.getAttribute('multi_selection');

      if (!ms || ms == "false") {
        ecoMultiSelection.removeAll();
        ecoPreviewGraphicLayer.removeAll();
      }

      queryEcoLayerByMouseEvent(event)
        .then(queryEcoLayerByMouseEventOnSuccessHandler)
        .catch(err => {
          console.log(err);
        });
    });

    // // when the map view is stationary , call onZoomChange handler to get the legend updated based on the default zoom level
    mapView.watch("stationary", evt => {
      if (onScaleChange) {
        onScaleChange(mapView.scale);
      }
    });
  };

  const initMapEventHandlersRemove = () => {
    mapView.on("click", event => {
      // isMapMultiSelectionClick = true;
      ecoMultiSelection.remove(event.graphic);
    });
  }



  const initBasemapGallery = view => {
    esriLoader
      .loadModules(
        ["esri/widgets/BasemapGallery", "esri/widgets/Expand"],
        esriLoaderOptions
      )
      .then(([BasemapGallery, Expand]) => {
        const basemapGallery = new BasemapGallery({
          view
        });

        var handle = basemapGallery.watch('activeBasemap', function (newValue, oldValue, property, object) {
          var portalItem = newValue["portalItem"];
          var basemapid = portalItem.id;

          document.cookie = "basemap=" + basemapid;// newValue["title"];
         // console.log("New value: ", newValue,      // The new value of the property
         //   "<br>Old value: ", oldValue,  // The previous value of the changed property
         //   "<br>Watched property: ", property,  // In this example this value will always be "basemap.title"
         //   "<br>Watched object: ", object);     // In this example this value will always be the map object
        });

        const bgExpand = new Expand({
          view,
          content: basemapGallery,
          expandTooltip: "Change Basemap"
        });

        mapView.ui.add(bgExpand, "top-left");

        initLegend(mapView);
      });
  };

  function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }


  const initLegend = view => {
    esriLoader
      .loadModules(
        ["esri/widgets/Legend", "esri/widgets/Expand"],
        esriLoaderOptions
      )
      .then(([Legend, Expand]) => {
        const legend = new Legend({
          view
        });

        const legExpand = new Expand({
          view,
          content: legend,
          expandIconClass: "esri-icon-maps",
          expandTooltip: "View Legend for Additional Layers"
        });

        mapView.ui.add(legExpand, "top-left");
      });
  };

  const initSearch = view => {
    esriLoader
      .loadModules(["esri/widgets/Search"], esriLoaderOptions)
      .then(([Search]) => {
        const searchWidget = new Search({
          view,
          container: config.DOM_ID.searchWidgetDiv
        });

        // view.ui.add(searchWidget, {
        //     position: "top-left",
        //     index: 0
        // });
      })
      .catch(err => {
        console.log(err);
      });
  };

  const mapViewOnReadyHandler = () => {
    console.log('mapView is ready...');
    initMapEventHandlers();

    initSketch(mapView);

    initBasemapGallery(mapView);

    initReferenceLayers(mapView);

    initEcoLayer(mapView);

    initEcoShpReviewReferenceLayers(mapView);

    initSearch(mapView);

    initLayerList(mapView);

    initBaseMapLayer();
  };

  const initSketch = view => {
    esriLoader
      .loadModules(["esri/widgets/Sketch"], esriLoaderOptions)
      .then(([Sketch]) => {
        const sketchWidget = new Sketch({
          view,
          layer: ecoMultiSelection,
          id: "SketchWidget"
        });

        sketchWidget.on("create", function (event) {
          // check if the create event's state has changed to complete indicating
          //  the graphic create operation is completed.
          initMapEventHandlersRemove();
          if (event.state === "complete") {
            console.log(event.graphic);

            if (queryEcoLayerByMSMouseEvent)
              queryEcoLayerByMSMouseEvent(event.graphic.geometry);

            queryEcoLayerByMSMouseEvent(event)
              .then(queryEcoLayerByMSMouseEventOnSuccessHandler)
              .catch(err => {
                console.log(err);
              });


            // remove the graphic from the layer. Sketch adds
            // the completed graphic to the layer by default.
            ecoMultiSelection.remove(event.graphic);
            initMapEventHandlers();
            // use the graphic.geometry to query features that intersect it
            // selectFeatures(event.graphic.geometry);
          }
        });


        view.ui.add(sketchWidget, {
          position: "bottom-left",
          index: 0,
          id: "SketchWidget",
          visible: false
        });
      })
      .catch(err => {
        console.log(err);
      });
  };

  const queryEcoLayerByMSMouseEvent = event => {
    if (!ecoShpLayer) return;
    if (!(event && event.graphic && event.graphic.geometry)) return;
    const query = ecoShpLayer.createQuery();
    query.geometry = event.graphic.geometry; // the point location of the pointer
    query.spatialRelationship = "intersects"; // this is the default
    query.distance = 20;
    query.returnGeometry = true;
    query.outFields = ["*"];

    return new Promise((resolve, reject) => {
      ecoShpLayer.queryFeatures(query).then(function (response) {
        // console.log(response);

        if (response.features && response.features.length) {
          resolve(response.features);//[0]);
        }
      });
    });
  };

  const queryEcoLayerByMSMouseEventOnSuccessHandler = features => {
    for (var i = 0; i < features.length; i++) {
      console.log(features[i]);
      addPreviewEcoGraphicMS(features[i]);
    }
  };

  const addPreviewEcoGraphicMS = feature => {
    const symbol = {
      type: "simple-fill", // autocasts as new SimpleFillSymbol()
      color: [0, 0, 0, 0],
      outline: {
        // autocasts as new SimpleLineSymbol()
        color: [84, 242, 242, 0.75],
        width: "2.5px"
      }
    };

    esriLoader
      .loadModules(["esri/Graphic"], esriLoaderOptions)
      .then(([Graphic]) => {
        const graphicForSelectedEco = new Graphic({
          geometry: feature.geometry,
          symbol: symbol
        });

        // ecoPreviewGraphicLayer.add(graphicForSelectedEco);
        ecoMultiSelection.add(graphicForSelectedEco);
        //console.log('ecoMultiSelection.graphics.items.length', ecoMultiSelection.graphics.items.length);
      });

    addtoMSlist(feature);

  };

  const addtoMSlist = feature => {
    const modal = document.getElementById("myModal");
    var ms = modal.getAttribute('multi_selection');

    if (!ms || ms == "false") {
      multiSelectionList = [];
      multiSelectionList.push(feature);
    }
    else {
      let existObj = false;
      let ind = 0;
      for (var i = 0; i < multiSelectionList.length; ++i) {
        if (feature.attributes.ecoshapename === multiSelectionList[i].attributes.ecoshapename) {
          existObj = true;
          ind = i;
        }
      }

      if (!existObj) {
        multiSelectionList.push(feature);
      }
      showMS();
    }

  };

  const showMS = () => {
    try {
      let terrAreaTotal = parseFloat(0);
      var terrPropTotal = parseFloat(0);
      var hucNames = [];
      multiSelectionList.forEach(element => {
        if (element && element.attributes) {
          let EA = element.attributes;
          let terrArea = EA.terrestrialarea;//(EA.terrestrialarea / 1000000).toLocaleString('en-us', { 'maximumFractionDigits': 2 });
          let terrProp = EA.terrestrialproportion;// * 100;
          terrAreaTotal = terrAreaTotal + terrArea;
          terrPropTotal = terrPropTotal + terrProp;
          let hucName = element.attributes.ecoshapename || "";

          if (hucName != "") hucNames.push(hucName);
        }
      });

      var tat = (terrAreaTotal / 1000000).toLocaleString('en-us', { 'maximumFractionDigits': 2 });
      var tpt = (parseFloat(terrPropTotal) * 100).toFixed(1);
      document.getElementById("feedbackControlPanelMSIecoshapes").innerText = hucNames.join(', ');
      document.getElementById("feedbackControlPanelMSIarea").innerText = tat + " km²";
      document.getElementById("feedbackControlPanelMSIproportion").innerText = tpt.toString() + " %";
    } catch{ };
  };

  const queryEcoLayerByMouseEvent = event => {
    if (!ecoShpLayer) return;
    // if (isMapMultiSelectionClick === false) return;
    const query = ecoShpLayer.createQuery();
    query.geometry = mapView.toMap(event); // the point location of the pointer
    query.spatialRelationship = "intersects"; // this is the default
    query.distance = 20;
    query.returnGeometry = true;
    query.outFields = ["*"];

    return new Promise((resolve, reject) => {
      ecoShpLayer.queryFeatures(query).then(function (response) {
        if (response.features && response.features.length) {
          resolve(response.features[0]);
        }
      });
    });
  };

  const queryEcoShpsLayerByEcoID = ecoId => {
    return queryEcoShpsLayerByEcoIDs([ecoId]);
  };

  const queryEcoShpsLayerByEcoIDs = ecoIds => {
    const query = ecoShpLayer.createQuery();
    let where = `${config.FIELD_NAME.ecoShapeLayerID} = '${ecoIds[0]}'`;
    if (ecoIds.length > 1) where = generateEcpShpWhereFromEcoIDs(ecoIds);
    query.where = where;
    query.outSpatialReference = 102100;
    query.returnGeometry = true;
    query.outFields = ["*"];
    return new Promise((resolve, reject) => {
      ecoShpLayer
        .queryFeatures(query)
        .then(function (response) {
          if (response.features && response.features.length) {
            resolve(response.features);

          } else {
            reject("no eco feature is found");
          }
        })
        .catch(err => {
          if (!largeDrawError){
            largeDrawError = true;
            alert("Failed to draw species. Please select a new species and try again.");
          }
          const modal = document.getElementById("myModal");
          modal.style.display = "none";
          reject(err);
        });
    });
  };

  const generateEcpShpWhereFromEcoIDs = ecoIds => {
    let whereText = "";
    let tempEcoIds = ecoIds.slice(0);
    let maxHit = false;

    whereText =
      whereText +
      `${maxHit ? " OR " : ""}${
      config.FIELD_NAME.ecoShapeLayerID
      } in ('${tempEcoIds.join("','")}')`;
    return whereText;
  };

  const zoomToEcoShps = async ecoIds => {

    const ecoFeats = await queryEcoShpsLayerByEcoIDs(ecoIds);
    console.log("zoomToEcoShps ecofeats:", ecoFeats)
    // mapView.goTo(ecoFeats);
    console.log("done goto: zoomtoecoshps")
  };

  const getSelectedArray = () => {
    return ecoPreviewGraphicLayer;
  }

  const clearMSelection = () => {
    ecoMultiSelection.removeAll(); //all selected assets for multi-selection
    // ecoPreviewGraphicLayer.removeAll();//current selected asset
    multiSelectionList = [];
    const modal = document.getElementById("myModal");
    modal.setAttribute('multi_selection', false);
    addtoMSlist(currentSelectedFeature);
    showMS(); 
  }
  const clearEcoPreviewGraphicLayer = () => {
    ecoPreviewGraphicLayer.removeAll();//current selected asset
  }

  const queryEcoLayerByMouseEventOnSuccessHandler = feature => {
    addPreviewEcoGraphic(feature);

    if (ecoFeatureOnSelectHandler) {
      ecoFeatureOnSelectHandler(feature);
    }

  };

  function arrayRemove(arr, value) {
    return arr.filter(function (ele) {
      return ele != value;
    });
  }

  const setpEcoByStatusLoaded=() => {
    pEcoByStatusLoaded = true;
  }

  const showEcoFeatureByStatus = (
    ecoId,
    markup,
    len,
    options = {
      attributes: null,
      popupTemplate: null
    }
  ) => {

    removeEcoGraphicByStatus(ecoId);

    //console.log("in showEcoFeatureByStatus", markup)
    //if (+status > 0) {      
    if (config.MARKUPCODES.indexOf(markup) > 0) {  // (markup === 'P' || markup === 'R') {
      queryEcoShpsLayerByEcoID(ecoId).then(features => {
        //console.log('ByStatus', features);
        addEcoGraphicByStatus(features[0], markup, options);
        ++pEcoByStatusCount;
        console.log('pEcoByStatusCount', pEcoByStatusCount, len);
        if (len) {
          if (pEcoByStatusCount == len) {
            pEcoByStatusLoaded = true;
            if (pEcoByStatusLoaded && pEcoByPresenceLoaded) setTimeout(function(){fullExtent();},300); 

          }
        }
      });
    }
    else {
      ++pEcoByStatusCount;
      console.log('pEcoByStatusCount', pEcoByStatusCount, len);
      if (len) {
        if (pEcoByStatusCount == len) {
          pEcoByStatusLoaded = true;
          if (pEcoByStatusLoaded && pEcoByPresenceLoaded) 
          setTimeout(function(){fullExtent();},300); 
        }
      }
    }
  };

  const setpEcoByPresenceLoaded=() => {
    pEcoByPresenceLoaded = true;
  }
 
  const showEcoFeatureByPresence = (ecoId, presence, len) => {
    queryEcoShpsLayerByEcoID(ecoId).then(features => {
      // fullExtentArray.push(features[0]);
      drawEcoShapeByPresence(features[0], presence);
      //console.log('ByPresence', features);
      ++pEcoByPresenceCount;
      console.log('pEcoByPresenceCount', pEcoByPresenceCount, len);
      
      if (len) {
        if (pEcoByPresenceCount == len) {
          pEcoByPresenceLoaded = true;
          if (pEcoByStatusLoaded && pEcoByPresenceLoaded) setTimeout(function(){fullExtent();},300); 
        }
      }

    });
  }

  const fullExtent = () => {
    var fullExtent = null;
    for (var i = 0; i < ecoShpByStatusGraphicLayer.graphics.items.length; i++) {
      var features = ecoShpByStatusGraphicLayer.graphics.items[i];
      if (!fullExtent)
        fullExtent = features.geometry.extent.clone();
      else
        fullExtent.union(features.geometry.extent)
    }

    for (var i = 0; i < ecoPresenceGraphicLayer.graphics.items.length; i++) {
      var features = ecoPresenceGraphicLayer.graphics.items[i];
      if (!fullExtent)
        fullExtent = features.geometry.extent.clone();
      else
        fullExtent.union(features.geometry.extent)
    }

    mapView.goTo(fullExtent).then(function () {
      if (!mapView.extent.contains(fullExtent))
        mapView.zoom -= 1;
    });
    if (pEcoByStatusLoaded && pEcoByPresenceLoaded) {
      const modal = document.getElementById("myModal");
      modal.style.display = "none";
    }
  }

  const drawEcoShapeByPresence = (feature, presence) => {
    const geometry = feature.geometry;
    const symbol = presenceSymbols[presence];

    esriLoader
      .loadModules(["esri/Graphic"], esriLoaderOptions)
      .then(([Graphic]) => {
        const graphic = new Graphic({
          geometry,
          symbol
        });

        ecoPresenceGraphicLayer.add(graphic);
      })
      .catch(err => {
        console.error(err);
      });
  };

  const addEcoGraphicByStatus = (feature, markup, options = {}) => {
    const geometry = feature.geometry;
    const attributes = options.attributes
      ? { ...feature.attributes, ...options.attributes }
      : feature.attributes;
    // const popupTemplate = options.popupTemplate || null;

    //console.log('calling addEcoGraphicByStatus', feature, markup);
    const greenHatch = {
      type: "simple-fill",  // autocasts as new SimpleFillSymbol()
      color: [76,230,0,1],
      style: "forward-diagonal",
      outline: {
        color: [76,230,0,1],//config.COLOR.ecoBorderIsModeled,
        width: "3px"
      }
    }
    const redHatch = {      
      type: "simple-fill",  // autocasts as new SimpleFillSymbol()
      color: "red",
      style: "backward-diagonal",
      outline: {
        color: config.COLOR.ecoBorderIsModeled,
        width: "3px"
      }
    }

    const symbols = {
      'P': greenHatch,
      'X': greenHatch,
      'H': greenHatch,
      'R': redHatch
    };

    //const symbol = symbols[+status];
    const symbol = symbols[markup];

    esriLoader
      .loadModules(["esri/Graphic"], esriLoaderOptions)
      .then(([Graphic]) => {
        const graphic = new Graphic({
          geometry,
          symbol,
          attributes
          // popupTemplate
        });
        //console.log("about to ecoShpByStatusGraphicLayer add graphic", graphic)
        ecoShpByStatusGraphicLayer.add(graphic);
        document.getElementById('graphicsLayersDiv').style.display = "block";

      })
      .catch(err => {
        console.error(err);
      });
  };

  const removeEcoGraphicByStatus = ecoId => {
    // console.log('removeEcoGraphicByStatus', ecoId);
    ecoShpByStatusGraphicLayer.graphics.forEach(g => {
      if (
        g &&
        g.attributes &&
        g.attributes[config.FIELD_NAME.ecoShapeLayerID] === ecoId
      ) {
        ecoShpByStatusGraphicLayer.remove(g);
        //arrayRemove(fullExtentArray,g.features[0]);
      }
    });
  };

  const addPreviewEcoByID = async ecoId => {
    const ecoFeature = await queryEcoShpsLayerByEcoID(ecoId);
    addPreviewEcoGraphic(ecoFeature);
  };

  const addPreviewEcoGraphic = feature => {
    cleanPreviewEcoGraphic();

    const symbol = {
      type: "simple-fill", // autocasts as new SimpleFillSymbol()
      color: [0, 0, 0, 0],
      outline: {
        // autocasts as new SimpleLineSymbol()
        color: [84, 242, 242, 0.75],
        width: "2.5px"
      }
    };

    esriLoader
      .loadModules(["esri/Graphic"], esriLoaderOptions)
      .then(([Graphic]) => {
        const graphicForSelectedEco = new Graphic({
          geometry: feature.geometry,
          symbol: symbol
        });

        ecoPreviewGraphicLayer.add(graphicForSelectedEco);
        ecoMultiSelection.add(graphicForSelectedEco);

      });
    try {
      addtoMSlist(feature);
      currentSelectedFeature = feature;
    } catch (e) { }

  };

  const getMultiSelectionList = () => {
    return multiSelectionList;
  }

  const clearMapGraphics = (targetLayer = "") => {
    const layersLookup = {
      ecoPreview: ecoPreviewGraphicLayer
    };

    if (layersLookup[targetLayer]) {
      layersLookup[targetLayer].removeAll();
    } else {
      clearAllGraphics();
    }
  };

  const clearAllGraphics = () => {
    if (ecoShpByStatusGraphicLayer) ecoShpByStatusGraphicLayer.removeAll();
    cleanPreviewEcoGraphic();
  };

  const clearEcoPresenceGraphics = () => {
    if (ecoPresenceGraphicLayer) ecoPresenceGraphicLayer.removeAll()
  }

  const cleanPreviewEcoGraphic = () => {
    if (ecoPreviewGraphicLayer) ecoPreviewGraphicLayer.removeAll();
  };

  // This has been superseded by drawing ecos based on PRESENCE
  /*   
  const highlightEcos = ecoIds => {
    // cleanPreviewEcoGraphic();
    clearAllGraphics();
    console.log("highlightEcosecoIds: ", ecoIds)
    ecoShpLayer.renderer = getUniqueValueRenderer(ecoIds);
    console.log(ecoShpLayer)
  };
  */
  const getUniqueValueRenderer = ecoIds => {
    const defaultSymbol = {
      type: "simple-fill", // autocasts as new SimpleFillSymbol()
      color: [0, 100, 0, 0],
      outline: {
        // autocasts as new SimpleLineSymbol()
        color: config.COLOR.ecoBorder,
        width: "1px"
      }
    };

    const symbol = {
      type: "simple-fill", // autocasts as new SimpleFillSymbol()
      color: config.COLOR.ecoFill,
      outline: {
        // autocasts as new SimpleLineSymbol()
        color: config.COLOR.ecoBorderIsModeled,
        width: "2px"
      }
    };

    const uniqueValueInfos = ecoIds.map(ecoId => {
      return {
        value: parseInt(ecoId, 10),
        symbol: symbol
      };
    });

    const renderer = {
      type: "unique-value", // autocasts as new UniqueValueRenderer()
      field: config.FIELD_NAME.ecoShapeLayerID,
      defaultSymbol: defaultSymbol, //{ type: "none" },  // autocasts as new SimpleFillSymbol()
      uniqueValueInfos: uniqueValueInfos
    };
    console.log("RENDERER: ", renderer)
    return renderer;
  };


  const setLayersOpacity = val => {
    mapView.map.layers.forEach(layer => {
      // console.log(layer);
      layer.opacity = val;
    });
  };

  const addCsvLayer = (features = []) => {
    // Lock the UI as we draw pink graphics
    const modal = document.getElementById("myModal");
    modal.style.display = "block";

    const layerId = "csvLayer";

    let csvLayer = mapView.map.findLayerById(layerId);

    if (csvLayer) {
      mapView.map.remove(csvLayer);
    }

    esriLoader
      .loadModules(
        ["esri/layers/GraphicsLayer", "esri/Graphic"],
        esriLoaderOptions
      )
      .then(([GraphicsLayer, Graphic]) => {
        const fireflySymbl = {
          type: "picture-marker", // autocasts as new PictureMarkerSymbol()
          url: config.fireflyStyle.blue,
          width: "32px",
          height: "32px"
        };

        const graphics = features.map((feature, idx) => {
          feature.attributes.FID = idx;
          feature.symbol = fireflySymbl;
          return new Graphic(feature);
        });

        csvLayer = new GraphicsLayer({
          id: layerId,
          graphics,
          title: "CSV Layer",
          opacity: 0.85
        });

        mapView.map.add(csvLayer);

        mapView.whenLayerView(csvLayer).then(function (csvLayerView) {
          csvLayerView.watch("updating", function (val) {
            if (!val) {  // wait for the layer view to finish updating

              modal.style.display = "none";
            }
          })
        });

        document.getElementById('graphicsLayersDiv').style.display = "block";

      })
      .catch(err => {
        modal.style.display = "none";
        console.error(err);
      });
  };

  // Hide/Show all Graphics Layers [HM Jan.2020]
  const graphicsVisibility = event => {

    var option = event.target.id;
    var status = event.target.checked;

    switch (option) {
      case "GL0":
        if (ecoShpByStatusGraphicLayer)
          ecoShpByStatusGraphicLayer.visible = status;
        break;
      case "GL1":
        if (ecoPreviewGraphicLayer)
          ecoPreviewGraphicLayer.visible = status;
        break;
      case "GL2":
        if (ecoPresenceGraphicLayer)
          ecoPresenceGraphicLayer.visible = status;
        break;
    }
  };

  const fullExtentClear = () => {
    const modal = document.getElementById("myModal");
    modal.style.display = "block";
    pEcoByStatusCount = 0;
    pEcoByPresenceCount = 0;
  }

  return {
    init,
    //highlightEcos,
    cleanPreviewEcoGraphic,
    showEcoFeatureByStatus,
    showEcoFeatureByPresence,
    clearAllGraphics,
    clearEcoPresenceGraphics,
    queryEcoShpsLayerByEcoID,
    queryEcoShpsLayerByEcoIDs,
    zoomToEcoShps,
    addPreviewEcoGraphic,
    setLayersOpacity,
    clearMapGraphics,
    addPreviewEcoByID,
    addCsvLayer,
    graphicsVisibility,
    initBaseMapLayer,
    clearMSelection,
    getSelectedArray,
    fullExtent,
    fullExtentClear,
    showMS,
    clearEcoPreviewGraphicLayer,
    getMultiSelectionList,
    setpEcoByStatusLoaded,
    setpEcoByPresenceLoaded,
    setRangeMapShpDefQuery
  };
};

export default MapControl;
