export default class FeedbackManager {
  constructor(options = {}) {
    this.userID = null;
    this.hucID = null;
    this.species = null;
    this.status = null;
    this.comment = null;
    this.hucName = null;
    this.isHucInModeledRange = null;
    this.isSaved = null;
  }

  init(options) {
    this.userID = options.userID || null;
    this.hucID = options.hucID || null;
    this.species = options.species || null;
    this.hucName = options.hucName || null;
    this.status = options.status || null;
    this.comment = options.comment || null;
    this.isHucInModeledRange = options.isHucInModeledRange || null;
    this.isSaved = options.isSaved || null;
    this.additionalFields = options.additionalFields || {};
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

  setAdditionalField(field = null, value = "") {
    if (field != null) this.additionalFields[field] = value;
  }

  reset() {
    this.userID = null;
    this.hucID = null;
    this.species = null;
    this.status = null;
    this.comment = null;
    this.hucName = null;
    this.isHucInModeledRange = null;
    this.isSaved = null;
    this.additionalFields = {};
  }

  getFeedbackData() {
    return {
      userID: this.userID,
      hucID: this.hucID,
      species: this.species,
      status: this.status,
      comment: this.comment,
      hucName: this.hucName,
      isHucInModeledRange: this.isHucInModeledRange,
      isSaved: this.isSaved,
      additionalFields: this.additionalFields
    };
  }
}
