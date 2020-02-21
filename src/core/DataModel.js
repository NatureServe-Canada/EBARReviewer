import config from "../config";

export default class DataModel {
  constructor(options = {}) {
    this.speciesLookup = [];
    this.ecoShapesBySpecies = {};
    this.status = [];
    this.selectedSpecies = null;
    this.selectedEcoShape = null;
    this.overallFeedback = {};
    this.selectedEcoShapes = [];
  }

  init() { }

  setSpeciesLookup(data = []) {
    this.speciesLookup = data;
  }

  getSpeciesInfo(speciesCode = "") {
    const speciesInfo = this.speciesLookup.filter(d => {
      return d["rangemapid"] === +speciesCode;
      //return d[config.FIELD_NAME.speciesLookup.speciesCode] === speciesCode;
    })[0];
    return speciesInfo;
  }

  setEcoShpsBySpecies(species, data = []) {
    this.ecoShapesBySpecies[species] = data;
    // console.log('ecoShapesBySpecies', species, this.ecoShapesBySpecies[species])
  }

  saveToOverallFeedback(key, val) {
    this.overallFeedback[key] = val;
    // this.ecoShapesBySpecies = data;
  }

  setStatus(data = []) {
    this.status = data;
    // console.log(this.status);
  }

  setSelectedSpecies(val = null) {
    this.selectedSpecies = val;
  }

  getSelectedSpecies() {
    return this.selectedSpecies;
  }

  setSelectedEcoShp(val = null) {
    this.selectedEcoShape = val;
    if (val)
      this.selectedEcoShapes.push(val);
  }

  getSelectedEcoShp() {
    return this.selectedEcoShape;
  }

  getSelectedEcoShps() {
    return this.selectedEcoShapes;
  }
  clearSelectedEcoShps() {
    this.selectedEcoShapes = [];
  }
  getEcoShpsBySpecies(species) {
    species = species || this.selectedSpecies;
    return this.ecoShapesBySpecies[species];
  }

  getStatusByIndex(index) {
    return index && this.status[+index] ? this.status[+index] : null;
  }

  isHucInModeledRange(ecoId, species) {
    const ecos = this.ecoShapesBySpecies[species];
    // console.log('isHucInModeledRange', ecoId);

    if (ecos) {
      return ecos.filter(d => {
        return d[config.FIELD_NAME.speciesDistribution.ecoShapeID] === ecoId;
      }).length
        ? true
        : false;
    } else {
      return false;
    }
    // const isHucInModeledRange = ecos.filter(d=>{ return d[config.FIELD_NAME.speciesDistribution.ecoShapeID] === ecoId }).length ? true : false;
    // return isHucInModeledRange;
  }

  getOverallFeedback(key) {
    return this.overallFeedback[key];
  }
}
