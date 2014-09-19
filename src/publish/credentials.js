'use strict';


var getCredentials = function() {
  var user  = localStorage.getItem('RCSR-admin-name');
  var token = localStorage.getItem('RCSR-admin-token');
  var isnew = localStorage.getItem('RCSR-admin-new-credentials') == 'true';
  var okay  = token && token.length == 40;

  localStorage.setItem('RCSR-admin-new-credentials', 'false');

  return {
    user : user,
    token: token,
    okay : okay,
    isnew: isnew
  };
};


module.exports = getCredentials;
