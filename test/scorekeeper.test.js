const chai = require('chai');
const sinon = require('sinon');
chai.use(require('sinon-chai'));
const forEach = require('mocha-each');

const { expect } = chai;

const MongoClient = require('mongodb').MongoClient;
const mongoUnit = require('mongo-unit');

const helpers = require('../src/helpers');
const ScoreKeeper = require('../src/scorekeeper.js');

const peerFeedbackUrl = `'Small Improvements' (company.small-improvements.com)`;
const robotStub = {
  brain: {
    data: { },
    on() {},
    emit() {},
    save() {},
  },
  logger: {
    debug() {},
  },
};
const defaultData = {
  scores: [
    {},
  ],
  scoreLog: [
    {},
  ],
};


describe('ScoreKeeper', function() {
  let scoreKeeper;
  before(async function () {
    const url = await mongoUnit.start();
    scoreKeeper = new ScoreKeeper(robotStub, url, peerFeedbackUrl);
    return await scoreKeeper.init();
  });

  beforeEach(async function () { return await mongoUnit.load(defaultData); });

  afterEach(async function () { return await mongoUnit.drop(); });

  describe('adding', async () => {
    forEach([
      [{}, 'to', 'from', 'room', undefined, [1, 'none']],
      [{}, 'to', 'from', 'room', 'because points', [1, 1]],
      [{}, 'to.name-hyphenated', 'from', 'room', undefined, [1, 'none']]
    ])
    .it('should adds points to [%2$s] with reason [%5$s] and return [%6$s]', async (msg, to, from, room, reason, expectedResult) => {
      const beforeScore = await scoreKeeper.scoreForUser(to);
      expect(beforeScore).to.be.equal(0);
      const r = await scoreKeeper.add(msg, to, from, room, reason);
      expect(r).to.be.an('array');
      expect(r).to.deep.equal(expectedResult);
      const score = await scoreKeeper.scoreForUser(to);
      expect(score).to.be.equal(1);
    });

    it('does not allow spamming points', async () => {
      const to = 'mahMainBuddy';
      //empty score to start
      const beforeScore = await scoreKeeper.scoreForUser(to);
      expect(beforeScore).to.be.equal(0);
      const r = await scoreKeeper.add({}, to, 'from', 'room', 'because points');
      expect(r).to.be.an('array');
      expect(r).to.deep.equal([1, 1]);

      //score added
      const afterScore = await scoreKeeper.scoreForUser(to);
      expect(afterScore).to.be.equal(1);

      //Try to spam
      const r2 = await scoreKeeper.add({}, to, 'from', 'room', 'because points');
      expect(r2).to.deep.equal([null, null]);
      const spamScore = await scoreKeeper.scoreForUser(to);
      expect(spamScore).to.not.equal(2);
    });

    it('should call for a special reponse if user his 10 "gives"', async () => {
      const client = new MongoClient(mongoUnit.getUrl(), { useNewUrlParser: true });
      const connection = await client.connect();
      const db = connection.db();
      const encodedName = helpers.cleanAndEncode('derp');
      db.collection('scores').insertOne({ name: 'matt', score: 1, reasons: {}, pointsGiven: { [encodedName]: 9 } });
      const msgObj = { reply: () => { }};
      const msgSpy = sinon.spy(msgObj, 'reply');
      const r = await scoreKeeper.add(msgObj, 'derp', 'matt', 'room', 'because points');
      expect(r).to.be.an('array');
      expect(r).to.deep.equal([1, 1]);
      expect(msgSpy.called).to.equal(true);
      expect(msgSpy).to.have.been.calledWith(`Looks like you've given derp quite a few points, maybe you should look at submitting a ${peerFeedbackUrl}`);
    });
    

    return it('adds more points to a user for a reason', async () => {
      let r = await scoreKeeper.add({}, 'to', 'from', 'room', 'because points');
      r = await scoreKeeper.add({}, 'to', 'another-from', 'room', 'because points');
      expect(r).to.deep.equal([2, 2]);
    });
  });

  describe('subtracting', () => {
    it('adds points to a user', async () => {
      const r = await scoreKeeper.subtract({}, 'to', 'from', 'room');
      expect(r[0]).to.equal(-1);
    });

    it('subtracts points from a user for a reason', async () => {
      const r = await scoreKeeper.subtract({}, 'to', 'from', 'room', 'because points');
      expect(r).to.deep.equal([-1, -1]);
    });

    it('does not allow spamming points', async () => {
      const r = await scoreKeeper.subtract({}, 'to', 'from', 'room', 'because points');
      const r2 = await scoreKeeper.subtract({}, 'to', 'from', 'room', 'because points');
      expect(r2).to.deep.equal([null, null]);
    });

    it('subtracts more points from a user for a reason', async () => {
      let r = await scoreKeeper.subtract({}, 'to', 'from', 'room', 'because points');
      r = await scoreKeeper.subtract({}, 'to', 'another-from', 'room', 'because points');
      expect(r).to.deep.equal([-2, -2]);
    });
  });

  describe('erasing', () => {
    it('erases a reason from a user', async () => {
      const p = await scoreKeeper.add({}, 'to', 'from', 'room', 'reason');
      expect(p).to.deep.equal([1, 1]);
      const r = await scoreKeeper.erase('to', 'from', 'room', 'reason');
      expect(r).to.deep.equal(true);
      const rs = scoreKeeper.reasonsForUser('to');
      expect(rs.reason).to.equal(undefined);
    });

    it('erases a user from the scoreboard', async () => {
      const p = await scoreKeeper.add({}, 'to', 'from', 'room', 'reason');
      expect(p).to.deep.equal([1, 1]);
      const r = await scoreKeeper.erase('to', 'from', 'room');
      expect(r).to.equal(true);
      const p2 = await scoreKeeper.scoreForUser('to');
      expect(p2).to.equal(0);
    });
  });

  describe('scores', () => {
    it('returns the score for a user', async () => {
      await scoreKeeper.add({}, 'to', 'from', 'room');
      const r = await scoreKeeper.scoreForUser('to');
      expect(r).to.equal(1);
    });

    it('returns the reasons for a user', async () => {
      await scoreKeeper.add({}, 'to', 'from', 'room', 'because points');
      const r = await scoreKeeper.reasonsForUser('to');
      expect(r).to.deep.equal({ 'because points': 1 });
    });
  });
});
