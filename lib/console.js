require('colors');
const prefix = 'Oragami: '.magenta;
const error = console.error;
console.success = message => {
    console.log(prefix, `✅ Success - ${message}!`.green);
};
console.error = err => {
    error(prefix, `❌ Error - ${err}!`.red);
};
