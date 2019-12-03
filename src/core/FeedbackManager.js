import FeedbackDataModel from "./FeedbackDataModel";

export default function(options = {}) {
  const feedbackDataStore = {};
  const feedbackDataModel = new FeedbackDataModel();

  const eventHandlers = {
    onAdd: null,
    onClose: null,
    onSubmit: null,
    onRemove: null
  };

  const init = (options = {}) => {
    eventHandlers["onAdd"] = options.onOpenHandler || null;
    eventHandlers["onClose"] = options.onCloseHandler || null;
    eventHandlers["onSubmit"] = options.onSubmitHandler || null;
    eventHandlers["onRemove"] = options.onRemoveHandler || null;
  };

  const open = (data = {}) => {
    // if data is already in dataStore, use the item from data store instead because it has the status and comments info
    const savedData = getSavedItemFromDataStore(data);

    // Override the default from modeling extents table with saved either from this session or queried from previous edits for this user
    if (savedData) {
      data = Object.assign(data, savedData);
    }

    feedbackDataModel.init(data);

    if (eventHandlers["onAdd"]) {
      eventHandlers["onAdd"](feedbackDataModel.getFeedbackData());
    }

    // console.log(feedbackDataModel.getFeedbackData());
  };

  const close = () => {
    feedbackDataModel.reset();

    if (eventHandlers["onClose"]) {
      eventHandlers["onClose"]();
    }
  };

  const submit = () => {
    const feedbackData = feedbackDataModel.getFeedbackData();

    save(feedbackData);

    if (eventHandlers["onSubmit"]) {
      eventHandlers["onSubmit"](feedbackData);
    }
  };

  const save = feedbackData => {
    const hucID = feedbackData.hucID;
    const species = feedbackData.species;

    if (!feedbackDataStore[species]) {
      feedbackDataStore[species] = {};
    }

    feedbackDataStore[species][hucID] = JSON.parse(
      JSON.stringify(feedbackData)
    );

    // console.log(feedbackDataStore);
  };

  const remove = () => {
    const feedbackData = feedbackDataModel.getFeedbackData();

    removeFromDataStore(feedbackData.species, feedbackData.hucID);

    // console.log('remove feedback', feedbackData);

    if (eventHandlers["onRemove"]) {
      eventHandlers["onRemove"](feedbackData);
    }
  };

  const removeFromDataStore = (species, hucID) => {
    if (feedbackDataStore[species][hucID]) {
      delete feedbackDataStore[species][hucID];
    }
  };

  const getSavedItemFromDataStore = data => {
    const hucID = data.hucID;
    const species = data.species;
    const hucName = data.hucName;

    // console.log('get Saved Item From DataStore', species, hucID, feedbackDataStore[species]);
    const savedItem =
      typeof feedbackDataStore[species] !== "undefined" &&
      typeof feedbackDataStore[species][hucID] !== "undefined"
        ? feedbackDataStore[species][hucID]
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
    // console.log(data);

    data.forEach(d => {
      save(d);
    });

    // console.log(feedbackDataStore);
  };

  const getFeedbackDataBySpecies = species => {
    // console.log('getFeedbackDataBySpecies', species);
    return feedbackDataStore[species];
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
    getFeedbackDataBySpecies
  };
}
