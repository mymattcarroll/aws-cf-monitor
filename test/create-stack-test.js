const assert = require('assert');
const CF = require('./mock-aws');
const createStackFactory = require('../lib/create-stack');
const spylogger = require('./spy-logger');

describe('#create-stack', function(){
  var createStack;

  before(function() {
    createStack = createStackFactory(spylogger.logger);
  });

  beforeEach(function() {
    spylogger.spy.reset();
  })

  it('should log', function() {
    return createStack({StackName: '1'})
      .then(function(){
        // 1 INFO stmnt + 2 INFO stmnt per event
        assert.equal(3, spylogger.spy.callCount);
      });
  })
});
