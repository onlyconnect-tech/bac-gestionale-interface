'use strict';

const hash = require('object-hash');
const level = require('level');

const ValueStatus = Object.freeze({"SAME":1, "MODIFIED":2, "NOVALUE":3 });

class Cache {

        constructor(pathFile) {
            this.pathFile = pathFile;
            this.db = level(pathFile);
        }

        // TO DO
        async getAnagraficaHash(id, value) {
            // check if there is or modified is there
            // return NOCHACHE
            // or MODIFIED
            var result = null;
            try {
                result = await this.db.get("anagrafica:" + id);
                var hashValue = hash(value);

                if(result === hashValue)
                    return ValueStatus.SAME;
                else
                    return ValueStatus.MODIFIED;

            } catch (err) {
                return ValueStatus.NOVALUE;
            }

        }

        async setAnagraficaHash(id, value) {

            await this.db.put("anagrafica:" + id, hash(value));
        }


}

exports.Cache = Cache;
exports.ValueStatus = ValueStatus;


