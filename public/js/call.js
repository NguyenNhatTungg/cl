const socket = io();
const peer = new RTCPeerConnection();
let localStream;
let remoteSocketId = null;

const userId = prompt("Nhập tên bạn:");
socket.emit('add_user', userId);

// Hiển thị camera
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localStream = stream;
    document.getElementById('localVideo').srcObject = stream;
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
  });

peer.ontrack = event => {
  const remoteStream = event.streams[0];
  document.getElementById('remoteVideo').srcObject = remoteStream;
};

peer.onicecandidate = event => {
  if (event.candidate && remoteSocketId) {
    socket.emit('ice_candidate', {
      to: remoteSocketId,
      candidate: event.candidate
    });
  }
};

// Gọi người khác
async function call() {
  const targetId = document.getElementById('targetId').value;
  remoteSocketId = null;
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  socket.emit('call_user', { to: targetId, offer });
}

// Nhận cuộc gọi
socket.on('incoming_call', async ({ from, offer }) => {
  remoteSocketId = from;
  await peer.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);
  socket.emit('answer_call', { to: from, answer });
});

// Nhận answer
socket.on('call_answered', async ({ answer }) => {
  await peer.setRemoteDescription(new RTCSessionDescription(answer));
});

// Nhận ICE Candidate
socket.on('ice_candidate', async ({ candidate }) => {
  if (candidate) {
    await peer.addIceCandidate(new RTCIceCandidate(candidate));
  }
});

// Kết thúc cuộc gọi
function end() {
  if (remoteSocketId) {
    socket.emit('end_call', { to: remoteSocketId });
    peer.close();
    alert('Đã kết thúc cuộc gọi');
    window.location.reload();
  }
}

socket.on('call_ended', () => {
  peer.close();
  alert('Người kia đã kết thúc cuộc gọi');
  window.location.reload();
});
 