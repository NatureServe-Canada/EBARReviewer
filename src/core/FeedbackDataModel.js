export default class FeedbackManager {
  constructor(options = {}) {
    this.userID = null;
    this.reviewid = null;
    this.ecoID = null;
    this.species = null;
    this.status = null;
    this.comment = null;
    this.hucName = null;
    this.isHucInModeledRange = null;
    this.isSaved = null;
    this.markup = null;
  }

  init(options) {
    console.log("INIT: options: ", options)
    this.userID = options.userID || null;
    this.reviewid = options.reviewid || null;
    this.ecoID = options.ecoID || null;
    this.species = options.species || null;
    this.hucName = options.hucName || null;
    this.status = options.status || null;
    this.comment = options.comment || null;
    this.isHucInModeledRange = options.isHucInModeledRange || null;
    this.isSaved = options.isSaved || null;
    this.additionalFields = options.additionalFields || {};
    this.ecoAtts = options.ecoAtts || {};
    this.hucForSpeciesData = options.hucForSpeciesData || {};
    this.markup = options.markup || null;

  }

  // setUserID(val=''){
  //     this.userID = val;
  // };

  // setHucID(val=''){
  //     this.hucID = val;
  // };

  // setSpecies(val=''){
  //     this.species = val;
  // };

  setStatus(val = "") {
    this.status = val;
  }

  setComment(val = "") {
    this.comment = val;
  }
  setMarkup(val = "") {
    this.markup = val;
  }

  setAdditionalField(field = null, value = "") {
    if (field != null) this.additionalFields[field] = value;
  }

  reset() {
    this.userID = null;
    this.reviewid = null;
    this.ecoID = null;
    this.species = null;
    this.status = null;
    this.comment = null;
    this.hucName = null;
    this.isHucInModeledRange = null;
    this.isSaved = null;
    this.additionalFields = {};
    this.ecoAtts = {};
    this.hucForSpeciesData = {};
    this.markup = null;
  }

  getFeedbackData() {
    return {
      userID: this.userID,
      reviewid: this.reviewid,
      ecoID: this.ecoID,
      species: this.species,
      status: this.status,
      comment: this.comment,
      hucName: this.hucName,
      isHucInModeledRange: this.isHucInModeledRange,
      isSaved: this.isSaved,
      additionalFields: this.additionalFields,
      ecoAtts: this.ecoAtts,
      hucForSpeciesData: this.hucForSpeciesData,
      markup: this.markup

    };
  }
}
