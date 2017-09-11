const [ DATE, TYPE, MESSAGE ] = [ 0, 1, 2 ];

module.exports = (message, opts) => {
  const { type } = opts || { type: 'log' };

  const args = [new Date, 'LOG', message];

  switch(type) {
    case 'log':
      return console.log.apply(null, args);
    case 'error':
      args[TYPE] = 'ERROR\n';
      return console.error.apply(null, args);
  }
 
}
