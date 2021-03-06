﻿/*!
 *  Copyright (c) 2017 Daniel Gong <daniel.k.gong@gmail.com>. All rights reserved.
 *  Licensed under the MIT License.
 */

import { access, constants } from 'fs';
import { Response } from './response';
import { getParams, IParams } from '@coolgk/url';
import { IDependencies } from './controller';

export { IParams };

export interface IRouterConfig {
    url: string;
    method: string;
    rootDir: string;
    urlParser?: (url: string, pattern: string) => IParams;
    [key: string]: any;
    [key: number]: any;
}

export interface IModuleControllerAction {
    module: string;
    controller: string;
    action: string;
    originalModule: string;
    originalController: string;
    originalAction: string;
}

export enum RouterError {
    Not_Found_404 = 'Not Found',
    Forbidden_403 = 'Forbidden'
}

export class Router {
    private _options: IRouterConfig;

    /* tslint:disable */
    /**
     * @param {object} options
     * @param {string} options.url - request.url or request.originalUrl from expressjs
     * @param {string} options.method - http request method GET POST etc
     * @param {string} options.rootDir - root dir of the app
     * @param {function} [options.urlParser] - a callback for parsing url params e.g. /api/user/profile/:userId. default parser: @coolgk/url
     */
    /* tslint:enable */
    public constructor (options: IRouterConfig) {
        this._options = options;
    }

    /* tslint:disable */
    /**
     * this method routes urls like /moduleName/controllerName/action/param1/params2 to file modules/modulename/controllers/controllerName.js
     * @return {promise} - returns a controller method's return value if the return value is not falsy otherwise returns standard response object genereated from the response methods called inside the controller methods e.g. response.json({...}), response.file(path, name) ...see code examples in decoupled.ts/js or full.ts/js
     */
    /* tslint:enable */
    public async route (): Promise<any> {
        const { module, controller, action, originalModule, originalController, originalAction } = this.getModuleControllerAction();

        const response = new Response();
        const controllerFile = `${this._options.rootDir}/modules/${module}/controllers/${controller}.js`.toLowerCase();
        const controllerFileReadable = await new Promise((resolve, reject) => {
            access(controllerFile, constants.R_OK, (error) => resolve(error ? false : true));
        });

        if (controllerFileReadable) {
            const controllerObject = new (require(controllerFile).default)(this._options);
            const route = controllerObject.getRoutes()[this._options.method];

            // route allowed & action exists
            if (route && route[action] !== undefined && controllerObject[action]) {
                const dependencies: IDependencies = {
                    params: (this._options.urlParser || getParams)(
                        this._options.url,
                        `${originalModule}/${originalController}/${originalAction}/${route[action]}`
                    ),
                    response,
                    globals: this._options
                };
                dependencies.services = await controllerObject.getServices(dependencies);

                const permissions = controllerObject.getPermissions(dependencies);
                const permission = permissions[action] || permissions['*'];
                const accessGranted = typeof(permission) === 'function' ? await permission() : true;

                if (!accessGranted) {
                    return response.text(RouterError.Forbidden_403, 403);
                }

                return await controllerObject[action](dependencies) || response.getResponse();
            }
        }

        return response.text(RouterError.Not_Found_404, 404);
    }

    /* tslint:disable */
    /**
     * @returns {object} - {module, controller, action, originalModule, originalController, originalAction} originals are values before they are santised and transformed e.g. /module.../ConTroller/action-one -> {action: 'module', controller: 'controller', action: 'actionOne', originalModule: 'module...', originalController: 'ConTroller', originalAction: 'action-one' }
     * @memberof Router
     */
    /* tslint:enable */
    public getModuleControllerAction (): IModuleControllerAction {
        // this._option.url is "request.url" from node or "request.originalUrl" from express
        const [, originalModule, originalController, originalAction] = (this._options.url.split('?').shift() || '').split('/');

        return {
            module: this._sanatise(originalModule),
            controller: this._sanatise(originalController),
            action: this._sanatise(originalAction),
            originalModule,
            originalController,
            originalAction
        };
    }

    /**
     * filter out malicious characters from the url e.g. . (dot) from /portix/print?page=../../../../../../../../../etc/passwd
     * and convert hyphen-separated-case to camelCase e.g. no-access becomes noAccess
     * @ignore
     * @private
     * @param {string} moduleControllerAction - original module, controller or action string from the url
     * @returns {string}
     * @memberof Router
     */
    private _sanatise (moduleControllerAction: string): string {
        return (moduleControllerAction || 'index')
            .replace(/[^_a-zA-Z0-9\-]/g, '')
            .toLowerCase()
            .split('-')
            .map((text, index) => index ? text[0].toUpperCase() + text.substr(1) : text)
            .join('');
    }
}

export default Router;
