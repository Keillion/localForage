import executeCallback from '../utils/executeCallback';
import normalizeKey from '../utils/normalizeKey';
import getCallback from '../utils/getCallback';

const tempStorage = new Map();

function _getKeyPrefix(options, defaultConfig) {
    let keyPrefix = options.name + '/';

    if (options.storeName !== defaultConfig.storeName) {
        keyPrefix += options.storeName + '/';
    }
    return keyPrefix;
}

// Config the tempStorage backend, using options set in the config.
async function _initStorage(options) {
    const dbInfo = {};
    if (options) {
        for (let i in options) {
            dbInfo[i] = options[i];
        }
    }

    const keyPrefix = dbInfo.keyPrefix = _getKeyPrefix(options, this._defaultConfig);

    this._dbInfo = dbInfo;

    if(!tempStorage.has(keyPrefix)){
        tempStorage.set(keyPrefix, new Map());
    }
}

// Remove all keys from the datastore, effectively destroying all data in
// the app's key/value store!
function clear(callback) {
    const promise = this.ready().then(()=>{
        const keyPrefix = this._dbInfo.keyPrefix;

        if(tempStorage.has(keyPrefix)){
            tempStorage.delete(keyPrefix);
        }
    });

    executeCallback(promise, callback);
    return promise;
}

// Retrieve an item from the store. Unlike the original async_storage
// library in Gaia, we don't modify return values at all. If a key's value
// is `undefined`, we pass that value to the callback function.
function getItem(key, callback) {

    key = normalizeKey(key);

    const promise = this.ready().then(()=>{
        return tempStorage.get(this._dbInfo.keyPrefix).getItem(key);
    });

    executeCallback(promise, callback);
    return promise;
}

function keys(callback) {
    const promise = this.ready().then(()=>[...tempStorage.get(this._dbInfo.keyPrefix).keys()]);
    executeCallback(promise, callback);
    return promise;
}

// Supply the number of keys in the datastore to the callback function.
function length(callback) {
    const promise = this.ready().then(()=>tempStorage.get(this._dbInfo.keyPrefix).size);
    executeCallback(promise, callback);
    return promise;
}

// Remove an item from the store, nice and simple.
function removeItem(key, callback) {
    key = normalizeKey(key);
    const promise = this.ready().then(()=>{
        tempStorage.get(this._dbInfo.keyPrefix).delete(key);
    });
    executeCallback(promise, callback);
    return promise;
}

// Set a key's value and run an optional callback once the value is set.
// Unlike Gaia's implementation, the callback function is passed the value,
// in case you want to operate on that value only after you're sure it
// saved, or something like that.
function setItem(key, value, callback) {
    var self = this;

    key = normalizeKey(key);

    const promise = self.ready().then(()=>{
        // Convert undefined values to null.
        // https://github.com/mozilla/localForage/pull/42
        if (value === undefined) {
            value = null;
        }

        tempStorage.get(this._dbInfo.keyPrefix).set(key, value);
        return value;
    });

    executeCallback(promise, callback);
    return promise;
}

function dropInstance(options, callback) {
    callback = getCallback.apply(this, arguments);

    options = (typeof options !== 'function' && options) || {};
    if (!options.name) {
        const currentConfig = this.config();
        options.name = options.name || currentConfig.name;
        options.storeName = options.storeName || currentConfig.storeName;
    }

    let promise;
    if (!options.name) {
        promise = Promise.reject('Invalid arguments');
    } else {
        promise = new Promise(resolve=>{
            if (!options.storeName) {
                resolve(`${options.name}/`);
            } else {
                resolve(_getKeyPrefix(options, this._defaultConfig));
            }
        }).then(keyPrefix=>{
            tempStorage.delete(keyPrefix);
        });
    }

    executeCallback(promise, callback);
    return promise;
}


var tempStorageWrapper = {
    _driver: 'tempStorageWrapper',
    _initStorage: _initStorage,
    getItem: getItem,
    setItem: setItem,
    removeItem: removeItem,
    clear: clear,
    length: length,
    keys: keys,
    dropInstance: dropInstance
};

export default tempStorageWrapper;