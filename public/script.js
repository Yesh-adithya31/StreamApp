const socket = io('/')
const videoGrid = document.getElementById('video-grid')
var myUserId = "";
const myPeer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '3030'
})
let myVideoStream;
let screenShare;
const myVideo = document.createElement('video')
myVideo.muted = true;
const peers = {}
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream)
  myPeer.on('call', call => {
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
  })

  socket.on('user-connected', userId => {
    myUserId = userId
    connectToNewUser(userId, stream)
  })
  // input value
  let text = $("input");
  // when press enter send message
  $('html').keydown(function (e) {
    if (e.which == 13 && text.val().length !== 0) {
      socket.emit('message', text.val());
      text.val('')
    }
  });

  socket.on("createMessage", (userId ,message) => {
    $("ul").append(`<li class="message"><b>${userId.substring(0, 4)}</b><br/>${message}</li>`);
    scrollToBottom()
  })
})

myPeer.on('call', (call) => {
  //console.log( 'CALL' )
  call.answer( screenShare );
  call.on('stream', function(stream) {
    //console.log( 'STREAM', stream )
    watch(stream)
    // let video2 = document.createElement("video");
    // addVideoStream(video2, stream)
    // let video = document.createElement("video");
    // video.srcObject = stream;
    // video.play();
  });
})

function watch( mediaStream ) {
  //console.log( mediaStream )

  // A stream is required to start a call, so call with an empty stream
  // This allows the call to be answered with the screen share.
  //const videoTrack = createEmptyVideoTrack({ width: 500, height: 500 })
  //const mediaStream = new MediaStream([ videoTrack ]);
  const call = myPeer.call(myUserId,mediaStream);
  //console.log("Calling:",call)
  

  // `stream` is the MediaStream of the remote peer.
  // Here you'd add it to an HTML video/canvas element.
  call.on('stream', function(stream) {
      //console.log( 'STREAM', stream )
      let video = document.createElement("video");
      video.srcObject = stream;
      video.play();
      videoGrid.append(video)
  });
}

socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close()
})

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
  })

  peers[userId] = call
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}


const scrollToBottom = () => {
  var d = $('.main__chat_window');
  d.scrollTop(d.prop("scrollHeight"));
}


const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}

const playStop = () => {
  //console.log('object')
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo()
  } else {
    setStopVideo()
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

var displayMediaOptions = {
  video: {
    cursor: "always"
  },
  audio: false
};

const exit = () => {
  window.location.href = "/exit";
};

const copyInfo = () => {
  navigator.clipboard.writeText(window.location.href);
};

const shareScreen = async () => {
 
  try {
    navigator.mediaDevices.getDisplayMedia(displayMediaOptions).then((stream) => {
      screenShare = stream
      let video = document.createElement("video");
      video.srcObject = stream;
      video.play()
      videoGrid.append(video)
  })
  } catch (err) {
    console.error("Error: " + err);
  }
  // connectToNewUser(myUserId, captureStream);
 // myPeer.call(myUserId, captureStream);
};



const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideo = () => {
  const html = `
  <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}
