'use strict';
const { V8AtlasInventoryProvider } = require('./inventory');
const { V8AtlasLeadProvider } = require('./leads');

module.exports = {
  inventoryProvider: new V8AtlasInventoryProvider(),
  leadProvider:      new V8AtlasLeadProvider(),
  sourceType:        'V8ATLAS',
};
