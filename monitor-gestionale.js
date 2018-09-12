import Parser from 'node-dbf';

import Mongo from './lib/mongo';

// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
// 'myproject'
const dbName = 'myproject';

var numRow = 0;
let parser = new Parser('./data/ANACF.DBF');

var isFinishedReadingDB = false;

var records = [];

parser.on('start', (p) => {
    console.log('dBase file parsing has started', p.filename);
});

parser.on('header', (h) => {
    console.log('dBase file header has been parsed', JSON.stringify(h));
});

parser.on('record', (record) => {
    numRow++;
    // console.log("PUSH RECORD:", record);
    records.push(record);
});

parser.on('end', (p) => {
    console.log('Finished parsing the dBase file - numRow:', numRow);
    //console.log( JSON.stringify(record)); 

    isFinishedReadingDB = true;

    doInsertWork();

    /*

    var record = records.shift();
    
    recursiveParser(record);
    
    */

});

parser.parse();

async function doInsertWork() {

    const mongo = new Mongo();

    /*
      records.map( record => {
          console.log("********* ", record);
      });
      */

    // start with current being an "empty" already-fulfilled promise
    try {
        const db = await mongo.getDB(url, dbName);

        var current = Promise.resolve();

        await Promise.all(records.map(function (record) {

            current = current.then(async function () {
                try {
                    var p = await doInsertRecord(db, record); // returns promise
                    return p;
                } catch (e) {
                    console.log(e);
                    return Promise.reject();
                }
            }).catch(function (err) {
                console.log(err, ' --> ', record);
            });

            return current;
        }));

        mongo.closeClient();
    } catch (e) {
        console.log(e);
    }


}

async function doInsertRecord(db, record) {

    return new Promise(async function (resolve, reject) {

        var isDeleted = record['@deleted'];
        var sequenceNumber = record['@sequenceNumber'];

        console.log('--> sequenceNumber: %d . isDeleted: %s', sequenceNumber, isDeleted);

        /*
        console.log("-idFattura: %d - addDoc: %s - datDoc: %s - codCliente: %d - totImp: %f - totIVA: %f - isDeleted:  %s", 
            idFattura, annDoc, datDoc, codCliente, totImp, totIVA, isDeleted);
        */

        // check if !isDeleted

        /*
        { '@sequenceNumber': 1,
    '@deleted': false,
    CLFR: 'C',
    CODCF: '18001',
    RAGSOC: 'COND.DI VIA GIUBA 13',
    RAGSOC1: '',
    INDIR: 'VIA GIUBA 13',
    CAP: '20100',
    LOCAL: 'MILANO',
    PROV: 'MI',
    INDIRA: '',
    CAPA: '',
    LOCALA: '',
    PROVA: '',
    INDIRD: '',
    CAPD: '',
    LOCALD: '',
    PROVD: '',
    LOCALN: '',
    CODFISC: '80315280158',
    PARTIVA: '',
    BANCA: '',
    CODPAG: 'RD01',
    IVA: '',
    SCONTO1: 0,
    SCONTO2: 0,
    ALLEGA: '',
    BOLLE: 'S',
    CODAGE: 'RP 0',
    CONTOPDC: '',
    PERSOC: 'P',
    PREZZO: '1',
    BOLLI: 'N',
    MASTRO: 'OA',
    TEL: '',
    TEL2: '',
    FAX: '',
    EMAIL: '',
    RESPRAP: '',
    NOTACOM: '',
    PROTRAT: '',
    TERMCON: '',
    OBIEFAT: 0,
    PROVAGE: 0,
    SIEAN: 'N',
    CODNAZ: '',
    CODEAN: '0,00',
    FMEMO: '',
    SCAD1: '',
    SCAD2: '',
    LISART: NaN,
    TIPSCO: 'N',
    CODPOR: '',
    CODTRA: '',
    CODDIV: '',
    RAGCLI: '',
    FIDCLI: 0,
    CLIBLOC: 'N',
    DTULVIS: '',
    DTULVEN: '20180419',
    FREVIS: 0,
    FATCLI: 7361.22,
    CODVET: '',
    ZONA: '054',
    NSCOD: '',
    STAEC: 'S',
    STASOL: 'S',
    DTULSOL: '',
    IVASOS: '',
    EURO: '',
    NOME_PF: '',
    COGN_PF: '',
    USERWE: '',
    CHECKWE: '',
    FLAGSPESE: '',
    FISSOSPESE: 0,
    CIN: '',
    IBAN: '',
    SWIFT: '',
    C_C: '',
    OBSOLE: '',
    MAXORD: 0,
    MAXFAT: 0,
    CLASSE: 'C',
    DATINS: '20090216',
    DATUMOD: '20140710',
    AFFID: 100,
    TERBAN: '',
    IVAACQ: '',
    SOGRIT: 'S',
    CAURIT: '1020',
    ESCLALLEG: '',
    DATPIVA: '',
    PIVAVALID: '',
    CODBAN: '02',
    RIDTIP: '0',
    RIDTCOD: '0',
    RIDCOD: '',
    ALIAS: '18001',
    PEC: '',
    PROVN: '',
    DTNASCPF: '',
    SESSO: 'M',
    CODSTAE: '',
    CONTEA: '',
    FISCPRIV: '',
    CODFISCE: '',
    ACCOEFF: '',
    ESCC3000: '',
    COMSMAR: '',
    ESCFTSEP: '',
    DATUREV: '',
    SITOWEB: '',
    NUMDIP: NaN,
    TIPATT: '',
    AUTMAILPRO: '',
    AUTTELPRO: '',
    ORIGCMPGN: 'M',
    ORIGALTRA: '',
    LIBERC01: '',
    LIBERC02: '',
    LIBERC03: '',
    LIBERC04: '',
    LIBERN01: NaN,
    LIBERN02: NaN,
    LIBERN03: NaN,
    LIBERN04: NaN,
    LIBERD01: '',
    LIBERD02: '',
    XDX03: 0,
    FATELE: '',
    INDICEPA: '',
    CATPRO: '',
    GGRINV1: '',
    SCAD1_2: '',
    SCAD2_2: '',
    GGRINV2: '',
    GGFIXSCAD: NaN,
    MMFIXSCAD: '',
    RIFAMMIN: '',
    BOLVIRT: '',
    CONTR_CF: '',
    DOCFINVF: '',
    DOCFINRT: '',
    DOCFINGG: NaN,
    NORESSCHUM: '',
    FMT_FE: '',
    CODSDI: '',
    PEC_FE: '0.00                0.',
    ADDINFO: '00',
    IMPBOLL: '',
    ESCCADI: '',
    EORI: '0.00',
    ESCANNREG: '',
    SGNOIDEN: '',
    SGFITRIEP: '',
    FORM_FE: '',
    DESTB2BASW: '0.00                       43234.3940061',
    FW_ATCPDF: '',
    APPCEE: '',
    DOGANA: '' }
    */

        /*
        INDIR: 'VIA GIUBA 13',
    CAP: '20100',
    LOCAL: 'MILANO',
    PROV: 'MI',

        */

        if (record.CLFR === 'F') {

            return resolve();
        }

        const info = {
            codiceCli: record.CODCF,
            ragSoc: record.RAGSOC,
            indSedeLeg: record.INDIR,
            ragSoc2: record.RAGSOC2,
            codiceFisc: record.CODFISC,
            pIva: record.PARTIVA,
            cap: record.CAP,
            localita: record.LOCAL,
            prov: record.PROV
        };


        let ragSoc = info.ragSoc;
        if (info.ragSoc2) {
            ragSoc = ragSoc + ' - ' + info.ragSoc2;
        }

        if (!isDeleted) {

            if (isNaN(info.codiceCli)) {
                console.log('INVALID RECORD:', record);
                return reject();
            }

            console.log('----> inserting - codCli: %d, ragSoc: %s, sedeLeg: %s, codFisc: %s, pIva: %s', info.codiceCli, ragSoc, info.indSedeLeg, info.codiceFisc, info.pIva);

            var mongo = new Mongo();

            // info.localita, info.cap, info.prov
            var location = { localita: info.localita, 
                cap: info.cap, 
                prov: info.prov };

            try {
                var idLocation = await mongo.doInsertLocationOnlyOne(db, location);

                console.log('idLocation:', idLocation);

                var anagrafica = {
                    sequenceNumber: sequenceNumber,
                    codiceCli: info.codiceCli,
                    ragSoc: ragSoc,
                    indSedeLeg: info.indSedeLeg,
                    codiceFisc: info.codiceFisc,
                    pIva: info.pIva,
                    location: { id_location: idLocation }
                };
    
                await mongo.doInsertAnagrafica(db, anagrafica);


            } catch(err) {
                console.log(err);
            }
            /*

            var anagrafica = {
                sequenceNumber: sequenceNumber,
                codiceCli: info.codiceCli,
                ragSoc: ragSoc,
                indSedeLeg: info.indSedeLeg,
                codiceFisc: info.codiceFisc,
                pIva: info.pIva
            };

            await mongo.doInsertAnagrafica(db, anagrafica);
            */

            resolve();

            // comune, cap, provincia


            /*

            anagrafica.getLocationID(info.localita, info.cap, info.prov).then(elem => {
                console.log("ELEM: ", elem);
                if (elem) {
                    // for join with locations table
                    var localitaId = elem.id;
                    anagrafica.insertAnagraficaClienti(sequenceNumber, info.codiceCli, ragSoc, info.indSedeLeg, info.codiceFisc, info.pIva, localitaId).catch((err) => {
                        console.log(err.detail);
                        return reject();
                    });

                    return resolve();

                } else {
                    console.log('%s, %d, %s not found DO INSERT', info.localita, info.cap, info.prov);
                    // do insert

                    anagrafica.insertLocations(info.localita, info.cap, info.prov).then((idLocation) => {

                        console.log('%s, %d, %s INSERTED with %d', info.localita, info.cap, info.prov, idLocation);

                        var localitaId = idLocation;
                        anagrafica.insertAnagraficaClienti(sequenceNumber, info.codiceCli, ragSoc, info.indSedeLeg, info.codiceFisc, info.pIva, localitaId).catch((err) => {
                            console.log(err.detail);
                            return reject();
                        });

                        return resolve();

                    }).catch(err => {
                        console.log('ERROR INSERTING LOCATION: %s, %d, %s - error: %s', info.localita, info.cap, info.prov, err.detail);
                        return reject();
                    });

                }

            }).catch((err) => {
                console.log(err.detail);

                return reject();
            });

            */

        } else {
            // do DELETE if present

            console.log('----> DO DELETE = sequenceNumber: %d, codiceCli: %d, ragSoc: %s, indSedeLeg: %s, codiceFisc: %s, pIva: %s',
                sequenceNumber,
                info.codiceCli,
                ragSoc,
                info.indSedeLeg,
                info.codiceFisc,
                info.pIva);
            //@TODO

            resolve();
        }

    });

}