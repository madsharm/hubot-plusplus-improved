const chai = require('chai');
const sinon = require('sinon');
chai.use(require('sinon-chai'));
const forEach = require('mocha-each');

const { expect } = chai;

const helpers = require('../src/helpers.js');


describe('Helpers', () => {
  describe('cleanName', () => {
    forEach([
      ['@matt', 'matt'],
      ['hello @derp', 'hello @derp'],
      ['what', 'what'],
      ['', ''],
      ['name.hyphe-nated', 'name.hyphe-nated'],
      ['dot.name', 'dot.name']
    ]).it('should clean %j of the @ sign and be %j if @ is the first char', (fullName, cleaned) => {
      expect(helpers.cleanName(fullName)).to.equal(cleaned);
    });
  });

  describe('cleanAndEncodeReason', () => {
    forEach([
      ['You are the best!', new Buffer.from('you are the best!').toString('base64')],
      ['this.should.work', new Buffer.from('this.should.work').toString('base64')],
      ['      why are you    so good?!', new Buffer.from('why are you    so good?!').toString('base64')],
      ['HELLO', new Buffer.from('hello').toString('base64')],
      ['', undefined],
      [undefined, undefined],
    ]).it('should clean the reason %j and base 64 encode it to %j', (reason, encoded) => {
      expect(helpers.cleanAndEncode(reason)).to.equal(encoded);
    });
  });

  describe('decodeReason', () => {
    forEach([
      [new Buffer.from('you are the best!').toString('base64'), 'you are the best!'],
      [new Buffer.from('this.should.work').toString('base64'), 'this.should.work'],
      [new Buffer.from('why are you    so good?!').toString('base64'), 'why are you    so good?!'],
      [new Buffer.from('hello').toString('base64'), 'hello'],
      [undefined, undefined],
      [undefined, undefined, undefined],
    ]).it('should decode the reason %j from base 64 encode to %j', (encoded, cleaned) => {
      expect(helpers.decode(encoded)).to.equal(cleaned);
    });
  });

  describe('createAskForScoreRegExp', () => {
    forEach([
      ['score for matt', 'for ', 'matt'],
      ['score matt', undefined, 'matt'],
      ['score with matt', 'with ', 'matt'],
      ['scores for matt', 'for ', 'matt'],
      ['karma phil', undefined, 'phil'],
      ['score such.a.complex-name-hyphens', undefined, 'such.a.complex-name-hyphens']
    ])
      .it('should match the search %j', (searchQuery, middleMatch, name) => {
        const scoreMatchRegExp = helpers.createAskForScoreRegExp();
        expect(scoreMatchRegExp).to.be.a('RegExp');
        expect(searchQuery.match(scoreMatchRegExp)).to.be.an('array');
        expect(searchQuery.match(scoreMatchRegExp).length).to.equal(3);
        expect(searchQuery.match(scoreMatchRegExp)).to.deep.equal([searchQuery, middleMatch, name]);
      });
  });

  describe('createEraseUserScoreRegExp', () => {
    forEach([
      ['erase @matt cuz he is bad', '@matt', 'he is bad'],
      ['erase @frank', '@frank', undefined],
    ]).it('%j should match the erase user regexp', (searchQuery, user, reason) => {
      const eraseUserScoreRegExp = helpers.createEraseUserScoreRegExp();
      expect(eraseUserScoreRegExp).to.be.a('RegExp');
      expect(searchQuery.match(eraseUserScoreRegExp)).to.be.an('array');
      expect(searchQuery.match(eraseUserScoreRegExp).length).to.equal(3);
      expect(searchQuery.match(eraseUserScoreRegExp)).to.deep.equal([searchQuery, user, reason]);
    });
  });

  describe('createMultiUserVoteRegExp', () => {
    forEach([
      ['{@matt, @phil}++', '{@matt, @phil}++', '@matt, @phil', '++', undefined],
      ['{@matt, @phil}-- cuz they are the best team', '{@matt, @phil}-- cuz they are the best team', '@matt, @phil', '--', 'they are the best team'],
      ['{@user, @phil user}--', '{@user, @phil user}--', '@user, @phil user', '--', undefined],
    ])
      .it('should match \'%j\'', (fullText, firstMatch, names, operator, reason) => {
        const dummy = '';
        const multiUserVoteRegExp = helpers.createMultiUserVoteRegExp();
        expect(multiUserVoteRegExp).to.be.a('RegExp');
        expect(fullText.match(multiUserVoteRegExp)).to.be.an('array');
        expect(fullText.match(multiUserVoteRegExp).length).to.equal(5);
        expect(fullText.match(multiUserVoteRegExp)).to.deep.equal([firstMatch, names, dummy, operator, reason]);
      });
  });

  describe('createTopBottomRegExp', () => {
    forEach([
      ['top 10', 'top', '10'],
      ['bottom 5', 'bottom', '5'],
    ])
      .it('should match %j', (requestForScores, topOrBottom, numberOfUsers) => {
        const topBottomRegExp = helpers.createTopBottomRegExp();
        expect(topBottomRegExp).to.be.a('RegExp');
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
      ['you are the best matt++ cuz you started #matt-s', 'matt++ cuz you started #matt-s', 'matt', '++', 'you started #matt-s'],
      ['such.a.complex-name-hyphens++', 'such.a.complex-name-hyphens++', 'such.a.complex-name-hyphens', '++', undefined]
    ])
      .it('should hear name [%3$s] up/down [%4$s] with reason [%5$s]', (fullText, firstMatch, name, operator, reason) => {
        const upVoteOrDownVoteRegExp = helpers.createUpDownVoteRegExp();
        expect(upVoteOrDownVoteRegExp).to.be.a('RegExp');
        expect(fullText.match(upVoteOrDownVoteRegExp)).to.be.an('array');
        expect(fullText.match(upVoteOrDownVoteRegExp).length).to.equal(4);
        expect(fullText.match(upVoteOrDownVoteRegExp)).to.deep.equal([firstMatch, name, operator, reason]);
      });
  });

  // This method expects base64 encoded reasons but we are stubbing out the decode method
  describe('getMessageForNewScore', () => {
    before(() => {
      const mockHelpers = sinon.stub(helpers, 'decode');
      mockHelpers.returnsArg(0);
    });
    forEach([
      [undefined, undefined, undefined, undefined, undefined, ''],
      [1, 'matt', undefined, undefined, undefined, 'matt has 1 point.'],
      [2, 'matt', undefined, undefined, undefined, 'matt has 2 points.'],
      [100, 'matt', undefined, undefined, undefined, ':100: matt has 100 points :100:'],
      [1000, 'matt', undefined, undefined, undefined, ':1000: matt has 1000 points :1000:'],
      [300, 'matt', undefined, undefined, undefined, ':300: matt has 300 points :300:'],
      [45, 'matt', '++', 'winning', 1, 'matt has 45 points, 1 of which is for winning.'],
      [1, 'matt', '++', 'cool runnings!', 1, 'matt has 1 point for cool runnings!.'],
      [1, 'matt', '++', 'cool runnings!', 99, 'matt has 1 point, 99 of which are for cool runnings!.'],// this doesn't make sense but the message doesn't care
      [145, 'matt', '++', 'cool runnings!', 99, 'matt has 145 points, 99 of which are for cool runnings!.'],
      [200, 'matt', '++', 'cool runnings!', 99, ':200: matt has 200 points :200:, 99 of which are for cool runnings!.'],
      [28, 'heat', '++', undefined, 0, `podríamos subir un gradin la calefa???\nLa temperatura debería estar en 28 ℃.`],
      [28, 'heat', '--', undefined, 0, `podríamos bajar un gradin la calefa???\nLa temperatura debería estar en 28 ℃.`],
    ])
    .it('should take the score %j, name %j, operator %j, reason %j, reason score %j and print %j',
      (score, name, messageOperator, reason, reasonScore, expectedMessage) => {
        const message = helpers.getMessageForNewScore(score, name, messageOperator, reason, reasonScore);
        expect(message).to.equal(expectedMessage);
    });
  });
});
