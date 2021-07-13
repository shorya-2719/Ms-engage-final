import './style.css';
import firebase from 'firebase/app';
import 'firebase/firestore';
    

const firebaseConfig = {
  apiKey: "AIzaSyD8Jtv3uCzjhybt_RxgSL7SdhbOr5okBwE",
  authDomain: "ms-engage-shorya.firebaseapp.com",
  projectId: "ms-engage-shorya",
  storageBucket: "ms-engage-shorya.appspot.com",
  messagingSenderId: "629511390146",
  appId: "1:629511390146:web:93d9b7cf90d348bb7bcc5b",
  measurementId: "G-YZ3HQN3B2D"

};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const firestore = firebase.firestore();

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};


// Global State
const pc = new RTCPeerConnection(servers);

let dataChannelParams = {
  reliable: true,
  ordered: true
};


let remoteStream = null;
let presentStream = null;
let videoStream = null;
let audioStream = null;

let videoSender = null;

let textChannel = null;

let onceS = false;

// HTML elements
const webcamButton = document.getElementById('webcamButton');
const muteButton = document.getElementById('muteButton');
const webcamVideo = document.getElementById('webcamVideo');
const callButton = document.getElementById('callButton');
const callInput = document.getElementById('callInput');
const answerButton = document.getElementById('answerButton');
const remoteVideo = document.getElementById('remoteVideo');
const hangupButton = document.getElementById('hangupButton');
const presentButton = document.getElementById('presentButton');
const recordButton = document.getElementById('recordButton');
const stopwebcam = document.getElementById('stopwebcam');
const themebut = document.getElementById('theme_button');
const textArea = document.getElementById('textArea');
const chatArea = document.getElementById('chatArea');

// 1. Setup media sources
themebut.onclick = async () => {
  if(themebut.innerHTML.toString() =="Dark Mode"){
    document.body.style.backgroundImage = "url('https://images.unsplash.com/photo-1526655805340-274e69922288?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxleHBsb3JlLWZlZWR8Mjl8fHxlbnwwfHx8fA%3D%3D&w=1000&q=80')";
    let myElements = document.querySelectorAll(".btn");
    let em = document.querySelectorAll(".btn:hover");
    document.body.style.color="white";
     for (let i = 0; i < myElements.length; i++) {
	        myElements[i].style.border = "4px solid black";
          myElements[i].style.color="white";
          } 
    // for(let i=0;i<em.length;i++){
    //   em[i].style.background= "black";
    // }
    themebut.innerHTML="Normal Mode"
  }else{
    
    document.body.style.background = "#339999";
    themebut.innerHTML="Dark Mode"
    let myElements = document.querySelectorAll(".btn");
    document.body.style.color="white";
     for (let i = 0; i < myElements.length; i++) {
	        myElements[i].style.border = "4px solid white";
          myElements[i].style.color="black";
          } 
  }
  
}
webcamButton.onclick = async () => {
  videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
  audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  remoteStream = new MediaStream();
  let videoTrack = videoStream.getVideoTracks()[0];
  let audioTrack = audioStream.getAudioTracks()[0]
  videoSender = pc.addTrack(videoTrack, videoStream);
  audioTrack = pc.addTrack(audioTrack, audioStream);

  // Pull tracks from remote stream, add to video stream
  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  webcamVideo.srcObject = videoStream;
  remoteVideo.srcObject = remoteStream;

  callButton.disabled = false;
  answerButton.disabled = false;
  webcamButton.disabled = true;
};

//////changed  dissss/////////////////////////////////////////////////////////////////

muteButton.onclick = async () => {
    audioStream.getAudioTracks()[0].enabled =
     !(audioStream.getAudioTracks()[0].enabled);
     if (muteButton.innerHTML.toString() == "Mute") muteButton.innerHTML = "Unmute";
     else muteButton.innerHTML = "Mute";
};

stopwebcam.onclick = async () => {
  videoStream.getTracks()[0].enabled =
   !(videoStream.getVideoTracks()[0].enabled);
  //  if (muteButton.innerHTML.toString() == "Start webcam") muteButton.innerHTML = "Stop Webcam";
  //  else muteButton.innerHTML = "Start webcam";
  if(stopwebcam.innerHTML.toString()=="Stop webcam"){
    stopwebcam.innerHTML="Start webcam";
  }else{
    stopwebcam.innerHTML="Stop webcam";
  }
};


presentButton.onclick = async () => {
	if (!onceS) {
		
    presentStream = await navigator.mediaDevices.getDisplayMedia({video:true});

    videoSender.replaceTrack(presentStream.getVideoTracks()[0]);
		
    onceS = true;
		
    presentButton.innerHTML = "Stop Presenting";
		webcamVideo.srcObject = presentStream;
	}
	else {
		if (presentButton.innerHTML.toString() == "Stop Presenting") {
			
      videoSender.replaceTrack(videoStream.getVideoTracks()[0]);

			presentButton.innerHTML = "Present";
			webcamVideo.srcObject = videoStream;
		}
		else if (presentButton.innerHTML.toString() == "Present") {

			videoSender.replaceTrack(presentStream.getVideoTracks()[0]);
			presentButton.innerHTML = "Stop Presenting";
			webcamVideo.srcObject = presentStream;
		}
	}
};


//////////////////////////////////////////////////////////////////////////////////////

// 2. Create an offer
callButton.onclick = async () => {
  // Reference Firestore collections for signaling
  const callDoc = firestore.collection('calls').doc();
  const offerCandidates = callDoc.collection('offerCandidates');
  const answerCandidates = callDoc.collection('answerCandidates');
  textChannel = pc.createDataChannel("chat", dataChannelParams);

  callInput.value = callDoc.id;

  // Get candidates for caller, save to db
  pc.onicecandidate = (event) => {
    event.candidate && offerCandidates.add(event.candidate.toJSON());
  };

  // Create offer
  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };

  await callDoc.set({ offer });

  // Listen for remote answer
  callDoc.onSnapshot((snapshot) => {
    const data = snapshot.data();
    if (!pc.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription);
    }
  });

  // When answered, add candidate to peer connection
  answerCandidates.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);
      }
    });
  });
  textChannel.onmessage = function(event) {
    console.log("ricevo questo messaggio1: " + event.data);
    chatArea.value += "Them: " + event.data + "\n"; 
    console.log(chatArea.innerHTML);
};
  hangupButton.disabled = false;
};




// 3. Answer the call with the unique ID
answerButton.onclick = async () => {
  const callId = callInput.value;
  const callDoc = firestore.collection('calls').doc(callId);
  const answerCandidates = callDoc.collection('answerCandidates');
  const offerCandidates = callDoc.collection('offerCandidates');

  pc.ondatachannel = function(event) {
    textChannel = event.channel;
    textChannel.onmessage = function(event) {
        console.log("ricevo questo messaggio2: " + event.data);
        chatArea.value += "Them: " + event.data + "\n"; 
    };
  };

  pc.onicecandidate = (event) => {
    event.candidate && answerCandidates.add(event.candidate.toJSON());
  };

  const callData = (await callDoc.get()).data();

  const offerDescription = callData.offer;
  await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
  };

  await callDoc.update({ answer });

  offerCandidates.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      console.log(change);
      if (change.type === 'added') {
        let data = change.doc.data();
        pc.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });
};
let mediaRecorder;
recordButton.onclick = () => {
  
  let canvas = remoteVideo;

  // Optional frames per second argument.
  let stream;//= canvas.captureStream(25);

  const sUsrAg = navigator.userAgent;
  if (sUsrAg.indexOf('Firefox') > -1) {
    console.log('Firefox');
    stream = canvas.mozCaptureStream();
  } else {
    console.log('Other');
    stream = canvas.captureStream();
  }
  let recordedChunks = [];

  console.log(stream);
  
  if (recordButton.innerHTML == "Record") {
    let options = { mimeType: "video/webm" };
    mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.ondataavailable = handleDataAvailable;

    mediaRecorder.start();
    recordButton.innerHTML = "Stop"
  }
  else {
    mediaRecorder.stop();
    recordButton.innerHTML = "Record"
  }

  // demo: to download after 9sec
  //setTimeout(event => {
    //console.log("stopping");
    //mediaRecorder.stop();
  //}, 9000);


function handleDataAvailable(event) {
  console.log("data-available");
  if (event.data.size > 0) {
    recordedChunks.push(event.data);
    console.log(recordedChunks);
    download();
  } //else {
    // ...
  //}
}
function download() {
  var blob = new Blob(recordedChunks, {
    type: "video/webm"
  });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  a.href = url;
  a.download = "test.webm";
  a.click();
  window.URL.revokeObjectURL(url);
}


  
}

chatArea.innerHTML = "";
sendButton.onclick = function() {
  let data = textArea.value;
  console.log("invio questo messaggio: " + data);
  chatArea.value += "You: " + data + "\n"; 
  textChannel.send(data);
};

clearButton.onclick = function(){
     let data ="";
     textArea.value = data;
};

joshuakimmich.onclick = function(){
  if(joshuakimmich.innerHTML.toString() == "size"){
    webcamVideo.style.width ="60vw";
    webcamVideo.style.height ="45vw";
    remoteVideo.style.width="12vw";
    remoteVideo.style.height="9vw";
    joshuakimmich.innerHTML="resize";
  }else{
    webcamVideo.style.width ="40vw";
    webcamVideo.style.height ="30vw";
    remoteVideo.style.width="40vw";
    remoteVideo.style.height="30vw";
    joshuakimmich.innerHTML="size";
  }
}

sergegnabry.onclick = function(){
  if(sergegnabry.innerHTML.toString() == "size"){
    remoteVideo.style.width ="60vw";
    remoteVideo.style.height ="45vw";
    webcamVideo.style.width="12vw";
    webcamVideo.style.height="9vw";
    sergegnabry.innerHTML="resize";
  }else{
    remoteVideo.style.width ="40vw";
    remoteVideo.style.height ="30vw";
    webcamVideo.style.width="40vw";
    webcamVideo.style.height="30vw";
    sergegnabry.innerHTML="size";
  }
}












