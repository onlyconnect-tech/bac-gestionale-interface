ERROR INSERTING: Error: INVALID RECORD: [object Object]
    at /home/massimo/workspace/bac-gestionale-interface/monitor-gestionale-anagrafica.js:159:27
    at new Promise (<anonymous>)
    at doInsertRecord (/home/massimo/workspace/bac-gestionale-interface/monitor-gestionale-anagrafica.js:125:12)
    at SafeSubscriber._cca‍.r.observable.subscribe [as _next] (/home/massimo/workspace/bac-gestionale-interface/monitor-gestionale-anagrafica.js:32:12)
    at SafeSubscriber.__tryOrUnsub (/home/massimo/workspace/bac-gestionale-interface/node_modules/rxjs/internal/Subscriber.js:222:16)
    at SafeSubscriber.next (/home/massimo/workspace/bac-gestionale-interface/node_modules/rxjs/internal/Subscriber.js:160:22)
    at Subscriber._next (/home/massimo/workspace/bac-gestionale-interface/node_modules/rxjs/internal/Subscriber.js:93:26)
    at Subscriber.next (/home/massimo/workspace/bac-gestionale-interface/node_modules/rxjs/internal/Subscriber.js:68:18)
    at Parser.parser.on (/home/massimo/workspace/bac-gestionale-interface/monitor-gestionale-anagrafica.js:67:19)
    at Parser.emit (events.js:180:13)


ERROR INSERTING: { MongoError: Topology was destroyed
    at initializeCursor (/home/massimo/workspace/bac-gestionale-interface/node_modules/mongodb-core/lib/cursor.js:766:25)
    at nextFunction (/home/massimo/workspace/bac-gestionale-interface/node_modules/mongodb-core/lib/cursor.js:591:12)
    at Cursor.next (/home/massimo/workspace/bac-gestionale-interface/node_modules/mongodb-core/lib/cursor.js:833:3)
    at Cursor._next (/home/massimo/workspace/bac-gestionale-interface/node_modules/mongodb/lib/cursor.js:211:36)
    at nextObject (/home/massimo/workspace/bac-gestionale-interface/node_modules/mongodb/lib/operations/cursor_ops.js:179:10)
    at next (/home/massimo/workspace/bac-gestionale-interface/node_modules/mongodb/lib/operations/cursor_ops.js:158:3)
    at executeOperation (/home/massimo/workspace/bac-gestionale-interface/node_modules/mongodb/lib/utils.js:420:24)
    at Cursor.next (/home/massimo/workspace/bac-gestionale-interface/node_modules/mongodb/lib/cursor.js:253:10)
    at findOne (/home/massimo/workspace/bac-gestionale-interface/node_modules/mongodb/lib/operations/collection_ops.js:567:10)
    at /home/massimo/workspace/bac-gestionale-interface/node_modules/mongodb/lib/utils.js:437:24 name: 'MongoError', [Symbol(mongoErrorContextSymbol)]: {}}


