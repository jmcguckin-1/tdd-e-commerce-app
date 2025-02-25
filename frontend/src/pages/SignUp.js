import {NavLink, useNavigate} from 'react-router-dom'
import {useState, useEffect} from "react";
import {  createUserWithEmailAndPassword  } from 'firebase/auth';
import { auth } from '../App.js';
import { collection, addDoc, getDocs } from "firebase/firestore";
import {db} from '../App.js';
import {Alert} from 'antd';
import PasswordChecklist from "react-password-checklist";
import {useTranslation} from "react-i18next";
import logo from "../images/default-monochrome-white.svg"

function SignUp(){
       const {t, i18n} = useTranslation('sign_up');
        const navigate = useNavigate();
        useEffect(() => {
    const applyStyles = () => {
      const currentLocale = i18n.language;

      if (currentLocale === 'fr') {
        frenchStyling();
      } else {
        englishStyle();
      }
    const selectElement = document.getElementById('langSignUp');
    if (selectElement) {
      selectElement.value = currentLocale;
    }
    };
    applyStyles();
  }, [i18n.language]);

       const changeLang = lng => {
           i18n.changeLanguage(lng.target.value);
           console.log(lng.target.value)
             if (lng.target.value === "en") {
                    englishStyle();
                }
        else {
            frenchStyling();
        }
       }

        function frenchStyling(){
        document.getElementById('closeP2').style.left = '94%';
        document.getElementsByClassName('passwordCheck')[0].style.left = '-69%';
        document.getElementsByClassName('alert2')[0].style.left = '2%';
        document.getElementById('closeP2').style.left = '94%';
    }

    function englishStyle(){
           document.getElementById('closeP2').style.left = '80%';
         document.getElementsByClassName('passwordCheck')[0].style.left = '-65%';
         document.getElementsByClassName('alert2')[0].style.left = '10%';
    }


        const [validPassword, setValid] = useState(false)
        function closeError(){
            document.getElementsByClassName('alert')[0].style.display = 'none';
            document.getElementById('close').style.display = 'none';
        }

        const nameChange = e => {
            const {value} = e.target;
            const re = /^[a-zA-Z ]*$/;
            if (re.test(value) || value === "") {
                setName(value);
            }
        }

        function closePassStrength(){
            document.getElementsByClassName('alert2')[0].style.display = 'none';
            document.getElementById('closeP2').style.display = 'none';
        }

        function passwordCheck(valid){
            if (!valid) {
                document.getElementsByClassName('alert2')[0].style.display = 'block';
                document.getElementById('closeP2').style.display = 'block';
            }
            else {
                setValid(true);
                document.getElementsByClassName('alert2')[0].style.display='none';
                 document.getElementById('closeP2').style.display = 'none';

            }
        }

        const [name, setName] = useState("")
        const [email, setEmail] = useState("")
        const [password, setPassword] = useState("")
        const [verifyPassword, setVP] = useState("")


    // submitting the sign up form process
         const onSubmit = async (e) => {
        e.preventDefault()

         let validEmail = true;
     if (validPassword){
     // https://firebase.google.com/docs/auth/web/password-auth?_gl=1*lh5shc*_up*MQ..*_ga*MjEyNjk4ODgyMS4xNzEyNzQ2NzA2*_ga_CW55HF8NVT*MTcxMjc0NjcwNS4xLjAuMTcxMjc0NjcwNS4wLjAuMA..#create_a_password-based_account
        await createUserWithEmailAndPassword(auth, email, password)
      .then( async (userCredential) => {
      })
      .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.log(errorCode, errorMessage);

      });
     }

   const usersCollection = collection(db, 'users');
const querySnapshot = await getDocs(usersCollection);

querySnapshot.forEach((doc) => {
  const userData = doc.data();
  const userEmail = userData.email;

  if (userEmail === email) {
    // if the email entered already exists in the db.
    alert(`Email "${email}" ${t('already_exists')}`);
    validEmail = false;
    return;
  }
});

        if(email.substring(email.length - 10) !== "@gmail.com"){
            alert(t("email_check"));
            validEmail = false;
        }
// validation before the form is sent on
             if (name === "" || email === "" || password === "" || verifyPassword === "") {
          document.getElementsByClassName("alert")[0].style.display = 'block';
          document.getElementById('close').style.display='block';
          document.getElementById('close').style.zIndex = '14';
          document.getElementsByClassName('alert')[0].style.zIndex = '14';
          document.getElementsByClassName('alert2')[0].style.zIndex = '10';
          document.getElementById('closeP2').style.zIndex = '10';
      }

      else {
                 if (!validPassword) {
                     document.getElementsByClassName('alert2')[0].style.display = 'block';
                     document.getElementById('closeP2').style.display = 'block';
                     document.getElementsByClassName('alert')[0].style.zIndex = '10';
                     document.getElementsByClassName('alert2')[0].style.zIndex = '14';
                     document.getElementById('closeP2').style.zIndex = '14';
                     document.getElementById('close').style.zIndex = '10';
                 } else {
                     if (name !== "" && email !== "" && password !== "" && verifyPassword !== "" && validPassword && validEmail) {
                         try {
                            // creates user document to be stored in firebase
                             const userInfo = await addDoc(collection(db, "users"), {
                                 name: name,
                                 email: email
                             });
                               navigate("/landing", {replace: true});
                         } catch (e) {
                             console.error("Error adding document: ", e);
                         }
                     }
                 }
             }

  }
             return (

        <div id='sign_up'>

            <div id='form'>
                    <h1 id='signUpHeading'>{t("sign_up")}</h1>
                <select id='langSignUp' onChange={(e) => changeLang(e)}><option value="en">EN</option><option value="fr">FR</option></select>
            <input type='text' id='name' value={name} onChange={(e) => nameChange(e) } placeholder={t("placeholder1")}/>
            <br/>
            <br/>
            <input type='text' id='email1' onChange={(e) => setEmail(e.target.value)} placeholder={t("placeholder2")}/>
            <br/>
            <br/>
            <input type='password' id='password' onChange={(e) => setPassword(e.target.value)} placeholder={t("placeholder3")}/>
            <br/>
            <br/>
            <input type='password' id='verify_password' onChange={(e) => setVP(e.target.value)} placeholder={t("placeholder4")}/>
            <br/>
            <br/>
            <button className='button-44' onClick={onSubmit}>{t("sign_up")}</button>

            {/* https://ant.design/components/alert */}
             <Alert
      message={t("alert.heading2")}
      className='alert'
      description={t("alert.message2")}
      type="error"
    />

   {/* https://ant.design/components/alert */}
             <Alert
      message={t("alert.heading1")}
      className='alert2'
      description={t("alert.message1")}
      type="error"
    />

            {/* https://www.npmjs.com/package/react-password-checklist */}
            <PasswordChecklist
            rules = {["capital", "match", "specialChar", "minLength", "number"]}
            minLength = {8}
            className={'passwordCheck'}
            value = {password}
            valueAgain = {verifyPassword}
            onChange={(isValid) => {passwordCheck(isValid)}}
            messages={{
					 minLength: <span style={{ whiteSpace: 'pre-line' }}>{t('length')}</span>,
        specialChar: <span style={{ whiteSpace: 'pre-line' }}>{t('special')}</span>,
					number: t('number'),
					capital: <span style={{ whiteSpace: 'pre-line' }}>{t('capital')}</span>,
					match: <span style={{ whiteSpace: 'pre-line' }}>{t('match')}</span>
				}}
         />

            <span id='close' onClick={closeError}>X</span>
             <span id='closeP2' onClick={closePassStrength}>X</span>
                <NavLink to="/" id='signInLink'>{t("link")}</NavLink>
            </div>

        </div>

    )
}

export default SignUp