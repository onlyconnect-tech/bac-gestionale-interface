'use strict';

/*

require('yargs')
    .usage('$0 <cmd> [args]')
    .command('hello [name]', 'welcome ter yargs!', (yargs) => {
      console.log(yargs);  
      yargs.positional('name', {
        type: 'string',
        default: 'Cambi',
        describe: 'the name to say hello to'
      })
    }, function (argv) {
      console.log('hello', argv.name, 'welcome to yargs!')
    })
    .help()
    .argv

*/
    const argv = require('yargs')
    .usage('Usage: $0 option config_file \n e.g $0 -c config_file')
    .alias('c', 'config')
    .nargs('c', 1)
    .describe('c', 'Config file')
    // .demandOption(['c'])
    .help('h')
    .alias('h', 'help')
    .epilog('Copyright OnlyConnect 2018')
    .argv

    console.log(argv.c);