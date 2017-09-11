const [ DATE, TYPE, MESSAGE ] = [ 0, 1, 2 ];

module.exports = (message, { type }) => {
  const args = [new Date, 'LOG', message];

  if(type === 'error') {
    args[TYPE] = 'ERROR\n';
    return console.error.apply(args);
  }

  console.log.apply(args);
 
}
