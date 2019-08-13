const chai = require('chai');
const sinon = require('sinon');
chai.use(require('sinon-chai'));
const mongoUnit = require('mongo-unit');

const { expect } = chai;

const ScoreKeeper = require('../src/scorekeeper.js');

let robotStub = {};
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
    robotStub = {
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
    const url = await mongoUnit.start();
    scoreKeeper = new ScoreKeeper(robotStub, url);
    return await scoreKeeper.init();
  });

  beforeEach(async function () { return await mongoUnit.load(defaultData); });

  afterEach(async function () { return await mongoUnit.drop(); });

  describe('adding', () => {
    it('adds points to a user', async () => {
      const r = await scoreKeeper.add('to', 'from', 'room');
      expect(r[0]).to.equal(1);
    });

    it('adds points to a user for a reason', async () => {
      const r = await scoreKeeper.add('to', 'from', 'room', 'because points');
      expect(r).to.deep.equal([1, 1]);
    });

    it('does not allow spamming points', async () => {
      const r = await scoreKeeper.add('to', 'from', 'room', 'because points');
      const r2 = await scoreKeeper.add('to', 'from', 'room', 'because points');
      expect(r2).to.deep.equal([null, null]);
    });

    return it('adds more points to a user for a reason', async () => {
      let r = await scoreKeeper.add('to', 'from', 'room', 'because points');
      r = await scoreKeeper.add('to', 'another-from', 'room', 'because points');
      expect(r).to.deep.equal([2, 2]);
    });
  });

  describe('subtracting', () => {
    it('adds points to a user', async () => {
      const r = await scoreKeeper.subtract('to', 'from', 'room');
      expect(r[0]).to.equal(-1);
    });

    it('subtracts points from a user for a reason', async () => {
      const r = await scoreKeeper.subtract('to', 'from', 'room', 'because points');
      expect(r).to.deep.equal([-1, -1]);
    });

    it('does not allow spamming points', async () => {
      const r = await scoreKeeper.subtract('to', 'from', 'room', 'because points');
      const r2 = await scoreKeeper.subtract('to', 'from', 'room', 'because points');
      expect(r2).to.deep.equal([null, null]);
    });

    it('subtracts more points from a user for a reason', async () => {
      let r = await scoreKeeper.subtract('to', 'from', 'room', 'because points');
      r = await scoreKeeper.subtract('to', 'another-from', 'room', 'because points');
      expect(r).to.deep.equal([-2, -2]);
    });
  });

  describe('erasing', () => {
    it('erases a reason from a user', async () => {
      const p = await scoreKeeper.add('to', 'from', 'room', 'reason');
      expect(p).to.deep.equal([1, 1]);
      const r = await scoreKeeper.erase('to', 'from', 'room', 'reason');
      expect(r).to.deep.equal(true);
      const rs = scoreKeeper.reasonsForUser('to');
      expect(rs.reason).to.equal(undefined);
    });

    it('erases a user from the scoreboard', async () => {
      const p = await scoreKeeper.add('to', 'from', 'room', 'reason');
      expect(p).to.deep.equal([1, 1]);
      const r = await scoreKeeper.erase('to', 'from', 'room');
      expect(r).to.equal(true);
      const p2 = await scoreKeeper.scoreForUser('to');
      expect(p2).to.equal(0);
    });
  });

  describe('scores', () => {
    it('returns the score for a user', async () => {
      await scoreKeeper.add('to', 'from', 'room');
      const r = await scoreKeeper.scoreForUser('to');
      expect(r).to.equal(1);
    });

    it('returns the reasons for a user', async () => {
      await scoreKeeper.add('to', 'from', 'room', 'because points');
      const r = await scoreKeeper.reasonsForUser('to');
      expect(r).to.deep.equal({ 'because points': 1 });
    });
  });
});
