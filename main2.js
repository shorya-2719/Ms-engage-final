(function({

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

const login = document.getElementById('login');
const Signup = document.getElementById('Signup');
const Logout = document.getElementById('Logout');
const txtEmail = document.getElementById('txtEmail');
const txtPassword= document.getElementById('txtPassword');

login.addEventListener('click',e =>{
    const email =txtEmail.value;
    const pass = txtPassword.value;
    const auth=firebase.auth();
    const promise = auth.signInWithEmailAndPassword(email,pass);
    promise.catch(e =>console.log(e.message));


})

Signup.addEventListener('click',e =>{
    const email =txtEmail.value;
    const pass = txtPassword.value;
    const auth=firebase.auth();
    const promise = auth.createUserWithEmailAndPassword(email,pass);
    promise.catch(e =>console.log(e.message));


})

firebase.auth().onAuthStateChanged(firebaseUser =>{
     if(firebaseUser){
         console.log(firebaseUser);
     }else{
         console.log('not logged in');
     }
});

}());