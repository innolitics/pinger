var socket = io();
socket.on('newResult', function(result) {
  console.log(result.result.status);
});
