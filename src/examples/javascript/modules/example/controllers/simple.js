'use strict';
/**
 * a simple example controller using the @coolgk/mvc framework
 */
const { Controller } = require('@coolgk/mvc/controller');

/**
 * controller classes should extend the Controller class from @coolgk/mvc/controller
 * you can also create your own base controller that extends @coolgk/mvc/controller
 */
class Simple extends Controller {
    /**
     * setup valid routes to methods
     */
    getRoutes () {
        return {
            GET: {
                index: '', // allow GET request to call the index() method
                user: ':id/:section', // allow GET request to call the user() method and id, section are the parameters in url
                noAccess: '' // allow GET request (no-access) to call the noAccess() method
            },
            POST: {
                save: '' // allow POST request to call the save() method
            }
        };
    }

    /**
     * setup permission callbacks for accessing methods
     */
    getPermissions () {
        return {
            // * is the default permission for all methods in this class
            // allow requests to access all methods
            '*': () => true,
            'user': () => Promise.resolve(true), // the callback can also return a promise<boolean>
            'noAccess': () => false, // deny all access
        };
    }

    /**
     * HTTP Request:
     * GET /example/simple or /example/simple/index
     * index is the default method if not specified in the url
     */
    index () {
        // this._options contains the object passed into the router's constructor
        // use the "response" property passed into the router's constructor
        this._options.response.json(['index']);
    }

    /**
     * HTTP Request:
     * GET /example/simple/user/123/preference
     * @param {object} dependencies - this param is destructured in this example
     * @param {object} dependencies.params - url param values configured in getRoutes()
     */
    user ({ params }) {
        // this._options contains the object passed into the router's constructor
        this._options.response.json(params);
    }

    /**
     * HTTP Request:
     * POST /example/simple/save
     */
    save () {
        // this._options contains the object passed into the router's constructor
        // if you pass the express's request object into router's contructor, you can then access variable created by middleware
        // e.g. this._options.request.session, this._options.request.body, this._options.request.cookie etc.
        this._options.response.json(['save']);
    }

    /**
     * HTTP Request: /example/simple/no-access
     */
    noAccess () {
        // the callback in getPermissions() for the noAccess() method returns false
        // router will return a 403 Forbidden response
    }

    /**
     * HTTP Request: /example/simple/internal
     */
    internal () {
        // internal is not defined in getRoutes() i.e. this method no accessible through a request
        // router will return a 404 Not Found response
    }
}

exports.default = Simple;