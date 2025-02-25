import {NavLink, useNavigate} from 'react-router-dom'
import {useState, useContext, useTransition, useEffect} from "react";
import {signInWithEmailAndPassword, signInWithPopup, getAuth, GoogleAuthProvider, sendPasswordResetEmail, onAuthStateChanged} from "firebase/auth";
import google from '../images/google-1088004_1280.png'
import i18n from "i18next"
import {initReactI18next, useTranslation} from "react-i18next";
import {addDoc, collection, getDocs} from "firebase/firestore";
import engflag from "../images/union-jack-1027898_1280.jpg"
import frflag from "../images/france-28463_1280.png"
import {db} from "../App";
import logo from "../images/default-monochrome-white.svg"
import PasswordChecklist from "react-password-checklist";

function SignIn(){
    const {t} = useTranslation('sign_in');
    const [verifyPassword, setVP] = useState("");
    const [resetEmail, setResetEmail] = useState("");
    const [passCodeInput, setInput] = useState("");
     const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

       function backSignIn(){
       document.getElementById('forgotPassword').style.display='none';
       document.getElementById('enterEmail').style.display='none';
       document.getElementById('form2').style.display='block';
    }

    async function sendPasswordReset(){
        let validDetails = true;
        let blank = false;
        if(resetEmail.substring(resetEmail.length - 10) !== "@gmail.com"){
            alert(t("email_check"));
            validDetails = false;
        }

          if(resetEmail === ""){
        alert(t("blank_entry"));
        blank = true;
        }


        if (!blank && validDetails){
        // https://firebase.google.com/docs/auth/web/manage-users#send_a_password_reset_email
             await sendPasswordResetEmail(auth, resetEmail)
        .then(() =>{
              alert(t("alert-success"));
            backSignIn();
        }

        )
        .catch((error) => console.log(error))
        }


    }

    function verifyEmail(){
      document.getElementById('forgotPassword').style.display='block';
        document.getElementById('backForgot').style.display='block';
       document.getElementById('enterEmail').style.display='block';
       document.getElementById('form2').style.display='none';
        document.getElementById("userPasswordR").value = "";

    }
    useEffect(() => {
    const applyStyles = () => {
      const currentLocale = i18n.language;

      if (currentLocale === 'fr') {
        frenchStyling();
      } else {
        englishStyle();
      }
       const selectElement = document.getElementById('langSignIn');
    if (selectElement) {
      selectElement.value = currentLocale;
    }
    };
    applyStyles();
  }, [i18n.language]);

    function frenchStyling(){
        document.getElementById('sign_in_heading').style.marginLeft = '-11%';
        document.getElementsByClassName('button-44')[0].style.fontSize = '20px';
        document.getElementsByClassName('button-44')[0].style.width = '42%';
        document.getElementsByClassName('button-44')[0].style.marginLeft = '20%';
        document.getElementById('signUpLink').style.fontSize="16.8px";
         document.getElementById('passReset').style.width="74%";
          document.getElementById('passReset').style.left="14%";

    }

    function englishStyle(){
        document.getElementById('sign_in_heading').style.marginLeft = '1%';
        document.getElementsByClassName('button-44')[0].style.fontSize = '24px';
        document.getElementsByClassName('button-44')[0].style.width = '35%';
       document.getElementsByClassName('button-44')[0].style.marginLeft = '27%';
        document.getElementById('signUpLink').style.fontSize="20px";
          document.getElementById('passReset').style.width="60%";
          document.getElementById('passReset').style.left="21%";
    }

    const changeLang = (e) => {
        i18n.changeLanguage(e.target.value);
        if (e.target.value === "en") {
            englishStyle();
        }
        else {
            frenchStyling();
        }
    }

// handles Google Authentication
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
   async function googleSignIn() {
  try {
  // https://firebase.google.com/docs/auth/web/google-signin
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    const user = result.user;

    const usersCollection = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollection);
    let userExists = false;

    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      const userEmail = userData.email;

      if (userEmail === user.email) {
        userExists = true;
        return;
      }
    });

    if (!userExists) {
    // https://firebase.google.com/docs/firestore/manage-data/add-data#add_a_document
      const userInfo = await addDoc(collection(db, "users"), {
        name: user.displayName,
        email: user.email
      });
    }

    navigate("/landing", { replace: true });
  } catch (error) {
    console.error("Error signing in with Google: ", error);
  }
}

    // normal user login
     const onLogin = (e) => {
        signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {

            const user = userCredential.user;
            console.log(user);
            navigate("/landing", {replace: true});
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            alert(errorCode  + ": " + errorMessage);
        });
        console.log(email)
    }
    return (
        <div id='sign_in'>
              <select id='langSignIn' onChange={(e) => changeLang(e)}>
                    <option value="en">EN </option>
                    <option value="fr">FR</option></select>
            <div id='form2'>
                <h1 id='sign_in_heading'>{t(["app.sign_in"])}</h1>
            <input type='text' id='email' onChange={(e) => setEmail(e.target.value)} placeholder={t(["placeholder1"])}/>
            <br/>
            <br/>
            <input type='password' onChange={(e) => setPassword(e.target.value)} id='password' placeholder={t(["placeholder2"])}/>
            <br/>

            <br/>


            <button id='signInBtn' className='button-44' onClick={onLogin}>{t(["app.sign_in"])}</button>
            <button id='withGoogle' onClick={(e) =>  googleSignIn()}>{t(["g_sign_in"])} <img id='gLogo' src={google} alt={'google logo'}/></button>
            <br/>
            <NavLink to="/signup" id='signUpLink'>{t(["link"])}</NavLink>
            <p onClick={() => verifyEmail()} id='forgot'>{t("forgot_password")}</p>
            </div>

            <div id='forgotPassword'>

            <div id='enterEmail'>
                <p>{t("enter_email")}</p>
                <span className='button-44' id='backForgot' onClick={() => backSignIn()}>{t("back_sign_in")}</span>
                <input type='text' id='userPasswordR' onChange={(e) => setResetEmail(e.target.value)}/>
                <button className='button-44' id='passReset' onClick={() => sendPasswordReset()}>{t("send_reset")}</button>
            </div>

            </div>

        </div>
    )
}

export default SignIn