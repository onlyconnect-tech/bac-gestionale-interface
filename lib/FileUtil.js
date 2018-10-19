import fs from 'fs';
import Logger from './logger';

const logger = new Logger('FILE_UTIL');

export default class FileUtil {

    /**
     * 
     * @param {string} fileName
     * 
     * @return {Promise<Date>} 
     */
    static getDateFileModification(fileName) {

        return new Promise(function(resolve, reject){

            fs.stat(fileName, (err, stats)=> {
                if(err) {
                    logger.warn(err.message);
                    return reject(err);
                }
            
                // Date
                resolve(stats.mtime);
            });

        });
        
        
    }

    /**
     * Update filesToMonitor map with modification date
     * 
     * @param {string} fileName 
     * @param {Map<string, Date>} filesToMonitor 
     */

    static registerFileModificationChecker(fileName, filesToMonitor) {
        fs.watchFile(fileName, (curr, prev) => {

            logger.info('**** MOD FILE: %s', fileName);
            logger.info(`the current mtime is: ${curr.mtime}`);
            logger.info(`the previous mtime was: ${prev.mtime}`);
            logger.info('*****************************************');
            
            // insert date
            filesToMonitor.set(fileName, curr.mtime);
        
        });
    }
}

module.exports = FileUtil;
