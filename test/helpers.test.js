const chai = require('chai');
const sinon = require('sinon');
chai.use(require('sinon-chai'));
const forEach = require('mocha-each');

const { expect } = chai;

const helpers = require('../src/helpers.js');


describe('Helpers', () => {
  describe('createAskForScoreRegExp', () => {
    it('should create a regexp', () => {
      expect(helpers.createAskForScoreRegExp()).to.be.a('RegExp');
    });

    it('should match a user asking for \'score for {name}\'', () => {
      expect(helpers.createAskForScoreRegExp().test('score for matt')).to.be.true;
    });

    it('should match a user asking for \'score {name}\'', () => {
      expect(helpers.createAskForScoreRegExp().test('score matt')).to.be.true;
    });

    it('should match a user asking for \'score with {name}\'', () => {
      expect(helpers.createAskForScoreRegExp().test('score with matt')).to.be.true;
    });
  });

  describe('createEraseUserScoreRegExp', () => {
  });

  describe('createMultiUserVoteRegExp', () => {
  });


  describe('cleanName', () => {
    forEach([
      ['@matt', 'matt'],
      ['hello @derp','hello @derp'],
      ['what', 'what'],
      ['', ''],
    ]).it('should clean %j of the @ sign and be %j if @ is the first char', (fullName, cleaned) => {
      expect(helpers.cleanName(fullName)).to.equal(cleaned);
    });
  });

  describe('createTopBottomRegExp', () => {
    forEach([
      ['top 10', 'top', '10'],
      ['bottom 5', 'bottom', '5']
    ])
    .it('should match %j', (requestForScores, topOrBottom, numberOfUsers) => {
      const topBottomRegExp = helpers.createTopBottomRegExp();
      expect(requestForScores.match(topBottomRegExp)).to.be.an('array');
      expect(requestForScores.match(topBottomRegExp).length).to.equal(3);
      expect(requestForScores.match(topBottomRegExp)).to.deep.equal([requestForScores, topOrBottom, numberOfUsers]);
    });
  });

  describe('createUpDownVoteRegExp', () => {
    forEach([
      ['@matt++', '@matt++', '@matt', '++', undefined],
      ['@matt++ cuz he is awesome', '@matt++ cuz he is awesome', '@matt', '++', 'he is awesome'],
      ['\'what are you doing\'--', '\'what are you doing\'--', '\'what are you doing\'', '--', undefined],
      ['you are the best matt--', 'matt--', 'matt', '--', undefined],
      ['\'you are the best matt\'--', '\'you are the best matt\'--', '\'you are the best matt\'', '--', undefined],
      ['you are the best matt++ cuz you started #matt-s', 'matt++ cuz you started #matt-s', 'matt', '++', 'you started #matt-s'],
    ]).
    it('should match \'%j\'', (fullText, firstMatch, name, operator, reason) => {
      const theRegexp = helpers.createUpDownVoteRegExp(); 
      expect(theRegexp).to.be.a('RegExp');
      expect(fullText.match(theRegexp)).to.be.an('array');
      expect(fullText.match(theRegexp).length).to.equal(4);
      expect(fullText.match(theRegexp)).to.deep.equal([firstMatch, name, operator, reason]);
    });
  });
});