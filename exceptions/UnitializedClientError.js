
export default class UnitializedClientError extends Error {
    /**
     * 
     * @param  {...any} args 
     */
    constructor(...args) {
        super(...args);
        Error.captureStackTrace(this, UnitializedClientError);
    }
}
