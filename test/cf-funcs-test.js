const assert = require('assert');
const sinon = require('sinon');
const funcs = require('../lib/cf-funcs');
const spylogger = require('./spy-logger');
const STACK_NAME = 'mock-stack'

var cloudFormation = require('./mock-aws');

describe('cf-funcs', function() {
  before(function() {
    process.env.AWS_CF_MONITOR_DELAY = '1'
  })

  beforeEach(function() {
    describeStackEventsAsyncStub = sinon.stub(cloudFormation, 'describeStackEventsAsync');
    spylogger.reset();
  })

  afterEach(function() {
    describeStackEventsAsyncStub.restore();
  })

  Object.getOwnPropertyNames(funcs).forEach(function(func){
    describe(`#${func}`, function(){
      const action = func.replace('Stack', '').toUpperCase();
      it('should wait for completion and log events', function() {
        const inProgressEvent = {
          StackEvents: [
            {
              EventId: '1a2b3c4d',
              StackName: STACK_NAME,
              LogicalResourceId: STACK_NAME,
              ResourceType: 'AWS::CloudFormation::Stack',
              Timestamp: new Date(),
              ResourceStatus: `${action}_IN_PROGRESS`
            }
          ]
        };
        const completedEvent = {
          StackEvents: [
            {
              EventId: '1e2f3g4h',
              StackName: STACK_NAME,
              LogicalResourceId: STACK_NAME,
              ResourceType: 'AWS::CloudFormation::Stack',
              Timestamp: new Date(),
              ResourceStatus: `${action}_COMPLETE`
            }
          ]
        };
        describeStackEventsAsyncStub.onCall(0).returns(Promise.resolve(inProgressEvent));
        describeStackEventsAsyncStub.onCall(1).returns(Promise.resolve(completedEvent));
        return funcs[func]({StackName: STACK_NAME}, cloudFormation)
          .then(function(finalStatus){
            assert.equal(finalStatus, `${action}_COMPLETE`);
            assert.equal(describeStackEventsAsyncStub.callCount, 2);
            assert.ok(describeStackEventsAsyncStub.calledWithExactly({StackName: STACK_NAME}));
            assert.equal(cloudFormation[`${func}Async`].callCount, 1);
            assert.ok(cloudFormation[`${func}Async`].calledWithExactly({StackName: STACK_NAME}));
            // 1 INFO at the beginning and the end, then 1 for each event
            assert.equal(spylogger.callCount, 4);
          });
      });
    });
  });

});
