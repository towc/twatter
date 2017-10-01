const { encodeId, decodeId } = require('./../.env');
const validations = require('./validations');
const actions = require('./actions');
const fetchers = require('./fetchers');
const responseSchemas = require('./../shared/response-schemas')({ id: encodeId });
const requestSchemas = require('./../shared/request-schemas')({ id: decodeId, error: (_, propertyName) => { throw `required parameter not set -- ${propertyName}` } });
const log = require('./log');
const MC = require('maptor-consumer');

const decodeIds = (obj, idNames) => 
  idNames.reduce((res, idName) => {
      if(res[idName] !== undefined) {
        const decoded = decodeId(res[idName]);
        res[idName] = decoded < 0 ? undefined : decoded;
      }

      return res;
  }, obj);
const consumeRequest = (request, schema) => MC.map(request, schema);
const consumeResponse = (response, schema) => MC.map(response, schema);

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
const handleError = (res, { error, status }) => {
  res.status(status).json({ error });
}
const handleInternal = (res, error) => {
  res.status(500).json({ error: 'internal error' });
  log(error, { type: 'error' });
}
const handleSuccess = (res, data) => {
  res.status(200).json({ success: true, data });
}

/**
 *
 * Here's what a generic handler looks like
 *
 * ...
 * subject: {
 *  ...
 *  handler(req, res) {
 *    const { basicInfo } = consumeRequest(req.params, requestSchemas.subject.schema);
 *    const { advancedInfo } = consumeRequest(req.body, requestSchemas.subject.otherSchema);
 *    const { sessionInfo } = req.session;
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
 *      // this will run if all validations succeeded
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
 *          .then((data) => { handleSuccess(res, consumeResponse(data, responseSchemas.subject.schema))
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
      const { name, password } = consumeRequest(req.body, requestSchemas.user.authIdentifier);
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
      const { name, password } = consumeRequest(req.body, requestSchemas.user.authIdentifier);

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
              handleSuccess(res, consumeResponse({ id }, responseSchemas.user.loginData));
            })
            .catch((error) => { handleInternal(res, error) });
        })
        .catch((error) => { handleError(res, error) });
    },

    edit(req, res) {
      const { name, password, profileUrl, description } = consumeRequest(req.body, requestSchemas.user.edit);
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
      const { targetId } = consumeRequest(req.params, requestSchemas.user.changeRelationship);
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
      const { id } = consumeRequest(req.params, requestSchemas.user.identifier);

      validateAll([
        validations.user.idExists({ id })
      ])
        .then(() => {
          fetchers.user.getPublic({ id })
            .then((data) => { handleSuccess(res, consumeResponse(data, responseSchemas.user.base)) })
            .catch((error) => { handleInternal(res, error) });
        })
        .catch((error) => { handleError(res, error) });
      
    }
  },

  twat: {
    create(req, res) {
      const { content, parentId } = consumeRequest(req.body, requestSchemas.twat.create);
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
      const { id } = consumeRequest(req.params, requestSchemas.twat.identifier);

      validateAll([
        validations.twat.idExists({ id })
      ])
        .then(() => {
          fetchers.twat.getPublic({ id })
            .then((data) => { handleSuccess(res, consumeResponse(data, responseSchemas.twat.base)) })
            .catch((error) => { handleInternal(res, error) });
        })
        .catch((error) => { handleError(res, error) });
    },

    getTimeline(req, res) {
      const { offset, count } = consumeRequest(req.params, responseSchemas.twat.list);
      const { authenticated, userId } = req.session;

      validateAll([
        validations.session.isAuthenticated({ authenticated }),
        validations.twat.offsetMeetsPolicy({ offset }),
        validations.twat.countMeetsPolicy({ count })
      ])
        .then(() => {
          fetchers.twat.getTimeline({ id: userId, offset, count }) 
            .then((data) => { handleSuccess(res, consumeResponse(data, responseSchemas.twat.timeline)) })
            .catch((error) => { handleInternal(res, error) });
        })
        .catch((error) => { handleError(res, error) });
    },

    getPublicByAuthor(req, res) {
      const { id, offset, count } = consumeRequest(req.params, requestSchemas.twat.listByAuthor);
      const { userId } = req.session;

      validateAll([
        validations.user.idExists({ id })
      ], () => [
        validations.user.targetNotBlockingOrigin({ targetId: id, originId: userId || -1 }) 
      ], () => [
        validations.twat.offsetMeetsPolicy({ offset }),
        validations.twat.countMeetsPolicy({ count })
      ])
        .then(() => {
          fetchers.twat.getPublicByAuthor({ id, offset, count })
            .then((data) => { handleSuccess(res, consumeResponse(data, responseSchemas.twat.publicByAuthor)) })
            .catch((error) => { handleInternal(res, error) });
        })
        .catch((error) => { handleError(res, error) });
    }
  }

}
