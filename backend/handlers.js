const { encodeId, decodeId } = require('./../.env');
const validations = require('./validations');
const actions = require('./actions');
const fetchers = require('./fetchers');
const log = require('./log');
const MC = require('maptor-consumer');

const decodeIds = (obj, idNames) => 
  idNames.reduce((res, idName) => {
      if(res[idName] !== undefined) {
        res[idName] = decodeId(res[idName])
      }

      return res;
  }, obj);

// each promiseCreator is either an array or a function returning an array.
// the next argument will not be evaluated unless all previous arguments have resolved
const validateAll = (...promiseCreators) => {
  let promise = Promise.resolve();

  for(let promiseCreator of promiseCreators) {
    promise = promise.then(() => Promise.all(
      typeof promiseCreator === 'function' ?
        promiseCreator() :
        promiseCreator
    ));
  }

  return promise;
};
const handleError = (res, error) => {
  res.json({ error });
}
const handleInternal = (res, error) => {
  res.json({ error: 'internal error' });
  log(error, { type: 'error' });
}
const handleSuccess = (res, data) => {
  res.json({ success: true, data });
}

/**
 *
 * Here's what a generic handler looks like
 *
 * ...
 * subject: {
 *  ...
 *  handler(req, res) {
 *    const { basicInfo } = decodeIds(req.params, ['propertyNameWithId']);
 *    const { advancedInfo } = decodeIds(req.body, ['thingWithId']);
 *    const { sessionInfo } = req.session;
 *
 *    validateAll([
 *      validations.subject.someValidation({ someInfo }),
 *      // this will run in parallel with all the ones in this array
 *    ], () => [
 *      // this will run after the ones in the previous array,
 *      // this will in parallel with the others in this array
 *      // ...
 *    ], () => [
 *      // and so on
 *    ])
*        // this will run if all validations succeeded
 *      .then(() => {
 *        // you either have an action or a fetch
 *        // actions have side effects and shouldn't return anything
 *        actions.subject.action({ moreInfo })
 *          // this will run if the action has gone through
 *          .then(() => { handleSuccess(res) })
 *          // this will run if there was a querying error
 *          // ideally it should NEVER run
 *          .catch((error) => { handleInternal(res, error) });
 *
 *        // fetchers are pure and need to return data
 *        fetchers.subject.fetch({ moreInfo })
 *          // this will run if the fetch has gone through
 *          .then((data) => { handleSuccess(res, MC.map(data,
 *            // this allows you to easily see what the API will return
 *            {
 *              someString: String,
 *              someId: encodeId
 *              ...
 *            }))
 *          })
 *          // this will run if there was a querying error
 *          // ideally it should NEVER run
 *          .catch((error) => { handleInternal(res, error) });
 *      })
 *      // this will run if any of the validations failed
 *      // it's ok and EXPECTED if this run. It's the user's fault
 *      .catch((error) => { handleError(res, error) });
 *
 *  }
 *  ...
 * }
 * ...
 *
 */

module.exports = {
  
  user: {
    create(req, res) {
      const { name, password } = req.body;
      const { lastCreate } = req.session;
      
      validateAll([
        validations.session.debounceUserCreate({ lastCreate }) 
      ], () => [
        validations.user.nameMeetsPolicy({ name }),
        validations.user.passwordMeetsPolicy({ password }),
        validations.user.nameNotExists({ name })
      ])
        .then(() => {
          actions.user.create({ name, password })
            .then(() => { 
              req.session.lastCreate = Date.now();
              handleSuccess(res);
            })
            .catch((error) => { handleInternal(res, error) });
        })
        .catch((error) => { handleError(res, error) });
    },

    login(req, res) {
      const { name, password } = req.body;

      validateAll([
        validations.user.nameExists({ name })
      ], () => [
        validations.user.passwordMatchesName({ password, name })
      ])
        .then(() => {
          fetchers.user.getIdFromName({ name })
            .then((id) => {
              req.session.userId = id;
              req.session.authenticated = true;
              handleSuccess(res);
            })
            .catch((error) => { handleInternal(res, error) });
        })
        .catch((error) => { handleError(res, error) });
    },

    edit(req, res) {
      const { name, password, profileUrl, description } = req.body;
      const { userId, authenticated } = req.session;

      validateAll([
        validations.session.isAuthenticated({ authenticated })
      ], () => {
        const promises = [];

        if(name) {
          promises.push(
            validations.user.nameNotExists({ name }),
            validations.user.nameMeetsPolicy({ name })
          );
        }
        if(password) {
          promises.push(
            validations.user.passwordMeetsPolicy({ password })
          );
        }
        if(profileUrl) {
          promises.push(
            validations.user.profileUrlMeetsPolicy({ profileUrl })
          );
        }
        if(description) {
          promises.push(
            validations.user.descriptionMeetsPolicy({ description })
          );
        }

        return promises
      })
        .then(() => {
          actions.user.edit({ id: userId, name, password, profileUrl, description })
            .then(() => { handleSuccess(res) })
            .catch((error) => { handleInternal(res, error) });
        })
        .catch((error) => { handleError(res, error) });
    },

    changeRelationship(req, res) {
      const { targetId } = decodeIds(req.params, ['targetId']);
      const { following, blocking, muting } = req.body;
      const { userId, authenticated } = req.session;

      const relationships = { following, blocking, muting };

      validateAll([
        validations.session.isAuthenticated({ authenticated })
      ], () => [
        validation.user.idExists({ targetId }),
      ], () => [
        validation.user.relationshipsNotSame({ originId: userId, relationships, targetId })
      ], () => {
        const promises = [];

        if(following) {
          promises.push(
            validations.user.notBlocking({ targetId, originId: userId })
          );
        }

        return promises;
      })
        .then(() => {
          actions.user.changeRelationships({ relationships, originId, targetId })
            .then(() => { handleSuccess(res) })
            .catch((error) => { handleInternal(res, error) });
        })
        .catch((error) => { handleError(res, error) });
    },

    getBase(req, res) {
      const { id } = decodeIds(req.params, ['id']);

      validateAll([
        validations.user.idExists({ id })
      ])
        .then(() => {
          fetchers.user.getPublic({ id })
            .then((data) => { handleSuccess(res, MC.map(data, 
              {
                profileUrl: String,
                description: String,
                followerCount: Number,
                followingCount: Number,
                name: String
              })) 
            })
            .catch((error) => { handleInternal(res, error) });
        })
        .catch((error) => { handleError(res, error) });
      
    }
  },

  twat: {
    create(req, res) {
      const { content, parentId } = decodeIds(req.body, ['parentId']);
      const { userId, authenticated } = req.session;

      validateAll([
        validations.session.isAuthenticated({ authenticated })
      ], () => [
        validations.twat.contentMeetsPolicy({ content }),
        validations.twat.idExistsOrUndefined({ id: parentId })
      ])
        .then(() => {
          actions.twat.create({ content, parentId, authorId: userId })
            .then(() => { handleSuccess(res) })
            .catch((error) => { handleInternal(res, error) });
        })
        .catch((error) => { handleError(res, error) });
    },

    getBase(req, res) {
      const { id } = decodeIds(req.params, ['id']);

      validateAll([
        validations.twat.idExists({ id })
      ])
        .then(() => {
          fetchers.twat.getPublic({ id })
            .then((data) => { handleSuccess(res, MC.map(data, 
              {
                id: encodeId,
                content: String,
                twatbackCount: Number,
                shoutCount: Number,
                responseCount: Number,
                parentId: encodeId,
                author: {
                  id: encodeId,
                  profileUrl: String,
                  description: String,
                  followerCount: Number,
                  followingCount: Number,
                  name: String
                }
              }))
            })
            .catch((error) => { handleInternal(res, error) });
        })
        .catch((error) => { handleError(res, error) });
    },

    getTimeline(req, res) {
      const { offset, count } = req.params;
      const { authenticated, userId } = req.session;

      validateAll([
        validations.session.isAuthenticated({ authenticated }),
        validations.twat.offsetMeetsPolicy({ offset }),
        validations.twat.countMeetsPolicy({ count })
      ])
        .then(() => {
          fetchers.twat.getTimeline({ id: userId, offset, count }) 
            .then((data) => { handleSuccess(res, MC.map(data, 
              [{
                id: encodeId,
                content: String,
                twatbackCount: Number,
                shoutCount: Number,
                responseCount: Number,
                parentId: encodeId,
                author: {
                  id: encodeId,
                  profileUrl: String,
                  description: String,
                  followerCount: Number,
                  followingCount: Number,
                  name: String
                }
              }]))
            })
            .catch((error) => { handleInternal(res, error) });
        })
        .catch((error) => { handleError(res, error) });
    },

    getPublicByAuthor(req, res) {
      const { id, offset, count } = decodeIds(req.params, ['id']);

      validateAll([
        validations.user.nameExists({ name }),
        validations.twat.offsetMeetsPolicy({ offset }),
        validations.twat.countMeetsPolicy({ count })
      ])
        .then(() => {
          fetchers.twat.getPublicByAuthor({ id, offset, count })
            .then((data) => { handleSuccess(res, MC.map(data,
              [{
                id: encodeId,
                content: String,
                twatbackCount: Number,
                shoutCount: Number,
                responseCount: Number,
                parentId: encodeId,
                author: {
                  id: encodeId,
                  profileUrl: String,
                  description: String,
                  followerCount: Number,
                  followingCount: Number,
                  name: String
                }
              }]))
            })
            .catch((error) => { handleInternal(res, error) });
        })
        .catch((error) => { handleError(res, error) });
    }
  }

}
