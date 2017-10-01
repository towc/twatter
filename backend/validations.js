const fetchers = require('./fetchers');
const bcrypt = require('bcrypt');

const policies = require('./../shared/policies');
const charsets = require('./../shared/charsets');

const promiseFromValidation = 
  ({test, error, status=422}) => test ?
    Promise.resolve() :
    Promise.reject({ error, status });

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
const stringContainsWord = (string, words) => {
  for(let word of words) {
    if(string.includes(word)) {
      return true;
    }
  }

  return false;
}

module.exports = {

  user: {
    nameMeetsPolicy({ name }) {
      const policy = policies.user.name;

      return promiseFromValidations([
        {
          test: name.length >= policy.minLength,
          error: 'user name length short'
        }, {
          test: name.length <= policy.maxLength,
          error: 'user name length long'
        }, {
          test: stringWithinCharsets(name, policy.charset),
          error: 'user name charset not matching'
        }
      ]);
    },

    nameExists({ name }) {
      return fetchers.user.nameExists({ name })
        .then((result) => promiseFromValidation({
          test: result,
          error: 'user name not exists'
        }));
    },
    nameNotExists({ name }) {
      return new Promise((resolve, reject) => {
        this.nameExists({ name })
          .then(() => { reject('user name exists') })
          .catch(resolve);
      })
    },

    idExists({ id }) {
      return fetchers.user.idExists({ id })
        .then((result) => promiseFromValidation({
          test: result,
          error: 'user id not exists'
        }));
    },

    passwordMeetsPolicy({ password }) {
      const policy = policies.user.password;

      return promiseFromValidations([
        {
          test: password.length >= policy.minLength,
          error: 'user password length short'
        }, {
          test: password.length <= policy.maxLength,
          error: 'user password length long'
        }, {
          test: stringInAllCharsets(password, policy.mustCharset),
          error: 'user password charset not matching'
        }
      ]);
    },

    passwordMatchesName({ password, name }) {
      return fetchers.user.hashFromName({ name })
        .then((hash) => bcrypt.compare(password, hash))
        .then((result) => promiseFromValidation({
          test: result,
          error: 'user password not matching'
        }))  
    },

    profileUrlMeetsPolicy({ profileUrl }) {
      const policy = policies.user.profileUrl;

      return promiseFromValidations([
        {
          test: policy.protocols.includes(profileUrl.split(':')[0]),
          error: 'user profile url invalid protocol'
        }, {
          test: policy.extensions.includes(profileUrl.split('.').pop()),
          error: 'user profile url invalid extension'
        }, {
          test: profileUrl.length <= policy.maxLength,
          error: 'user profile url length long'
        }
      ])
    },

    descriptionMeetsPolicy({ description }) {
      const policy = policies.user.description;

      return promiseFromValidations([
        {
          test: description.length <= policy.maxLength,
          error: 'user description length long'
        }, {
          test: stringWithinCharsets(description, policy.charset),
          error: 'user description charset not matching'
        }
      ])
    },

    relationshipsNotSame({ originId, realtionships, targetId }) {
      return fetchers.user.getRelationships({ originId, targetId })
        .then((types) => {
          for(let relationship in relationships) {
            const value = relationships[relationship];
            if(value === types.includes(relationship)) {
              return promiseFromValidation({
                test: false,
                error: `user relationship not changed -- ${relationship}`
              })
            }
            return promiseFromValidation({ test: true });
          }
        })
    },

    targetNotBlockingOrigin({ originId, targetId }) {
      if(originId === -1 || targetId === -1) {
        return promiseFromValidation({ test: true });
      }

      return fetchers.user.getRelationship({ originId, targetId, relationship: 'blocking' })
        .then((result) => promiseFromValidation({
          test: result,
          error: 'user relationship target blocking origin'
        }))
    }
  },


  twat: {
    contentMeetsPolicy({ content }) {
      const policy = policies.twat.content;

      return promiseFromValidations([
        {
          test: content.length <= policy.maxLength,
          error: 'twat content length long'
        }, {
          test: stringContainsWord(content, policy.curses),
          error: 'twat content not contains whitelist'
        }
      ])
    },

    idExists({ id }) {
      return fetchers.twat.idExists({ id })
        .then((result) => promiseFromValidation({
          test: result,
          error: 'twat id not exists'
        }));
    },

    idExistsOrUndefined({ id }) {

      if(id === undefined) {
        return promiseFromValidation({test: true});
      }

      return fetchers.twat.idExists({ id })
        .then((result) => promiseFromValidation({
          test: result,
          error: 'twat id not exists and not undefined'
        }))
    },
    offsetMeetsPolicy({ offset }) {
      const policy = policies.twat.offset;

      return promiseFromValidations([
        {
          test: stringWithinCharsets(offset, policy.charset),
          error: 'twat offset not hex number'
        }, {
          test: offset.length < policy.maxLength,
          error: 'twat offset above max'
        }
      ])
    },
    countMeetsPolicy({ count }) {
      const policy = policies.twat.count;

      return promiseFromValidations([
        {
          test: stringWithinCharsets(count, policy.charset),
          error: 'twat count not number'
        }, {
          test: +count <= policy.max,
          error: 'twat count above max'
        }
      ])
    }
  },

  session: {
    isAuthenticated({ authenticated }) {
      return promiseFromValidation({
        test: authenticated,
        error: 'session user not authenticated',
        status: 401
      })
    },
    debounceUserCreate({ lastCreate }) {
      return promiseFromValidation({
        test: lastCreate === undefined || Date.now() - lastCreate > policies.session.userCreate,
        error: 'session user created below debounce'
      })
    }
  },
}
