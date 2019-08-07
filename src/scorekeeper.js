const MongoClient = require('mongodb').MongoClient;
const scoresDocumentName = 'scores';
const logDocumentName = 'scoreLog';

class ScoreKeeper {
  constructor(robot, uri) {
    this.uri = uri;
    this.robot = robot;
    this.db;
  }

  async init() {
    const client = new MongoClient(this.uri, { useNewUrlParser: true });
    const connection = await client.connect();
    this.db = connection.db();
  }

  async getDb() {
    if (!this.db) {
      await this.init();
    }
    return this.db;
  }

  async getUser(user) {
    this.robot.logger.debug(`trying to find user ${user}`);
    const db = await this.getDb();
    const dbUser = await db.collection(scoresDocumentName).findOneAndUpdate(
      { 'name': user },
      {
        $setOnInsert: {
          name: user,
          score: 0,
          reasons: {}
        }
      }, 
      { 
        returnOriginal: false,
        upsert: true 
      });
    
    return dbUser.value;
  }

  async saveUser(user, from, room, reason, incrementObject) {
    const db = await this.getDb();
    const result = await db.collection(scoresDocumentName)
      .findOneAndUpdate(
        { 'name': user.name }, 
        { $inc: incrementObject }, 
        { returnOriginal: false, upsert: true });
    const updatedUser = result.value;

    this.saveScoreLog(user.name, from, room, reason);
    
    this.robot.logger.debug(`Saving user original: [${user.name}: ${user.score} ${user.reasons[reason] || "none"}], new [${updatedUser.name}: ${updatedUser.score} ${updatedUser.reasons[reason] || "none"}]`);

    return [ updatedUser.score, updatedUser.reasons[reason] || "none" ];
  }

  async add(user, from, room, reason) {
    user = await this.getUser(user);
    if (await this.validate(user, from)) {
      
      let incScoreObj = { score: 1 };
      if (reason) {
        incScoreObj = {
          score: 1,
          [`reasons.${reason}`]: 1
        };
      }

      return await this.saveUser(user, from, room, reason, incScoreObj);
    } else {
      return [null, null];
    }
  }

  async subtract(user, from, room, reason) {
    user = await this.getUser(user);
    if (await this.validate(user, from)) {
      
      let decScoreObj = { score: -1 };
      if (reason) {
        decScoreObj = {
          score: -1,
          [`reasons.${reason}`]: -1
        };
      }

      return await this.saveUser(user, from, room, reason, decScoreObj);
    } else {
      return [null, null];
    }
  }

  async erase(user, from, room, reason) {
    user = await this.getUser(user);

    const db = await this.getDb();

    if (reason) {
      await db.collection(scoresDocumentName)
        .drop({ name: [user], reasons: [reason] }, { justOne: true });
      return true;
    } else {
      await db.collection(scoresDocumentName)
        .drop({ name: [user] });
      return true;
    }

    return false;
  }

  async scoreForUser(user) {
    user = await this.getUser(user);
    return user.score;
  }

  async reasonsForUser(user) {
    user = await this.getUser(user);
    return user.reasons;
  }

  async saveScoreLog(user, from, room, reason) {
    const db = await this.getDb();
    db.collection(logDocumentName).insertOne({
      'from': from,
      'to': user,
      'date': new Date()
    });
  }

  last(room) {
    /*const last = this.storage.last[room];
    if (typeof last === 'string') {
      return [last, ''];
    } else {
      return [last.user, last.reason];
    }*/
  }

  async isSpam(user, from) {
    this.robot.logger.debug(`spam check`);
    const db = await this.getDb();
    const previousScoreExists = await db.collection(logDocumentName)
      .find({
        'from': from,
        'to': user }).count(true);
    this.robot.logger.debug(`spam check result`, previousScoreExists);
    if (previousScoreExists) {
      this.robot.logger.debug(`spam check if true`, true);
      return true;
    }

    return false;
  }

  async validate(user, from) {
    return (user.name !== from) && !await this.isSpam(user.name, from);
  }

  async top(amount) {
    const db = await this.getDb();
    const results = await db.collection(scoresDocumentName)
      .find()
      .sort({ score: -1 })
      .limit(amount)
      .toArray();

    this.robot.logger.debug(`Trying to find top scores`);

    return results;
  }

  async bottom(amount) {
    const db = await this.getDb();
    const results = await db.collection(scoresDocumentName)
      .find({})
      .sort({ score: 1 })
      .limit(amount)
      .toArray();
    
    this.robot.logger.debug(`Trying to find top scores`);
    
    return results;
  }

  normalize(fn) {
    /*const scores = {};

    _.each(this.storage.scores, function(score, name) {
      scores[name] = fn(score);
      if (scores[name] === 0) { return delete scores[name]; }
    });

    this.storage.scores = scores;
    return this.robot.brain.save();*/
  }
}

module.exports = ScoreKeeper;