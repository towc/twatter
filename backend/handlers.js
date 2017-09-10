const validations = require('./validations');
const actions = require('./actions');

const validateAll = promises => Promise.all(promises);
const handleError = (error, res) => {
  res.json({ error });
}
const handleSuccess = (res) => {
  res.json({ success: true });
}

module.exports = {
  
  userCreate(req, res) {
    const { name, password } = req.body;
    
    validateAll([
      validations.nameMeetsPolicy(name),
      validations.passwordMeetsPolicy(password),
      validations.nameNotExists(name)
    ])
      .then(() => {
        actions.createUser({ name, password })
          .then(() => {
            res.json({ success: true });
          });
      })
      .catch((error) => { handleError(error, res) });
  },

  userLogin(req, res) {
    const { name, password } = req.body;

    validateAll([
      validations.nameExists(name),
      validations.passwordMatchesName(password, name)
    ])
      .then(() => {
        actions.getIdFromName({ name })
          .then((id) => {
            req.session.id = id;
            req.session.authenticated = true;
            handleSuccess(res);
          })
      })
      .catch((error) => { handleError(error, res) });
  },

  userModify(req, res) {

    const { name, password, profileUrl, description } = req.body;
    const { id } = req.session;

    const promises = [
      validations.sessionIsAuthenticated(req.session)
    ];

    if(name) {
      promises.push(
        validations.nameNotExists(name),
        validations.nameMeetsPolicy(name)
      );
    }

    if(password) {
      promises.push(
        validations.passwordMeetsPolicy(password)
      );
    }

    if(profileUrl) {
      promises.push(
        validations.profileUrlMeetsPolicy(profileUrl)
      )
    }

    if(description) {
      promises.push(
        validations.descriptionMeetsPolicyt(description)
      )
    }
    
    validateAll(promises)
      .then(() => {
        actions.modifyUser({ id, name, password, profileUrl, description})
          .then(() => { handleSuccess(res) })
      })
      .catch((error) => { handleError(error, res) })
  
  }
}
