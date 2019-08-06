
const scoreKeyword = process.env.HUBOT_PLUSPLUS_KEYWORD || 'score|scores|karma';
const reasonConjunctions = process.env.HUBOT_PLUSPLUS_CONJUNCTIONS || 'for|because|cause|cuz|as|porque';

const votedObject = `((?:[\\w@.\-:\u3040-\u30FF\uFF01-\uFF60\u4E00-\u9FA0]+(?<![+-]))|(?:['"][^'"]*['"]))`
// allow for spaces after the thing being upvoted (@user ++)
const allowSpaceAfterObject = `\\s*`;
const operator = `(\\+\\+|--|—)`;
const reasonForVote = `(?:\\s+(?:${reasonConjunctions})\\s+(.+))?`;
const eol = `$`;

/**
 * botName score for user1
 */
function createAskForScoreRegExp() {
  return new RegExp(`(?:${scoreKeyword})\\s(\\w+\\s)?${votedObject}`, `i`);
}

/**
 * botName erase user1
 * botName erase user2 because they quit and i don't like quitters
 */
function createEraseUserScoreRegExp() {
  // from beginning of line
  const eraseClause = `(?:erase)`;

  return new RegExp(`${eraseClause}${allowSpaceAfterObject}${votedObject}${allowSpaceAfterObject}${reasonForVote}${eol}`, `i`);
}

/**
 * { user1, user2 }++
 * { user1, user2 }--
 */
function createMultiUserVoteRegExp() {
  // from beginning of line
  const beginningOfLine = `^`;
  // the thing being upvoted, which is any number of words and spaces
  const votedObject = `{(.*(,?))\\}`;
  // allow for spaces after the thing being upvoted (@user ++)
  const allowSpaceAfterObject = `\\s*`;
  
  return new RegExp(`${beginningOfLine}${votedObject}${allowSpaceAfterObject}${operator}${reasonForVote}${eol}`, `i`);
}

function cleanName(name) {
  if (name) {
    name = name.trim().toLowerCase();
    if (name.charAt(0) === ':') {
      name = (name.replace(/(^\s*['"@])|([,'"\s]*$)/gi, ''));
    } else {
      name = (name.replace(/(^\s*['"@])|([,:'"\s]*$)/gi, ''));
    }
  }
  return name;
}

/**
 * botName top 100
 * botName bottom 3
 */
function createTopBottomRegExp() {
  const topOrBottom = `(top|bottom)`;
  const digits = `(\\d+)`;
  return new RegExp(`${topOrBottom}${allowSpaceAfterObject}${digits}`, `i`);
}

/**
 * user1++ for being dope
 * user1-- cuz nope
 * billy @bob++
 */
function createUpDownVoteRegExp() {
  return new RegExp(`${votedObject}${allowSpaceAfterObject}${operator}${reasonForVote}${eol}`, `i`);
}

const helpers = {
  createAskForScoreRegExp, 
  createEraseUserScoreRegExp,
  createMultiUserVoteRegExp,
  cleanName,
  createTopBottomRegExp,
  createUpDownVoteRegExp,
  votedObject
};

module.exports = helpers;