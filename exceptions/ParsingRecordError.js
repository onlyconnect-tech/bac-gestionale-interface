
export default class ParsingRecordError extends Error {
    constructor(...args) {
        super(...args);
        Error.captureStackTrace(this, ParsingRecordError);
    }
}
