import NavBar from "../components/NavBar";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faUser, faList, faKey, faSterlingSign, faEuroSign} from '@fortawesome/free-solid-svg-icons';
import {faMagnifyingGlass} from "@fortawesome/free-solid-svg-icons";
import { auth } from '../App.js';
import {useEffect, useState} from "react";
import {useNavigate} from 'react-router-dom';
import {useTranslation} from "react-i18next";
import { collection, getDocs } from "firebase/firestore";
import { getMyVariable, setMyVariable } from './landing_config';
import {db} from '../App.js';
import {Alert} from 'antd';
import { onAuthStateChanged, updatePassword, updateEmail } from 'firebase/auth';
import PasswordChecklist from "react-password-checklist";
import landingpic from "../images/pexels-garrett-morrow-682933.jpg";
import { AddressAutofill } from '@mapbox/search-js-react';
import "../Sem2.css";
import disLogo from "../images/discord.png"

function Profile(){

    const [currentUser, setUser] = useState("");
    const navigate = useNavigate();
     const {t, i18n} = useTranslation('profile');
    const [name, setName] = useState("");
    const [oldEmail, setOEmail] = useState("");
    const [newEmail, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [numPurchases, setNP] = useState("");
    const [passCodeInput, setInput] = useState("");
    const [productList, setProductList] = useState([]);
    const [password, setPassword] = useState("");
    const [verifyPassword, setVP] = useState("");
     const [addrLineOne, setALine1] = useState("");
     const [addrLine2, setALineTwo] = useState("");
     const [city, setCity] = useState("");
     const [country, setCountry] = useState("");
     const [postcode, setPostcode] = useState("");
     const [discountCode, setDiscountCode] = useState("");
     const [authProvider, setProvider] = useState("");
     const [validPassword, setValid] = useState(false);
     const [discord, setDiscord] = useState(t("discord"));
     const [gamerTag, setGT] = useState("");
     const [prefUser, setPref] = useState(t("gamertag"));

        // styling methods
        function englishStyle(){
            document.getElementById('backBtn').style.width="40%";
            document.getElementById('edit').style.fontSize="22px";
            document.getElementById('edit').style.left="65%";
            document.getElementById('edit').style.width="35%";
            document.getElementById('closeP2').style.left="85%";
            document.getElementById('passChange1').style.fontSize="24px";
            document.getElementById('passChange2').style.fontSize="24px";

        }
        function frenchStyling(){
              document.getElementById('backBtn').style.width="50%";
              document.getElementById('edit').style.fontSize="17.5px";
              document.getElementById('edit').style.left="57%";
              document.getElementById('edit').style.width="40%";
              document.getElementById('closeP2').style.left="94%";
              document.getElementById('passChange1').style.fontSize="19.5px";
              document.getElementById('passChange2').style.fontSize="19.5px";
        }
        function changePassword(){
        let blank = false;
        if (password == "" || verifyPassword == ""){
          document.getElementsByClassName("alert")[0].style.display = 'block';
          document.getElementById('close').style.display='block';
          document.getElementById('close').style.zIndex = '14';
          document.getElementsByClassName('alert')[0].style.zIndex = '14';
          document.getElementsByClassName('alert2')[0].style.zIndex = '10';
          document.getElementById('closeP2').style.zIndex = '10';
          blank = true;
          setValid(false);
        }

        if (!validPassword) {
             document.getElementsByClassName('alert2')[0].style.display = 'block';
             document.getElementById('closeP2').style.display = 'block';
             document.getElementsByClassName('alert')[0].style.zIndex = '10';
             document.getElementsByClassName('alert2')[0].style.zIndex = '14';
             document.getElementById('closeP2').style.zIndex = '14';
             document.getElementById('close').style.zIndex = '10';
        }
        else{
              alert(t("password_update"));
              document.getElementById('userOptions').style.display='block';
              document.getElementById('userProfile').style.display='block';
              document.getElementById('passwordChange').style.display='none';
        }

              fetch("/get_product_inventory/all/user" + "/" + i18n.language)
        .then(response => response.json())
        .then(data => {
       const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && password && validPassword && !blank) {
             // https://firebase.google.com/docs/auth/web/manage-users#set_a_users_password
                updatePassword(user, password).then(() => {
                }).catch((error) => {
                    console.log(error);
                });
            } else {
                console.log('No user is signed in');
            }
        });

        return () => unsubscribe();
    })
    .catch(error => {
        console.error("Error fetching data:", error.message);
    });

        }

          function closePassStrength(){
            document.getElementsByClassName('alert2')[0].style.display = 'none';
            document.getElementById('closeP2').style.display = 'none';
        }

           function closeError(){
            document.getElementsByClassName('alert')[0].style.display = 'none';
            document.getElementById('close').style.display = 'none';
           }

        function passwordCheck(valid){
            if (!valid) {
                document.getElementsByClassName('alert2')[0].style.display = 'block';
                document.getElementById('closeP2').style.display = 'block';
                setValid(false);
            }
            else {
                setValid(true);
                document.getElementsByClassName('alert2')[0].style.display='none';
                 document.getElementById('closeP2').style.display = 'none';

            }
        }

        // validates the discount code entered by the user
        function validDiscount(){
                   fetch("validate_code", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user: oldEmail, code: discountCode}),
    })
      .then(response => response.json())
      .then(data => {
            if(data.length > 0){
                if (data[0]['result'] == "code match"){
                    document.getElementById("disEntry").value = "";
                    alert(t("use_discount"));
                    document.getElementById('discountCodeEntry').style.display='none';
                      document.getElementById('userOptions').style.display='block';
                    document.getElementById('userProfile').style.display='block';
                }
                   else{
                    alert(t("wrong_code"))
                }
            }

      })
      .catch(error => {
        alert(t("wrong_code"))
        console.error('Error:', error);
      });
        }

       async function changeDetails(){
        let validDetails = true;

        let details = [name, newEmail, addrLineOne, postcode, city, country]
        for(let i=0; i<details.length; i++){
            if (details[i] === ""){
                alert(t("blank_entry"));
                validDetails = false;
            }
        }

          if (authProvider === 'google.com' && newEmail != currentUser){
        alert(t("google-email"));
            validDetails = false;
        }

        if(newEmail.substring(newEmail.length - 10) !== "@gmail.com"){
            alert(t("email_check"));
            validDetails = false;
        }


const usersCollection = collection(db, 'users');
// https://firebase.google.com/docs/firestore/query-data/get-data#get_a_document
const querySnapshot = await getDocs(usersCollection);
if (currentUser !== newEmail){
    querySnapshot.forEach((doc) => {
  const userData = doc.data();
  const userEmail = userData.email;

  if (userEmail === newEmail) {
     alert(`Email "${newEmail}" ${t('already_exists')}`);
    validDetails = false;
    return;
  }
});
}

        // sets user preferences for console
           let select = document.getElementById('pref');
        let term = select.value;
        if (term == "PS5 Games"){
            setPref(t("ps_user"));

        }
        else if(term == "Xbox Games"){
             setPref(t("x_user"));
        }
        else{
              setPref(t("n_user"));
        }

        let details_list =
        {"name": name,
        "email": newEmail,
        "addr_line_one": addrLineOne,
        "postcode": postcode,
        "city": city,
        "country": country,
        "preference": term,
        "discord": discord,
        "gamertag": gamerTag};

        if(validDetails){

      fetch("/get_product_inventory/all/user" + + "/" + i18n.language)
    .then(response => response.json())
    .then(data => {
        const user = auth.currentUser;
        if (user) {
        // https://firebase.google.com/docs/auth/web/manage-users#set_a_users_email_address
            updateEmail(user, newEmail)
                .then(() => {
                    console.log("Email updated!");
                })
                .catch((error) => {
                    console.log("Error updating email:", error.message);
                });
        }
    })
    .catch(error => {
        console.error("Error fetching data:", error.message);
    });


               fetch("/change_details", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({user: oldEmail, details: details_list}),
    })
      .then(response => response.text())
      .then(data => {
        document.getElementById('detailsForm').style.display='none';
          document.getElementById('userOptions').style.display='block';
    document.getElementById('userProfile').style.display='block';
    setOEmail(newEmail);

      })
      .catch(error => {
        console.error('Error:', error);
      });
        }


        }

        function displayDetails(){
    document.getElementById('userOptions').style.display='none';
    document.getElementById('userProfile').style.display='none';
     document.getElementById('detailsForm').style.display='block';

        }

    function accountValidation(){

    // checks if user has signed in using google or manual sign in
    if (authProvider === 'google.com'){
        alert(t("manual_pass"));
    }
    else{
           document.getElementById('userOptions').style.display='none';
    document.getElementById('userProfile').style.display='none';
    document.getElementById('accountValidation').style.display='block';
              fetch("send_password_reset", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user: oldEmail, lang: i18n.language}),
    })
      .then(response => response.text())
      .then(data => {
      })
      .catch(error => {

        console.error('Error:', error);
      });
    }

    }

    // validates password verification code
    function validUser(){

           fetch("validate_user", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user: oldEmail, input: passCodeInput}),
    })
      .then(response => response.json())
      .then(data => {
            if(data.length > 0){
                if (data[0]['result'] == "code match"){
                    document.getElementById("passCode").value = "";
                    document.getElementById('accountValidation').style.display='none';
                    document.getElementById('passwordChange').style.display='block';
                    document.getElementById("passChange1").value = "";
                    document.getElementById("passChange2").value = "";
                    setValid(false);
                }
                    else{
                    alert(t("wrong_verif"))
                }

            }
      })
      .catch(error => {
        alert(t("wrong_verif"))
        console.error('Error:', error);
      });

    }

    function discountCodeEntry(){
      document.getElementById('userOptions').style.display='none';
    document.getElementById('userProfile').style.display='none';
      document.getElementById('discountCodeEntry').style.display='block';
    }

    function mainProfile(){
         document.getElementById('userOptions').style.display='block';
    document.getElementById('orderHistory').style.display='none';
    document.getElementById('userProfile').style.display='block';
     document.getElementById('accountValidation').style.display='none';
      document.getElementById('discountCodeEntry').style.display='none';
      document.getElementById('detailsForm').style.display='none';
    }

     function search(){
        let searchTerm = document.getElementById('search_input').value;
        if (searchTerm !== ""){
             setMyVariable(searchTerm);
             navigate("/item", {replace: false});
        }
        else{
            alert(t("empty"))
        }
    }

    function orderHistory(){
    document.getElementById('userOptions').style.display='none';
    document.getElementById('orderHistory').style.display='block';
    document.getElementById('userProfile').style.display='none';
        fetch("get_order_history?user=" + currentUser + "&lang=" + i18n.language, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(data => {
          console.log(data);
         if(data.length > 0){
          document.getElementById('orderView').style.display='block';
             setProductList(data);
         }
         else{
            document.getElementById('noHistory').style.display='block';
            document.getElementById('orderView').style.display='none';
         }
      })
      .catch(error => {
        console.error('Error:', error);
      });
    }

function getDetails(cUser){
    if (cUser){
  fetch("get_details?user=" + cUser, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(data => {
            if (data){
                setName(data[0].name);
                setALine1(data[0].addr_line_one);
                setPostcode(data[0].postcode);
                setCity(data[0].city);
                setCountry(data[0].country);
                setOEmail(data[0].email);
                setEmail(data[0].email);
                setDiscord(data[0].discord);
                setGT(data[0].gamertag);
                 if (data[0].preference == "PS5 Games"){
            setPref(t("ps_user"));

        }
        else if(data[0].preference == "Xbox Games"){
             setPref(t("x_user"));
        }
        else{
              setPref(t("n_user"));
        }
            }
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }
}

     useEffect(() => {
    fetch("/get_product_inventory/all/user" + "/" + i18n.language)
        .then(response => response.json())
        .then(data => {
          //  https://firebase.google.com/docs/auth/web/manage-users#get_the_currently_signed-in_user
            const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
       const userEmail = user.email;
      const provider = user.providerData[0]['providerId'];
      setUser(userEmail);
      setProvider(provider);
      getDetails(user.email);
    } else {
      console.log('No user is signed in');
    } });
    return () => unsubscribe();
        });
}, []);

     useEffect(() => {
    const applyStyles = () => {
      const currentLocale = i18n.language;

      if (currentLocale === 'fr') {
        frenchStyling();
      } else {
        englishStyle();
      }
    const selectElement = document.getElementById('transProfile');
    if (selectElement) {
      selectElement.value = currentLocale;
    }
    };
    applyStyles();
  }, [i18n.language]);

       const changeLang = lng => {
           i18n.changeLanguage(lng.target.value);
           if (document.getElementById('orderHistory').style.display=='block'){
                orderHistory();
           }
             if (lng.target.value === "en") {
                    englishStyle();
             }
             else {
                   frenchStyling();
            }
       }

    return (
        <div>
             <NavBar/>
               <FontAwesomeIcon className='searchCl' icon={faMagnifyingGlass} onClick={search}/>
                <input type='text' id='search_input' placeholder={t('search_p')}/>
             <img src={landingpic} alt='landing background' id='landingpic'/>
             <div id='overlay'>
             <select id='transProfile' onChange={(e) => changeLang(e)}><option value="en">EN</option><option value="fr">FR</option></select>
               <div id='detailsForm'>
            <form>
             <i>{t("name")}</i>
             <br/>
             <br/>
             <input type='text' id='nameEntry' value={name} className='detailInput' onChange={(e) => setName(e.target.value)}/>
              <br/>
             <br/>
             <i>Email</i>
             <br/>
             <input type='text' id='oldEmail' value={newEmail} className='detailInput' onChange={(e) => setEmail(e.target.value)}/>
             <br/>
             <br/>
               <b>{t("addr")}</b>
               <br/>
               <br/>
               <i>{t("addr-1")}</i>
                <br/>
               <br/>
                {/* Address Autofill */}
                {/* https://docs.mapbox.com/mapbox-search-js/tutorials/add-address-autofill-with-react/ */}
                <AddressAutofill accessToken="pk.eyJ1Ijoiam1jZ3Vja2luLTEiLCJhIjoiY2xyb3gyZ2kzMWsxNjJ4azBmMnE1NTVpaiJ9.5Rhns9IU2aAMs6rgAzMfzA">
               <input type='text' autocomplete="address-line1" id='addr-input' value={addrLineOne} onChange={(e) => setALine1(e.target.value)}/>
               </AddressAutofill>
                <br/>
                <br/>
                <i>{t("addr-2")}</i>
                 <br/>
               <br/>
               <input type='text' autocomplete="address-line2" id='addr-input' onChange={(e) => setALineTwo(e.target.value)}/>
                 <br/>
                 <br/>
                <i>{t("city")}</i>
                 <br/>
               <br/>
               <input type='text' autocomplete="address-level2"  value={city} onChange={(e) => setCity(e.target.value)}/>
                  <i id='countryLabelNew'>{t("country")}</i>
                 <br/>
               <br/>
               <input type='text' autocomplete="country-name" id='countryInputNew' value={country} onChange={(e) => setCountry(e.target.value)}/>
               <br/>
                  <i>{t("postcode")}</i>
                   <br/>
               <br/>
               <input type='text' autocomplete="postal-code" id='postcode' value={postcode} onChange={(e) => setPostcode(e.target.value)}/>
                <br/>
               <br/>
            </form>
             {/* Optional Data, not necessary to proceed*/}
             {/* game preferences, discord username. */}
             <div id='opt'>

               <p>{t("optional")}</p>
               <br/>
             <i>Gamertag</i>
             <br/>
               <br/>
               <input type='text' value={gamerTag} id='gamertag' onChange={(e) => setGT(e.target.value)}/>
               <br/>
               <br/>
                 <i>{t("discord_u")}</i>
                 <br/>
               <br/>
               <input type='text' value={discord} id='discord_entry' onChange={(e) => setDiscord(e.target.value)}/>
               <br/>
               <br/>
               <p id='prefText' style={{whiteSpace: "pre-line"}}>{t("pref")}</p>
               <select id='pref'>
               <option value='PS5 Games'>PS5</option>
               <option value='Xbox Games'>Xbox</option>
               <option value='Nintendo Switch Games'>Nintendo</option>
               </select>

             </div>

            <button id='backProf' className='button-44' onClick={() => mainProfile()}>{t("backProf")}</button>
            <button id='changeD' className='button-44'onClick={() => changeDetails()}>{t("change")}</button>
            </div>

            <div id='userProfile'>
             <p id='edit' onClick={displayDetails}>{t("edit")}</p>
             <FontAwesomeIcon className='profileIcon' icon={faUser} />
             <p id='displayName'>{t("name")}: {name}</p>
             <p id='displayEmail'>Email: {oldEmail}</p>
             <p id='gameTag'>{gamerTag} - {prefUser}</p>
             <p id='discord'><img src={disLogo} alt='discord logo' id='disLogo'/> {discord}</p>
            </div>

            <div id='userOptions'>
            <div id='order_h' onClick={() => orderHistory()}>
             <p id='orderH'>{t("order_history")}</p>
             <FontAwesomeIcon className='optionsIcon' icon={faList} />
             <i id='order_m'>{t("order_m")}</i>
            </div>

             <div id='change_p' onClick={() => accountValidation()}>
             <p>{t("password")}</p>
             <FontAwesomeIcon className='optionsIcon' icon={faKey} />
             <i id='pass_m'>{t("change_m")}</i>
            </div>

            <div id='discount' onClick={() => discountCodeEntry()}>
             <p>{t("discounts")}</p>
             <FontAwesomeIcon className='optionsIcon' icon={faSterlingSign} />
             <FontAwesomeIcon className='optionsIcon' icon={faEuroSign} />
              <i id='discount_m'>{t("discount_m")}</i>
            </div>
            </div>
            </div>

            <div id='accountValidation'>
              <button className='button-44'  id='backBtn' onClick={() => mainProfile()}>{t("back")}</button>
            <p>{t("enter_v")} {oldEmail}</p>
            <input type='text' id='passCode'onChange={(e) => setInput(e.target.value)}/>
            <br/>
            <br/>
            <button id='validatePass' onClick={() => validUser()}>{t("validate")}</button>
            </div>

              <div id='discountCodeEntry'>
                <button className='button-44' id='backBtn' onClick={() => mainProfile()}>{t("back")}</button>
            <p>{t("enter_v")} {oldEmail}</p>
            <input type='text' id='disEntry' onChange={(e) => setDiscountCode(e.target.value)}/>
            <br/>
            <br/>
            <button onClick={() => validDiscount()} id='discountValidation'>{t("validate")}</button>
            </div>

            <div id='passwordChange'>
 <p>{t("change_p")}</p>
            <input type='password' id='passChange1' placeholder={t("enter_new")}  onChange={(e) => setPassword(e.target.value)}/>
            <br/>
            <br/>
             <input type='password'  id='passChange2' placeholder={t("validate_new")} onChange={(e) => setVP(e.target.value)}/>
             <br/>
             <br/>
            <button onClick={() => changePassword()}>{t("password")}</button>

                    <Alert
      message={t("alert.heading2")}
      className='alert'
      description={t("alert.message2")}
      type="error"
    />

             <Alert
      message={t("alert.heading1")}
      className='alert2'
      description={t("alert.message1")}
      type="error"
    />

       <span id='close' onClick={closeError}>X</span>
             <span id='closeP2' onClick={closePassStrength}>X</span>

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
					capital: t('capital'),
					match: t('match')
				}}
         />
            </div>

            <div id='orderHistory'>
            <button className='button-44' id='backBtnOH'onClick={() => mainProfile()}>{t("back")}</button>
             <span id='noHistory'>{t("no_orders")}</span>
            <div id='orderView'>
             {productList.map((product, index) => (
        <div key={index} className='pastOrder'>
            <div>
               <ul>

               {product.cart_items.map((orderItem, orderIndex) => (
                <li key={orderIndex} className='historyItems'>{orderItem}</li>
               ))}
               </ul>
               <div className='imageContainer'>
                 {product.images.map((orderItem, orderIndex) => (
                <img key={orderIndex} className='historyImages'src={orderItem} loading='lazy'></img>
               ))}
               </div>
                 {product.dates.map((dateItem, dateIndex) => (
                <span key={dateIndex} className='dateItems'>{dateItem}</span>
               ))}
               <br/>
            </div>
        </div>
      ))}
            </div>
          </div>

            </div>
    )
}
export default Profile;