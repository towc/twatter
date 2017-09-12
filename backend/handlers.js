const validations = require('./validations');
const actions = require('./actions');
const fetchers = require('./fetchers');
const log = require('./log');

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

module.exports = {
  
  user: {
    create(req, res) {
      const { name, password } = req.body;
      
      validateAll([
        validations.user.nameMeetsPolicy(name),
        validations.user.passwordMeetsPolicy(password),
        validations.user.nameNotExists(name)
      ])
        .then(() => {
          actions.user.create({ name, password })
            .then(() => { handleSuccess(res) })
            .catch((error) => { handleInternal(res, error) });
        })
        .catch((error) => { handleError(res, error) });
    },

    login(req, res) {
      const { name, password } = req.body;

      validateAll([
        validations.user.nameExists(name)
      ], () => [
        validations.user.passwordMatchesName(password, name)
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
        validations.session.isAuthenticated(authenticated)
      ], () => {
        const promises = [];

        if(name) {
          promises.push(
            validations.user.nameNotExists(name),
            validations.user.nameMeetsPolicy(name)
          );
        }
        if(password) {
          promises.push(
            validations.user.passwordMeetsPolicy(password)
          );
        }
        if(profileUrl) {
          promises.push(
            validations.user.profileUrlMeetsPolicy(profileUrl)
          )
        }
        if(description) {
          promises.push(
            validations.user.descriptionMeetsPolicy(description)
          )
        }

        return promises
      })
        .then(() => {
          actions.user.edit({ id: userId, name, password, profileUrl, description})
            .then(() => { handleSuccess(res) })
            .catch((error) => { handleInternal(res, error) });
        })
        .catch((error) => { handleError(res, error) });
    },

    changeRelationship(req, res) {
      const { name } = req.params;
      const { following, blocking, muting } = req.body;
      const { userId, authenticated } = req.session;

      const relationships = { following, blocking, muting };

      validateAll([
        validations.session.isAuthenticated(authenticated)
      ], () => [
        validation.user.idRelationshipsNameNotSame(userId, relationships, name )
      ], () => {
        const promises = [];

        if(following) {
          promises.push(
            validations.user.nameNotBlockingId(name, userId)
          );
        }

        return promises;
      })
        .then(() => {
          actions.user.changeIdRelationshipsName({ relationships, originId, targetName })
            .then(() => { handleSuccess(res) })
            .catch((error) => { handleInternal(res, error) });
        })
        .catch((error) => { handleError(res, error) });
    },

    getByNameBase(req, res) {
      const { name } = req.params;

      validateAll([
        validations.user.nameExists(name)
      ])
        .then(() => {
          fetchers.user.getPublicByName({ name })
            .then((data) => { handleSuccess(res, data) })
            .catch((error) => { handleInternal(res, error) });
        })
        .catch((error) => { handleError(res, error) });
      
    }
  },

  twat: {
    create(req, res) {
      const { content, parentId } = req.body;
      const { userId, authenticated } = req.session;

      validateAll([
        validations.session.isAuthenticated(authenticated)
      ], () => [
        validations.twat.contentMeetsPolicy(content),
        validations.twat.parentIdExistsOrUndefined(parentId)
      ])
        .then(() => {
          actions.twat.create({ content, parentId, authorId: userId })
            .then(() => { handleSuccess(res) })
            .catch((error) => { handleInternal(res, error) });
        })
        .catch((error) => { handleError(res, error) });
    },

    getById(req, res) {
      const { id } = req.params;

      validateAll([
        validations.twat.idExists(id)
      ])
        .then(() => {
          fetchers.twat.getPublicById({ id })
            .then((data) => { handleSuccess(res, data) })
            .catch((error) => { handleInternal(res, error) });
        })
        .catch((error) => { handleError(res, error) });
    },

    getByAuthorName(req, res) {
      const { name } = req.params;

      validateAll([
        validations.user.nameExists(name)
      ])
        .then(() => {
          fetchers.twat.getPublicByAuthorName({ name })
            .then((data) => { handleSuccess(res, data) })
            .catch((error) => { handleInternal(res, error) });
        })
        .catch((error) => { handleError(res, error) });
    }
  }

}
