const charsets = {
  'base lowercase': {
    set: 'abcdefghjklmnopqrstuvwxyz',
    message: 'base lowercase alphabet (a-z without accents)' },
  'base uppercase': {
    message: 'base uppercase alphabet (A-Z without accents)' },
  'base alphabet': {
    message: 'base alphabet (a-z and A-Z without accents)' },

  'base special': {
    set: '_.',
    message: 'base special characters ("_" and ".")' },
  'extended special': {
    set: '$#\'"`()[]{}@:/\\ ~+-*&^%!?=',
    message: 'extended special characters' },

  'numeric decimal': {
    set: '0123456789',
    message: 'decimal digits (0-9)' }
}

charsets['base uppercase'].set = charsets['base lowercase'].set.toUpperCase();
charsets['base alphabet'].set = 
  charsets['base lowercase'].set + charsets['base uppercase'].set;
charsets['extended special'].set += charsets['base special'].set;

module.exports = charsets;
