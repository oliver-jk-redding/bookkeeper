#!/usr/bin/env node

var fs    = require('fs');
var chalk = require('chalk');
var map   = require('./budget-map.json');

var numItems = 0;

var init = function(fileName) {
  fileName = fileName.trim();
  if(fileName.match(/(\.csv)+$/i)) {
    fs.readFile(fileName, function(err,data) {
      if(err) error(err);
      else doCSV(data, fileName);
    })
  }
  else error(fileName+' is not a CSV file.');
};

var doCSV = function(data, fileName) {
  data = data.toString();
  data = data.split('\n');

  var headers = data.shift();
  var foundItems = new Array();

  for(var i = 0; i < data.length; i++) {
    var item = objectifyItem(data[i], headers);
    if(item) foundItems.push(findItem(item));
  }

  var sortedItems = sortItems(foundItems);
  sortedItems = csveeifyItems(sortedItems, []);
  sortedItems.unshift(headers);
  sortedItems = sortedItems.join('\n');

  fileName = fileName.replace('.csv', '-sorted.csv');
  fs.writeFile(fileName, sortedItems, function(err) {
    if(err) error(err);
    else log('Saved as ' + fileName);
  });
}

var objectifyItem = function(item, headers) {
  if(item.length == 0) return false;

  item     = item.split(',');
  headers  = headers.split(',');
  numItems = headers.length;
  itemObj  = new Object();

  for(var i = 0; i < item.length; i++) {
    itemObj[headers[i]] = item[i];
  }

  return itemObj;
}

var findItem = function(item) {
  var location = searchForCategory(item, map);
  if(location) return location;
  else return { 'Unsorted': [item] };
}

var searchForCategory = function(item, map) {
  var itemName = item['Transaction Description'];
  var found    = false;

  if(map.constructor == Array) {
    for(var i = 0; i < map.length; i++) {
      var regex = new RegExp(map[i].replace(/[\-\/\\\^\$\*\+\?\.\(\)\|\[\]\{\}]/g, '\\$&'), 'i');
      if(itemName.match(regex)) return [item];
    }
  }
  else {
    for(var prop in map) {
      var found = searchForCategory(item, map[prop]);
      if(found) return { [prop]: found };
    }
  }

  return found;
}

var sortItems = function(items) {
  var sortedItems = new Object();
  for(var i = 0; i < items.length; i++) {
    sortedItems = sort(sortedItems, items[i]);
  }
  return sortedItems;
}

var sort = function(items, item) {
  for(var prop in items) {
    if(prop == first(item)) {
      if(items[prop].constructor == Array) {
        items[prop].push(item[prop][0]);
        return items;
      }
      items[prop] = sort(items[prop], item[prop]);
      return items;
    }
  }
  items[first(item)] = item[first(item)];
  return items;
}

var first = function(obj) {
  return Object.keys(obj)[0];
}

var csveeifyItems = function(sortedItems, output) {
  if(sortedItems.constructor == Array) {
    for(var i = 0; i < sortedItems.length; i++) {
      var csvItem = csveeifyItem(sortedItems[i]);
      output.push(csvItem);
    }
    output.push(addEmptyLine());
    return output;
  }
  for(var prop in sortedItems) {
    var csvProp = csveeifyProp(prop);
    output.push(csvProp);
    csveeifyItems(sortedItems[prop], output);
  }
  return output;
}

var csveeifyItem = function(item) {
  var csvItem = '';
  for(var prop in item) {
    csvItem += item[prop] + ',';
  }
  return csvItem.slice(0,-1);
}

var csveeifyProp = function(prop) {
  var i = 0;
  while(i < numItems - 1) {
    prop += ',';
    i++
  }
  return prop;
}

var addEmptyLine = function() {
  var line = '';
  var i = 0;
  while(i < numItems) {
    line += ',';
    i++
  }
  return line;
}

var error = function(err) {
  console.error(chalk.red("Error: ") + err);
}

var log = function(log) {
  console.log(chalk.green("Bookkeeper says: ") + log);
}

module.exports = init;