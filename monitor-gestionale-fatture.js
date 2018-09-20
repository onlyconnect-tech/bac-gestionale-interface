
import Parser from 'node-dbf';

var numRow = 0;
let parser = new Parser('./data/TABFST01.DBF');
 
parser.on('start', (p) => {
    console.log('dBase file parsing has started');
});
 
parser.on('header', (h) => {
    console.log('dBase file header has been parsed' + JSON.stringify(h));
});
 
parser.on('record', (record) => {
    numRow ++;
    //console.log( JSON.stringify(record)); 
    doInsertRecord(record);
});
 
parser.on('end', (p) => {
    console.log('Finished parsing the dBase file - numRow: ' + numRow);
});
 
parser.parse();

function doInsertRecord(record) {
    var seqNumberGest = record['@sequenceNumber'];
    var idFattura = record.NUMDOC;
    var annDoc = record.ANNDOC;
    var datDoc = record.DATDOC;
    var codCliente = record.CODCF;
    var totImp = record.TOTIMP;
    var totIVA = record.TOTIVA;
    var isDeleted = record['@deleted'];

    /*
    console.log("-idFattura: %d - addDoc: %s - datDoc: %s - codCliente: %d - totImp: %f - totIVA: %f - isDeleted:  %s", 
        idFattura, annDoc, datDoc, codCliente, totImp, totIVA, isDeleted);
    */
    
    // check if !isDeleted

    if(!isDeleted) {

        insertFatture( idFattura, seqNumberGest, annDoc, datDoc, codCliente, totImp, totIVA);

        /*

        getIfCodiceCliInAnagraficaClienti(codCliente).then(result => {
            if(!result) {
                console.log("COD_CLI: %d NOT FOUND", codCliente);
            } else {
                insertFatture( idFattura, seqNumberGest, annDoc, datDoc, codCliente, totImp, totIVA).catch(err=> {
                    console.log("--->> seqNumberGest %d - idFattura: %d - addDoc: %s - datDoc: %s - codCliente: %d - totImp: %f - totIVA: %f - isDeleted:  %s | err: %s", 
                        seqNumberGest, idFattura, annDoc, datDoc, codCliente, totImp, totIVA, isDeleted, err.detail);
                });
            }
        }).catch(err=> {
            console.log("--->> idFattura: %d - addDoc: %s - datDoc: %s - codCliente: %d - totImp: %f - totIVA: %f - isDeleted:  %s | err: %s", 
                idFattura, annDoc, datDoc, codCliente, totImp, totIVA, isDeleted, err.detail);
        });

        */

    }

}

function insertFatture( idFattura, seqNumberGest, annDoc, datDoc, codCliente, totImp, totIva) {

    

}