const env = require('../.env');
const [ DATE, TYPE, MESSAGE ] = [ 0, 1, 2 ];

module.exports = (message, opts) => {
  const { type, verbosity } = opts || { type: 'log', verbosity: 4 };

  if( verbosity < env.verbosity ) {
    return
  }
  const args = [new Date, 'LOG', message];

  switch(type) {
    case 'log':
      console.log.apply(null, args);
      return;
    case 'error':
      args[TYPE] = 'ERROR\n';
      console.error.apply(null, args);
      return;
  }
 
}
