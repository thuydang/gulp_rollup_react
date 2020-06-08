/* server/server.js */
/* server.js */

let express = require('express');
let app = express();

app.use(express.static(__dirname+'/../public'));

let server = app.listen(4000, ()=>{
console.log('Server started listening on 4000');
});
