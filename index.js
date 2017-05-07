#!/usr/bin/env node

var cli   = require('commander');
var init   = require('./functions.js')

cli
  .version('0.1.0')
  .command('summarise <csv-file>')
  .description('Summarise a CSV file of transactions for a budget.')
  .action(init);

cli.parse(process.argv);

if(cli.args.length === 0) cli.help();

