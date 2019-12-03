export default (()=>{
    // Unhandled promise rejection TypeError: Object doesn't support property or method 'forEach'
    // https://developer.mozilla.org/en-US/docs/Web/API/NodeList/forEach#Browser_Compatibility
    if (window.NodeList && !NodeList.prototype.forEach) {
        NodeList.prototype.forEach = function (callback, thisArg) {
            thisArg = thisArg || window;
            for (var i = 0; i < this.length; i++) {
                callback.call(thisArg, this[i], i, this);
            }
        };
    }
})();