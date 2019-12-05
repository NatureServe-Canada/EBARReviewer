"use strict";

import config from "../config";
import * as esriLoader from "esri-loader";
import hatchRed from "../static/Hatch_RedAlt.png";
import hatchBlack from "../static/Hatch_BlackAlt.png";

const Promise = require("es6-promise").Promise;

const esriLoaderOptions = {
  url: "https://js.arcgis.com/4.10"
};

const MapControl = function({
  webMapID = "",
  mapViewContainerID = "",
  onScaleChange = null
} = {}) {
  // const webMapID = options.webMapID || null;
  // const mapViewContainerID = options.mapViewContainerID || null;

  let mapView = null;
  let ecoShpLayer = null;
  let ecoShpByStatusGraphicLayer = null;
  let ecoPreviewGraphicLayer = null;
  // let actualModelBoundaryLayer = null;
  let ecoFeatureOnSelectHandler = null;
  // let isOnHoldEventDisabled = false;

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
        esriConfig.portalUrl = "https://gis.natureserve.ca/arcgis";
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
        const layerlist = new LayerList({
          container: config.DOM_ID.layerListDiv,
          view: mapView
        });
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
          "esri/layers/FeatureLayer"
        ],
        esriLoaderOptions
      )
      .then(([MapImageLayer, ImageryLayer, FeatureLayer]) => {
        const defaultOpacity = 0.7;

        // USA Protected Areas
        const usaProtectedAreas = new ImageryLayer({
          portalItem: {
            // autocasts as esri/portal/PortalItem
            id: config.reference_layers.usa_protected_areas.itemId
          },
          title: config.reference_layers.usa_protected_areas.title,
          opacity: defaultOpacity,
          visible: false
        });

        // USA_NLCD_Land_Cover_2011
        const nlcdLandCover = new ImageryLayer({
          portalItem: {
            // autocasts as esri/portal/PortalItem
            id: config.reference_layers.USA_NLCD_Land_Cover_2011.itemId
          },
          title: config.reference_layers.USA_NLCD_Land_Cover_2011.title,
          opacity: defaultOpacity,
          visible: false
        });

        // USA_Forest_Type
        const forestType = new ImageryLayer({
          portalItem: {
            // autocasts as esri/portal/PortalItem
            id: config.reference_layers.USA_Forest_Type.itemId
          },
          title: config.reference_layers.USA_Forest_Type.title,
          opacity: defaultOpacity,
          visible: false
        });

        // USA_Wetlands
        const wetLand = new MapImageLayer({
          portalItem: {
            // autocasts as esri/portal/PortalItem
            id: config.reference_layers.USA_Wetlands.itemId
          },
          title: config.reference_layers.USA_Wetlands.title,
          opacity: defaultOpacity,
          visible: false
        });

        // HUC6
/*         const huc6 = new FeatureLayer({
          portalItem: {
            // autocasts as esri/portal/PortalItem
            id: config.reference_layers.HUC6.itemId
          },
          title: config.reference_layers.HUC6.title,
          opacity: 0.9,
          visible: false,
          renderer: {
            type: "simple", // autocasts as new SimpleRenderer()
            symbol: {
              type: "simple-fill", // autocasts as new SimpleFillSymbol()
              color: [0, 0, 0, 0],
              outline: {
                // autocasts as new SimpleLineSymbol()
                color: [0, 255, 0, 1],
                width: "2"
              }
            }
          }
        }); */

/*         const rivers = new FeatureLayer({
          portalItem: {
            // autocasts as esri/portal/PortalItem
            id: config.reference_layers.RIVERS.itemId
          },
          title: config.reference_layers.RIVERS.title,
          visible: false
        }); */

        // mapView.map.addMany([usaProtectedAreas, nlcdLandCover, forestType, wetLand]);
        mapView.map.add(usaProtectedAreas, 0);
        mapView.map.add(nlcdLandCover, 0);
        mapView.map.add(forestType, 0);
        mapView.map.add(wetLand, 0);
        //mapView.map.add(huc6, 0);
        //mapView.map.add(rivers, 0);
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
          minScale:
            config.layerParameters.ecoShapes.minScale,
          maxScale:
            config.layerParameters.ecoShapes.maxScale
        });

        mapView.map.add(ecoShpLayer);
        
        initEcoShpReviewReferenceLayers(mapView);
        // ecoShpLayer.on("layerview-create", function(evt) {

        // });
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

        mapView.map.addMany([ecoShpByStatusGraphicLayer, ecoPreviewGraphicLayer]);
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

        const bgExpand = new Expand({
          view,
          content: basemapGallery,
          expandTooltip: "Change Basemap"
        });

        mapView.ui.add(bgExpand, "top-left");

        initLegend(mapView);
      });
  };

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

    // NS: Not loading reference layers as they arent relevant to this project
    //initReferenceLayers(mapView);

    initEcoLayer(mapView);

    initEcoShpReviewReferenceLayers(mapView);

    //initPredictedHabitatLayers(mapView);

    initSearch(mapView);

    initLayerList(mapView);
  };

  const queryEcoLayerByMouseEvent = event => {
    if (!ecoShpLayer) return;
    const query = ecoShpLayer.createQuery();
    query.geometry = mapView.toMap(event); // the point location of the pointer
    query.spatialRelationship = "intersects"; // this is the default
    query.returnGeometry = true;
    query.outFields = ["*"];

    return new Promise((resolve, reject) => {
      ecoShpLayer.queryFeatures(query).then(function(response) {
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
    query.returnGeometry = true;
    query.outFields = ["*"];

    return new Promise((resolve, reject) => {
      ecoShpLayer
        .queryFeatures(query)
        .then(function(response) {
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
    mapView.goTo(ecoFeats);
    console.log("done goto: zoomtoecoshps")
  };

  const queryEcoLayerByMouseEventOnSuccessHandler = feature => {
    
    addPreviewEcoGraphic(feature);

    if (ecoFeatureOnSelectHandler) {
      ecoFeatureOnSelectHandler(feature);
    }
  };
  
  const showEcoFeatureByStatus = (
    ecoId,
    status,
    options = {
      attributes: null,
      popupTemplate: null
    }
  ) => {
    removeEcoGraphicByStatus(ecoId);

    if (+status > 0) {
      queryEcoShpsLayerByEcoID(ecoId).then(features => {
        addEcoGraphicByStatus(features[0], status, options);
      });
    }

    // queryEcoShpsLayerByEcoID(ecoId).then(feature=>{
    //     addEcoGraphicByStatus(feature, status);
    // });
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
        type: "picture-fill", // autocasts as new PictureFillSymbol()
        url: hatchBlack, //"https://static.arcgis.com/images/Symbols/Shapes/BlackStarLargeB.png",
        width: "24px",
        height: "24px",
        outline: {
          color: config.COLOR.ecoBorderIsModeled,
          width: "2px"
        }
      },
      2: {
        type: "picture-fill", // autocasts as new PictureFillSymbol()
        url: hatchRed, //"https://static.arcgis.com/images/Symbols/Shapes/BlackStarLargeB.png",
        width: "24px",
        height: "24px",
        outline: {
          color: config.COLOR.ecoBorderIsModeled,
          width: "2px"
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

        ecoShpByStatusGraphicLayer.add(graphic);
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
  
  const cleanPreviewEcoGraphic = () => {
    if (ecoPreviewGraphicLayer) ecoPreviewGraphicLayer.removeAll();
  };

  // highlight ecos from the species extent table
  const highlightEcos = ecoIds => {
    // cleanPreviewEcoGraphic();
    clearAllGraphics();
    console.log("highlightEcosecoIds: ", ecoIds)
    ecoShpLayer.renderer = getUniqueValueRenderer(ecoIds);
  };

  const getUniqueValueRenderer = ecoIds => {
    const defaultSymbol = {
      type: "simple-fill", // autocasts as new SimpleFillSymbol()
      color: [0, 0, 0, 0],
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
        value: ecoId,
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

  const initPredictedHabitatLayers = mapView => {
    // console.log(url);
    // if(actualModelBoundaryLayer){
    //     mapView.map.remove(actualModelBoundaryLayer);
    // }
    //esriLoader
    //  .loadModules(["esri/layers/FeatureLayer"], esriLoaderOptions)
    //  .then(([FeatureLayer]) => {
    //    const predictedHabitatLayers = [
    //      config.URL.PredictedHabitat.line,
    //      config.URL.PredictedHabitat.polygon,
    //      config.URL.PredictedHabitat.line2,
    //      config.URL.PredictedHabitat.polygon2
    //    ].map(url => {
    //      return new FeatureLayer({
    //        url,
    //        opacity: 0.9,
    //        listMode: "hide",
    //        definitionExpression: `cutecode=''`,
    //        isPredictedHabitatLayer: true,
    //        legendEnabled: false
    //      });
    //    });
    //    mapView.map.addMany(predictedHabitatLayers);
    //});
    // mapView.map.reorder(actualModelBoundaryLayer, 0);
  };

  const showPredictedHabitatLayers = (speciesCode = "") => {
    // mapView.map.layers.forEach(layer => {
    //   // console.log(layer);
    //   if (layer.isPredictedHabitatLayer) {
    //     // console.log(la)
    //     layer.definitionExpression = `cutecode='${speciesCode}'`;
    //   }
    //   layer.refresh();
    // });
    // zoomToPredictedHabitatLayer();
  };

  const zoomToPredictedHabitatLayer = (speciesCode = "") => {
    // mapView.map.layers.forEach(layer => {
    //   // console.log(layer);
    //   if (layer.isPredictedHabitatLayer) {
    //     // console.log(la)
    //     layer.queryExtent().then(function(results) {
    //       // go to the extent of the results satisfying the query
    //       // view.goTo(results.extent);
    //       if (results.extent) {
    //         mapView.goTo(results.extent);
    //       }
    //     });
    //   }
    // });
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
      })
      .catch(err => {
        console.error(err);
      });
  };

  return {
    init,
    highlightEcos,
    cleanPreviewEcoGraphic,
    showEcoFeatureByStatus,
    // addActualModelBoundaryLayer,
    clearAllGraphics,
    // disableMapOnHoldEvent,
    queryEcoShpsLayerByEcoID,
    queryEcoShpsLayerByEcoIDs,
    zoomToEcoShps,
    addPreviewEcoGraphic,
    setLayersOpacity,
    clearMapGraphics,
    addPreviewEcoByID,
    showPredictedHabitatLayers,
    addCsvLayer
  };
};

export default MapControl;
