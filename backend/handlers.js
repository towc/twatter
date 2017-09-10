const validations = require('./validations');
const actions = require('./actions');
const fetchers = require('./fetchers');

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
const handleError = (error, res) => {
  res.json({ error });
}
const handleInternal = (error, res) => {
  res.json({ error: 'internal error' });
  console.error(new Date, '\n', error);
}
const handleSuccess = (res) => {
  res.json({ success: true });
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
            .catch((error) => { handleInternal(error, res) });
        })
        .catch((error) => { handleError(error, res) });
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
            .catch((error) => { handleInternal(error, res) });
        })
        .catch((error) => { handleError(error, res) });
    },

    modify(req, res) {

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
          actions.modifyUser({ id: userId, name, password, profileUrl, description})
            .then(() => { handleSuccess(res) })
            .catch((error) => { handleInternal(error, res) });
        })
        .catch((error) => { handleError(error, res) })
    },
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
          actions.createTwat({ content, parentId, authorId: userId })
            .then(() => { handleSuccess(res) })
            .catch((error) => { handleInternal(error, res) });
        })
        .catch((error) => { handleError(error, res) });
    }
  }

}
