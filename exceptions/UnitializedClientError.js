
export default class UnitializedClientError extends Error {
    constructor(...args) {
        super(...args);
        Error.captureStackTrace(this, UnitializedClientError);
    }
}
