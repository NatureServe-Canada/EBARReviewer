import FeedbackDataModel from "./FeedbackDataModel";

export default function (options = {}) {
  const feedbackDataStore = {};
  const feedbackDataModel = new FeedbackDataModel();

  const eventHandlers = {
    onAdd: null,
    onClose: null,
    onSubmit: null,
    onRemove: null,
    onSubmitMS: null,
    onRemoveMS: null
  };

  const init = (options = {}) => {
    eventHandlers["onAdd"] = options.onOpenHandler || null;
    eventHandlers["onClose"] = options.onCloseHandler || null;
    eventHandlers["onSubmit"] = options.onSubmitHandler || null;
    eventHandlers["onRemove"] = options.onRemoveHandler || null;
    eventHandlers["onSubmitMS"] = options.onSubmitMSHandler || null;
    eventHandlers["onRemoveMS"] = options.onRemoveMSHandler || null;
  };

  // const getTotalSelection = (data = []) => {
  //   console.log("getTotalSelection", data);
  // }

  const open = (data = {}) => {
    console.log("feedback open", data);
    // if data is already in dataStore, use the item from data store instead because it has the status and comments info
    const savedData = getSavedItemFromDataStore(data);

    // Override the default from modeling extents table with saved either from this session or queried from previous edits for this user
    if (savedData) {
      data = Object.assign(data, savedData);
    }
    console.log("about to pass data into feedback data model: ", data)
    feedbackDataModel.init(data);
 
    if (eventHandlers["onAdd"]) {
      eventHandlers["onAdd"](feedbackDataModel.getFeedbackData());
    }
  };

  const close = () => {
    feedbackDataModel.reset();

    if (eventHandlers["onClose"]) {
      eventHandlers["onClose"]();
    }
  };

  const submitMS = dataList => {
    dataList.forEach(element => {
      save(element);
    });

    if (eventHandlers["onSubmitMS"]) {
      eventHandlers["onSubmitMS"](dataList);
    }
  };

  const getfeedbackData = () => {
    return feedbackDataModel.getFeedbackData();
  }

  const submit = () => {

    const feedbackData = feedbackDataModel.getFeedbackData();

    save(feedbackData);
    if (eventHandlers["onSubmit"]) {
      eventHandlers["onSubmit"](feedbackData);
    }

  };

  const save = feedbackData => {
    const ecoId = feedbackData.ecoID;
    //console.log("save feedback: ", feedbackData.ecoID)
    //const species = feedbackData.species;
    const reviewid = feedbackData.reviewid;
    if (!feedbackDataStore[reviewid]) {
      feedbackDataStore[reviewid] = {};
    }

    feedbackDataStore[reviewid][ecoId] = JSON.parse(
      JSON.stringify(feedbackData)
    );
  };

  const remove = () => {
    const feedbackData = feedbackDataModel.getFeedbackData();

    removeFromDataStore(feedbackData.reviewid, feedbackData.ecoID);

    // console.log('remove feedback', feedbackData);

    if (eventHandlers["onRemove"]) {
      eventHandlers["onRemove"](feedbackData);
    }
  };

  const removeMS = dataList => {
    dataList.forEach(element => {
      removeFromDataStore(element.reviewid, element.ecoID);
    });
    if (eventHandlers["onRemoveMS"]) {
      eventHandlers["onRemoveMS"](dataList);
    }
  };

  const removeFromDataStore = (reviewId, ecoId) => {
    if (feedbackDataStore[reviewId][ecoId]) {
      delete feedbackDataStore[reviewId][ecoId];
    }
  };

  const getSavedItemFromDataStore = data => {
    const ecoId = data.ecoID;
    const reviewId = data.reviewid;
    const species = data.species;
    const hucName = data.hucName;

    // console.log('get Saved Item From DataStore', species, ecoId, feedbackDataStore[species]);
    const savedItem =
      typeof feedbackDataStore[reviewId] !== "undefined" &&
        typeof feedbackDataStore[reviewId][ecoId] !== "undefined"
        ? feedbackDataStore[reviewId][ecoId]
        : null;

    if (savedItem && typeof savedItem.hucName === "undefined" && hucName) {
      savedItem.hucName = hucName;
    }

    if (savedItem) {
      savedItem.isSaved = true;
      savedItem.isHucInModeledRange = data.isHucInModeledRange;
    }

    return savedItem;
  };

  const batchAddToDataStore = data => {
    console.log("in batchAddToDataStore (feedbackmanager) and this is data: ", data);
    if (data){
      data.forEach(d => {
        save(d);
      });
    }
  };

  const getFeedbackDataBySpecies = reviewId => {
    // console.log('getFeedbackDataBySpecies', species);
    return feedbackDataStore[reviewId];
  };

  return {
    init,
    open,
    close,
    save,
    submit,
    remove,
    feedbackDataModel,
    batchAddToDataStore,
    getFeedbackDataBySpecies,
    submitMS,
    getfeedbackData,
    removeMS,
    getSavedItemFromDataStore
  };
}
