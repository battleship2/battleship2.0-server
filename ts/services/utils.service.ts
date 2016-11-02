/// <reference path="../definitions/definitions.d.ts" />

let _instance: Utils = null;

class Utils {

    /**********************************************************************************/
    /*                                                                                */
    /*                                  PROPERTIES                                    */
    /*                                                                                */
    /**********************************************************************************/

    /**********************************************************************************/
    /*                                                                                */
    /*                                  CONSTRUCTOR                                   */
    /*                                                                                */
    /**********************************************************************************/

    constructor() {
        if (this.isNull(_instance)) {
            _instance = this;
        }

        return _instance;
    }

    /**********************************************************************************/
    /*                                                                                */
    /*                                PUBLIC MEMBERS                                  */
    /*                                                                                */
    /**********************************************************************************/

    /**
     * @name uuid
     * @kind function
     *
     * @description
     * Returns a unique universal identifier.
     *
     * @returns {String} The UUID.
     */
    public uuid = (): string => {
        var time = new Date().getTime() + process.hrtime()[0];

        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char: string) => {
            var r = (time + Math.random() * 16) % 16 | 0;
            time = Math.floor(time / 16);
            return (char === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    };

    /**
     * @name isNull
     * @kind function
     *
     * @description
     * Determines if a reference is `null`.
     *
     * @param {*} value Reference to check.
     * @returns {Boolean} True if `value` is `null`.
     */
    public isNull = (value: any): boolean => {
        return value === null && typeof value === 'object';
    };

    /**
     * @name isString
     * @kind function
     *
     * @description
     * Determines if a reference is a `String`.
     *
     * @param {*} value Reference to check.
     * @returns {Boolean} True if `value` is a `String`.
     */
    public isString = (value: any): boolean => {
        return typeof value === 'string';
    };

    /**
     * @name isUndefined
     * @kind function
     *
     * @description
     * Determines if a reference is undefined.
     *
     * @param {*} value Reference to check.
     * @returns {Boolean} True if `value` is undefined.
     */
    public isUndefined = (value: any): boolean => {
        return typeof value === 'undefined';
    };

    /**
     * @name isDefined
     * @kind function
     *
     * @description
     * Determines if a reference is defined.
     *
     * @param {*} value Reference to check.
     * @returns {Boolean} True if `value` is defined.
     */
    public isDefined = (value: any): boolean => {
        return typeof value !== 'undefined';
    };

    /**
     * @name isObject
     * @kind function
     *
     * @description
     * Determines if a reference is an `Object`. Unlike `typeof` in JavaScript, `null`s are not
     * considered to be objects. Note that JavaScript arrays are objects.
     *
     * @param {*} value Reference to check.
     * @returns {Boolean} True if `value` is an `Object` but not `null`.
     */
    public isObject = (value: any): boolean => {
        return value !== null && typeof value === 'object';
    };

    /**
     * @name isNumber
     * @kind function
     *
     * @description
     * Determines if a reference is a `Number`.
     *
     * This includes the "special" numbers `NaN`, `+Infinity` and `-Infinity`.
     *
     * If you wish to exclude these then you can use the native
     * [`isFinite'](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/isFinite)
     * method.
     *
     * @param {*} value Reference to check.
     * @returns {Boolean} True if `value` is a `Number`.
     */
    public isNumber = (value: any): boolean => {
        return typeof value === 'number';
    };

    /**
     * @name isDate
     * @kind function
     *
     * @description
     * Determines if a value is a date.
     *
     * @param {*} value Reference to check.
     * @returns {Boolean} True if `value` is a `Date`.
     */
    public isDate = (value: any): boolean => {
        return Object.prototype.toString.call(value) === '[object Date]';
    };

    /**
     * @name isArray
     * @kind function
     *
     * @description
     * Determines if a reference is an `Array`.
     *
     * @param {*} value Reference to check.
     * @returns {Boolean} True if `value` is an `Array`.
     */
    public isArray = (value: any): boolean => {
        return Array.isArray(value);
    };

    /**
     * @name isFunction
     * @kind function
     *
     * @description
     * Determines if a reference is a `Function`.
     *
     * @param {*} value Reference to check.
     * @returns {Boolean} True if `value` is a `Function`.
     */
    public isFunction = (value: any): boolean => {
        return typeof value === 'function';
    };

    /**
     * @name isElement
     * @kind function
     *
     * @description
     * Determines if a reference is a DOM element (or wrapped jQuery element).
     *
     * @param {*} node Reference to check.
     * @returns {Boolean} True if `value` is a DOM element (or wrapped jQuery element).
     */
    public isElement = (node: any): boolean => {
        return !!(node &&
        (node.nodeName  // we are a direct element
        || (node.prop && node.attr && node.find)));  // we have an on and find method part of jQuery API
    };

    /**
     * @name isRegExp
     * @kind function
     *
     * @description
     * Determines if a value is a regular expression object.
     *
     * @param {*} value Reference to check.
     * @returns {Boolean} True if `value` is a `RegExp`.
     */
    public isRegExp = (value: any): boolean => {
        return toString.call(value) === '[object RegExp]';
    };

    /**
     * @name noop
     * @kind function
     *
     * @description
     * A function that performs no operations. This function can be useful when writing code in the
     * functional style.
     */
    public noop = () => {
    };

    /**
     * @name getAspectRatioFit
     * @kind function
     *
     * @description
     * Conserve aspect ratio of the orignal region. Useful when shrinking/enlarging
     * images to fit into a certain area.
     *
     * @param {Number} srcWidth Source area width
     * @param {Number} srcHeight Source area height
     * @param {Number} maxWidth Fittable area maximum available width
     * @param {Number} maxHeight Fittable area maximum available height
     * @return {Object} { width, height }
     */
    public getAspectRatioFit = (srcWidth: number, srcHeight: number, maxWidth: number, maxHeight: number): {ratio: number, width: number, height: number} => {
        var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
        return {ratio: ratio, width: srcWidth * ratio, height: srcHeight * ratio};
    };

    /**
     * @name extend
     * @kind function
     *
     * @description
     * Extends the destination object `dst` by copying own enumerable properties from the `src` object(s)
     * to `dst`. You can specify multiple `src` objects. If you want to preserve original objects, you can do so
     * by passing an empty object as the target: `var object = extend({}, object1, object2)`.
     *
     * **Note:** Keep in mind that `extend` does not support recursive merge (deep copy). Use
     * {@link merge} for _instance.
     *
     * @param {Object} dst Destination object.
     * @param {...Object} sources Source object(s).
     * @returns {Object} Reference to `dst`.
     */
    public extend = (dst: Object, ...sources: Object[]): Object => {
        return _baseExtend(dst, [].slice.call(sources, 1), false);
    };


    /**
     * @name merge
     * @kind function
     *
     * @description
     * Deeply extends the destination object `dst` by copying own enumerable properties from the `src` object(s)
     * to `dst`. You can specify multiple `src` objects. If you want to preserve original objects, you can do so
     * by passing an empty object as the target: `var object = merge({}, object1, object2)`.
     *
     * Unlike {@link extend extend()}, `merge()` recursively descends into object properties of source
     * objects, performing a deep copy.
     *
     * @param {Object} dst Destination object.
     * @param {...Object} sources Source object(s).
     * @returns {Object} Reference to `dst`.
     */
    public merge = (dst: Object, ...sources: Object[]): Object => {
        return _baseExtend(dst, [].slice.call(sources, 1), true);
    };

    /**
     * @name forEach
     * @kind function
     *
     * @description
     * Invokes the `iterator` function once for each item in `obj` collection, which can be either an
     * object or an array. The `iterator` function is invoked with `iterator(value, key, obj)`, where `value`
     * is the value of an object property or an array element, `key` is the object property key or
     * array element index and obj is the `obj` itself. Specifying a `context` for the function is optional.
     *
     * It is worth noting that `forEach` does not iterate over inherited properties because it filters
     * using the `hasOwnProperty` method.
     *
     * Unlike ES262's
     * [Array.prototype.forEach](http://www.ecma-international.org/ecma-262/5.1/#sec-15.4.4.18),
     * providing 'undefined' or 'null' values for `obj` will not throw a TypeError, but rather just
     * return the value provided.
     *
     * @param {Object|Array} obj Object to iterate over.
     * @param {Function} iterator Iterator function.
     * @param {Object=} context Object to become context (`this`) for the iterator function.
     * @returns {Object|Array} Reference to `obj`.
     */
    public forEach = (obj: any, iterator: Function, context?: Object): Object => {

        var key, length;

        if (obj) {

            if (_instance.isFunction(obj)) {

                for (key in obj) {
                    if (key !== 'prototype' && key !== 'length' && key !== 'name' && obj.hasOwnProperty(key)) {
                        iterator.call(context, obj[key], key, obj);
                    }
                }

            } else if (_instance.isArray(obj) || _isArrayLike(obj)) {

                var isPrimitive = typeof obj !== 'object';
                for (key = 0, length = obj.length; key < length; key++) {
                    if (isPrimitive || key in obj) {
                        iterator.call(context, obj[key], key, obj);
                    }
                }

            } else if (obj.forEach && obj.forEach !== _instance.forEach) {

                obj.forEach(iterator, context, obj);

            } else if (_isBlankObject(obj)) {

                // createMap() fast path --- Safe to avoid hasOwnProperty check because prototype chain is empty
                for (key in obj) {
                    iterator.call(context, obj[key], key, obj);
                }

            } else if (typeof obj.hasOwnProperty === 'function') {

                // Slow path for objects inheriting Object.prototype, hasOwnProperty check needed
                for (key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        iterator.call(context, obj[key], key, obj);
                    }
                }

            } else {

                // Slow path for objects which do not have a method `hasOwnProperty`
                for (key in obj) {
                    if (window.hasOwnProperty.call(obj, key)) {
                        iterator.call(context, obj[key], key, obj);
                    }
                }

            }
        }

        return obj;

    };

}

/**********************************************************************************/
/*                                                                                */
/*                               PRIVATE MEMBERS                                  */
/*                                                                                */
/**********************************************************************************/

/**
 * @name _baseExtend
 * @kind function
 *
 * @description
 * Base for `merge` and `extend` functions
 */
function _baseExtend(dst: Object, objs: any, deep: boolean): Object {

    for (var i = 0, ii = objs.length; i < ii; ++i) {

        var obj = objs[i];

        if (!_instance.isObject(obj) && !_instance.isFunction(obj)) continue;

        var keys = Object.keys(obj);

        for (var j = 0, jj = keys.length; j < jj; j++) {

            var key = keys[j];
            var src = obj[key];

            if (deep && _instance.isObject(src)) {

                if (_instance.isDate(src)) {
                    dst[key] = new Date(src.valueOf());
                } else if (_instance.isRegExp(src)) {
                    dst[key] = new RegExp(src);
                } else if (src.nodeName) {
                    dst[key] = src.cloneNode(true);
                } else if (_instance.isElement(src)) {
                    dst[key] = src.clone();
                } else {
                    if (!_instance.isObject(dst[key])) dst[key] = _instance.isArray(src) ? [] : {};
                    _baseExtend(dst[key], [src], true);
                }

            } else {

                dst[key] = src;

            }

        }

    }

    return dst;

}

/**
 * @name _isArrayLike
 * @kind function
 *
 * @description
 * Returns true if `obj` is an array or array-like object (NodeList, Arguments, String ...)
 */
function _isArrayLike(obj: any): boolean {

    // `null`, `undefined` and `window` are not array-like
    if (obj == null || _isWindow(obj)) return false;

    // arrays, strings and jQuery/jqLite objects are array like
    // * jqLite is either the jQuery or jqLite constructor function
    // * we have to check the existence of jqLite first as this method is called
    //   via the forEach method when constructing the jqLite object in the first place
    if (_instance.isArray(obj) || _instance.isString(obj)) return true;

    // Support: iOS 8.2 (not reproducible in simulator)
    // "length" in obj used to prevent JIT error (gh-11508)
    var length = 'length' in Object(obj) && obj.length;

    // NodeList objects (with `item` method) and
    // other objects with suitable length characteristics are array-like
    return _instance.isNumber(length) &&
        (length >= 0 && ((length - 1) in obj || obj instanceof Array) || typeof obj.item === 'function');

}

/**
 * @name _isArrayLike
 * @kind function
 *
 * @description
 * Checks if `obj` is a window object.
 */
function _isWindow(obj: any): boolean {
    return obj && obj.window === obj;
}

/**
 * @name _isBlankObject
 * @kind function
 *
 * @description
 * Determine if a value is an object with a null prototype
 */
function _isBlankObject(value: any): boolean {
    return value !== null && typeof value === 'object' && !Object.getPrototypeOf(value);
}

export = Utils;
