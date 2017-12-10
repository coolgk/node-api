import { DI, IServices } from './di';
import { Response } from './response';

export interface IConfig {
    [key: string]: any;
}

export interface IRoutes {
    [key: string]: { [propName: string]: string };
}

export interface IPermissions {
    [key: string]: Promise<boolean>;
}

export class Controller extends DI {

    protected _options: IConfig;

    constructor (options： IConfig = {}, response: Response) {
        super();
        this._options = options;
        this._response = response;
    }

    public getRoutes (): IRoutes {
        return {};
    }

    public getPermissions (): IPermissions {
        return {};
    }

    public _getServices (): IServices {
        return {};
    }

}
