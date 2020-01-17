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
  // let actualModelBoundaryLayer = null;
  let ecoFeatureOnSelectHandler = null;
  // let isOnHoldEventDisabled = false;

  let ecoPresenceGraphicLayer = null;

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
    console.log("done init: map view")
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
          container: mapViewContainerID
        });

        mapView.when(mapViewOnReadyHandler);

      });
  };

  const initLayerList = mapView => {
    esriLoader
      .loadModules(["esri/widgets/LayerList"], esriLoaderOptions)
      .then(([LayerList]) => {
        mapView.a
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
      .loadModules(
        [
          "esri/Basemap"
        ],
        esriLoaderOptions
      )
      .then(([Basemap]) => {

        console.log(mapView.map);

        let basemapid = getCookie("basemap");//"d0135822507947b2a3809af36f2d91e6";
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
    // Layer.fromPortalItem({
    //     portalItem: {  // autocasts new PortalItem()
    //         id: "dd6077b7b71c4492aceab1ae0146ad1c"
    //     }
    // }).then(function(layer){
    //     // add the layer to the map
    //     mapView.map.add(layer);
    // });

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
      .then(([MapImageLayer, ImageryLayer, FeatureLayer, VectorTileLayer, Basemap]) => {
        const defaultOpacity = 0.7;

        const vt = new VectorTileLayer({
          portalItem: {
            // autocasts as esri/portal/PortalItem
            id: config.reference_layers.vt.itemId
          },
          title: config.reference_layers.vt.title,
          opacity: defaultOpacity,
          visible: true
        });

        const nawater = new FeatureLayer({
          portalItem: {
            // autocasts as esri/portal/PortalItem
            id: config.reference_layers.nawater.itemId
          },
          title: config.reference_layers.nawater.title,
          opacity: defaultOpacity,
          visible: false
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

        // HUC6
        // const huc6 = new FeatureLayer({
        //     portalItem: {
        //       // autocasts as esri/portal/PortalItem
        //       id: config.reference_layers.HUC6.itemId
        //     },
        //     title: config.reference_layers.HUC6.title,
        //     opacity: 0.9,
        //     visible: false,
        //     renderer: {
        //       type: "simple", // autocasts as new SimpleRenderer()
        //       symbol: {
        //         type: "simple-fill", // autocasts as new SimpleFillSymbol()
        //         color: [0, 0, 0, 0],
        //         outline: {
        //           // autocasts as new SimpleLineSymbol()
        //           color: [0, 255, 0, 1],
        //           width: "2"
        //         }
        //       }
        //     }
        //   }); 

        //  const rivers = new FeatureLayer({
        //   portalItem: {
        //     // autocasts as esri/portal/PortalItem
        //     id: config.reference_layers.RIVERS.itemId
        //   },
        //   title: config.reference_layers.RIVERS.title,
        //   visible: false
        // }); 

        // KH -- Need to do a test where if a layer isn't avaialble, will it blow up the app here
        // also to test if that fails, does it fail using addMany
        // ...really should probably be using addMany anyways....

        // mapView.map.addMany([usaProtectedAreas, nlcdLandCover, forestType, wetLand]);
        mapView.map.add(vt, 0);
        mapView.map.add(nawater, 0);
        mapView.map.add(protectedAreas, 0);
        mapView.map.add(wetlands, 0);
        mapView.map.add(landcover, 0);
      })
      .catch(err => {
        console.error(err);
      });
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

        initEcoShpReviewReferenceLayers(mapView);

      });
  };


  const initEcoShpReviewReferenceLayers = mapView => {
    esriLoader
      .loadModules(["esri/layers/GraphicsLayer"], esriLoaderOptions)
      .then(([GraphicsLayer]) => {
        ecoShpByStatusGraphicLayer = new GraphicsLayer({
          opacity: 0.6,
          listMode: "hide"
        });

        ecoPreviewGraphicLayer = new GraphicsLayer({
          listMode: "hide"
        });

        ecoPresenceGraphicLayer = new GraphicsLayer({
          listMode: "hide"
        });

        mapView.map.addMany([ecoShpByStatusGraphicLayer, ecoPreviewGraphicLayer, ecoPresenceGraphicLayer]);

      });
  };

  const initMapEventHandlers = () => {
    mapView.on("click", event => {
      // console.log('map view on hold', event);

      // if(!isOnHoldEventDisabled){
      //     queryEcoLayerByMouseEvent(event);
      // }

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
          // alert("Here!");'
          var portalItem = newValue["portalItem"];
          var basemapid = portalItem.id;

          document.cookie = "basemap=" + basemapid;// newValue["title"];
          console.log("New value: ", newValue,      // The new value of the property
            "<br>Old value: ", oldValue,  // The previous value of the changed property
            "<br>Watched property: ", property,  // In this example this value will always be "basemap.title"
            "<br>Watched object: ", object);     // In this example this value will always be the map object
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

    initBasemapGallery(mapView);

    initReferenceLayers(mapView);

    initEcoLayer(mapView);

    initEcoShpReviewReferenceLayers(mapView);

    initSearch(mapView);

    initLayerList(mapView);
    initBaseMapLayer();
  };

  const queryEcoLayerByMouseEvent = event => {
    if (!ecoShpLayer) return;
    const query = ecoShpLayer.createQuery();
    query.geometry = mapView.toMap(event); // the point location of the pointer
    query.spatialRelationship = "intersects"; // this is the default
    query.returnGeometry = true;
    query.outFields = ["*"];

    return new Promise((resolve, reject) => {
      ecoShpLayer.queryFeatures(query).then(function (response) {
        // console.log(response);

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
            // console.log(response.features[0]);
            resolve(response.features);
          } else {
            reject("no eco feature is found");
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  };

  const generateEcpShpWhereFromEcoIDs = ecoIds => {
    let whereText = "";
    let tempEcoIds = ecoIds.slice(0);
    let currEcoIds = [];
    let maxHit = false;
    while (tempEcoIds.length > 200) {
      currEcoIds = tempEcoIds.shift(0, 199);
      whereText =
        whereText +
        `${maxHit ? " OR " : ""}${
        config.FIELD_NAME.ecoShapeLayerID
        } in ('${currEcoIds.join("','")}')`;
      maxHit = true;
    }
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
    fullExtent();
  };

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

  const showEcoFeatureByStatus = (
    ecoId,
    status,
    options = {
      attributes: null,
      popupTemplate: null
    }
  ) => {

    removeEcoGraphicByStatus(ecoId);
    console.log("in showEcoFeatureByStatus")
    fullExtentArray = [];
    if (+status > 0) {
      queryEcoShpsLayerByEcoID(ecoId).then(features => {
        console.log(features);
        fullExtentArray.push(features[0]);
        addEcoGraphicByStatus(features[0], status, options);
      });
    }
  };

  const showEcoFeatureByPresence = (ecoId, presence) => {
    queryEcoShpsLayerByEcoID(ecoId).then(features => {
      fullExtentArray.push(features[0]);
      drawEcoShapeByPresence(features[0], presence);
    });
    // fullExtent();
    // setTimeout(() => { fullExtent();}, 2000);


  };

  const fullExtent = () => {
    var fullExtent = null;
    var features = fullExtentArray;
    for (var i = 0; i < features.length; i++) {
      if (!fullExtent)
        fullExtent = features[i].geometry.extent.clone();
      else
        fullExtent.union(features[i].geometry.extent)
    }
    mapView.goTo(fullExtent).then(function () {
      if (!mapView.extent.contains(fullExtent))
        mapView.zoom -= 1;
    });
  }


  const drawEcoShapeByPresence = (feature, presence) => {
    const geometry = feature.geometry;
    const symbol = presenceSymbols[presence];

    esriLoader
      .loadModules(["esri/Graphic"], esriLoaderOptions)
      .then(([Graphic]) => {
        const graphic = new Graphic({
          geometry,
          symbol,
          //attributes
          // popupTemplate
        });
        //console.log("about to drawEcoShapeByPresence add graphic", graphic)
        ecoPresenceGraphicLayer.add(graphic);
      })
      .catch(err => {
        console.error(err);
      });

  };

  const addEcoGraphicByStatus = (feature, status, options = {}) => {
    const geometry = feature.geometry;
    const attributes = options.attributes
      ? { ...feature.attributes, ...options.attributes }
      : feature.attributes;
    // const popupTemplate = options.popupTemplate || null;

    console.log('calling addEcoGraphicByStatus', feature, status);

    const symbols = {
      1: {
        //type: "picture-fill", // autocasts as new PictureFillSymbol()
        //url: hatchBlack, //"https://static.arcgis.com/images/Symbols/Shapes/BlackStarLargeB.png",
        //width: "24px",
        //height: "24px",
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: "red",
        style: "forward-diagonal",
        outline: {
          color: config.COLOR.ecoBorderIsModeled,
          width: "3px"
        }
      },
      2: {
        //type: "picture-fill", // autocasts as new PictureFillSymbol()
        //url: hatchRed, //"https://static.arcgis.com/images/Symbols/Shapes/BlackStarLargeB.png",
        //width: "24px",
        //height: "24px",
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: "red",
        style: "backward-diagonal",
        outline: {
          color: config.COLOR.ecoBorderIsModeled,
          width: "3px"
        }
      },
      3: {
        type: "simple-fill", // autocasts as new SimpleFillSymbol()
        color: [0, 0, 0, 0],
        outline: {
          // autocasts as new SimpleLineSymbol()
          color: config.COLOR.ecoBorderCommentWithoutAction,
          width: "4px"
        }
      }
    };

    const symbol = symbols[+status];

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
    // const attributes = feature.attributes;

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
      });
  };

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
        document.getElementById('graphicsLayersDiv').style.display = "block";
      })
      .catch(err => {
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
    initBaseMapLayer
  };
};

export default MapControl;
