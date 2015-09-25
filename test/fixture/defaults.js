/*
 * measured-elasticsearch
 *
 * Copyright (c) 2015 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

exports.index     = 'metrics-1970.01';
exports.timestamp = '1970-01-01T00:00:00.000Z';

function header(type) {
  return {
    index : { _type : type}
  };
}

exports.headerCounter   = header('counter');
exports.headerTimer     = header('timer');
exports.headerMeter     = header('meter');
exports.headerHistogram = header('histogram');
exports.headerGauge     = header('gauge');
