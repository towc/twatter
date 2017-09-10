const knex = require('./db');
const actions = require('./actions');
const bcrypt = require('bcrypt');

const policies = require('./policies.js');
const charsets = require('./charsets.js');

const promiseFromValidation = 
  ({test, error}) => test ?
    Promise.resolve() :
    Promise.reject(error);

const promiseFromValidations = validationObjects => {
  for(let {test, error} of validationObjects) {
    if(!test) {
      return Promise.reject(error);
    }
  };
  return Promise.resolve();
}

const stringWithinCharsets = (string, charsetReferences) => {
  const charset = charsetReferences.map((reference) => charsets[reference].set).join('');
  
  for(let char of string) {
    if(charset.indexOf(char) === -1) {
      return false;
    }
  }

  return true;
}
const stringInAllCharsets = (string, charsetReferences) => {
  for(let charsetReference of charsetReferences) {
    const charset = charsets[charsetReference].set;

    let satisfied = false;
    for(let char of charset) {
      if(string.indexOf(char) > -1) {
        satisfied = true;
        break;
      }
    }

    if(!satisfied) {
      return false;
    }
  }

  return true;
}

module.exports = {

  nameMeetsPolicy(name) {
    const policy = policies.name;

    return promiseFromValidations([
      {
        test: name.length >= policy.minLength,
        error: 'name length short'
      }, {
        test: name.length <= policy.maxLength,
        error: 'name length long'
      }, {
        test: stringWithinCharsets(name, policy.charset),
        error: 'name charset not matching'
      }
    ]);
  },

  nameExists(name) {
    return knex('users')
      .where({ name })
      .select('name') // minimize strain on both node and database
      .then((users) => promiseFromValidation({
        test: users.length > 0,
        error: 'name not exists'
      }));
  },
  nameNotExists(name) {
    return new Promise((resolve, reject) => {
      this.nameExists(name)
        .then(() => { reject('name exists') })
        .catch(resolve);
    })
  },

  passwordMeetsPolicy(password) {
    const policy = policies.password;

    return promiseFromValidations([
      {
        test: password.length >= policy.minLength, error: 'password length short'
      }, {
        test: password.length <= policy.maxLength,
        error: 'password length long'
      }, {
        test: stringInAllCharsets(password, policy.mustCharset),
        error: 'password charset not matching'
      }
    ]);
  },

  passwordMatchesName(password, name) {
    return knex('users')
      .where({ name })
      .select('hash')
      .then((hashObjects) =>
        bcrypt.compare(password, hashObjects[0].hash)
          .then((result) => promiseFromValidation({
            test: result,
            error: 'password not matching'
          }))  
      )
  },

  profileUrlMeetsPolicy(profileUrl) {
    const policy = policies.profileUrl;

    return promiseFromValidations([
      {
        test: policy.protocols.includes(profileUrl.split(':')[0]),
        error: 'profile url invalid protocol'
      }, {
        test: policy.extensions.includes(profileUrl.split('.').pop()),
        error: 'profile url invalid extension'
      }, {
        test: profileUrl.length <= policy.maxLength,
        error: 'profile url length long'
      }
    ])
  },

  descriptionMeetsPolicy(description) {
    const policy = policies.description;

    return promiseFromValidations([
      {
        test: description.length <= policy.maxLength,
        error: 'description length long'
      }, {
        test: stringWithinCharset(description, policy.charset),
        error: 'description charset not matching'
      }
    ])
  },

  sessionIsAuthenticated({ authenticated }) {
    return promiseFromValidation({
      test: authenticated,
      error: 'user not authenticated'
    })
  }
}
