import NavBar from "../components/NavBar";
import {useEffect, useState} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {auth, db} from "../App.js";
import "../Sem2.css";
import {Popconfirm} from 'antd';
import { AddressAutofill } from '@mapbox/search-js-react';
import {useTranslation} from "react-i18next";
import { onAuthStateChanged, updateEmail } from 'firebase/auth';
import paypal from "../images/paypal-seeklogo.png";
import {getCart} from "../pages/landing_config"
import landingpic from "../images/pexels-garrett-morrow-682933.jpg"
import { collection, getDocs } from "firebase/firestore";
import {faMagnifyingGlass} from "@fortawesome/free-solid-svg-icons";
import { getMyVariable, setMyVariable } from './landing_config';
import {useNavigate} from 'react-router-dom';

function Transactions(){

     const navigate = useNavigate();
     const [currentUser, setUser] = useState(null);
     const [currentEmail, setEmail] = useState("");
     const [oldEmail, setOEmail] = useState(currentUser);
     const [currentName, setName] = useState("");
     const [addrLineOne, setALine1] = useState("");
     const [addrLine2, setALineTwo] = useState("");
     const [city, setCity] = useState("");
     const [country, setCountry] = useState("");
     const [postcode, setPostcode] = useState("");
     const [cart, setCart] = useState([]);
     const [price, setPrice] = useState("");
     const [deliv, setDeliv] = useState("");
     const [authProvider, setProvider] = useState("");
     const [isChecked, setChecked] = useState(false);

      function productLang(x){
           for(let i=0; i<cart.length; i++){
                    if (cart[i]['delivery'] != 'standard'){
                        cart[i]['delivery'] = t('free');
                    }

                  if (cart[i]['category'].includes("PS5")){
                         cart[i]['category'] = t('ps');
                    }
                    else if (cart[i]['category'].includes("Nintendo Switch")){
                         cart[i]['category'] = t('nin');
                    }
                    else if (cart[i]['category'].includes("Xbox")){
                         cart[i]['category'] = t('xbox');
                     }
                 }

             if (x === "en") {

                for(let i=0; i<cart.length; i++){
                    cart[i]['price'] = cart[i]['price'].replace('€', '£');
                }
                 let newPrice = price.replace('€', '£');
                setPrice(newPrice);

                  let newDeliv = deliv.replace('€', '£');
                setDeliv(newDeliv);

            }
        else {
          for(let i=0; i<cart.length; i++){
                     cart[i]['price'] = cart[i]['price'].replace('£', '€');
                }
                let newPrice = price.replace('£', '€');
                setPrice(newPrice);

                  let newDeliv = deliv.replace('£', '€');
                setDeliv(newDeliv);
        }
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

     function englishStyle(){
            document.getElementById("step1").style.fontSize = "40px";
         document.getElementById("step2").style.fontSize = "40px";
          document.getElementById("step2").style.left = "55%";
           document.getElementById("backInfo").style.width = "20%";
     }
  function handleCheckboxChange(){
    if (document.getElementById("discountUse").checked){
        setChecked(true);
    }
    else{
        setChecked(false);
    }
  }

      function frenchStyling(){
        document.getElementById("step1").style.fontSize = "35px";
         document.getElementById("step2").style.fontSize = "35px";
          document.getElementById("step2").style.left = "63%";
           document.getElementById("backInfo").style.width = "22%";
     }

      const {t, i18n} = useTranslation('transactions');
        useEffect(() => {
    const applyStyles = () => {
      const currentLocale = i18n.language;

      if (currentLocale === 'fr') {
        frenchStyling();
      } else {
        englishStyle();
      }
    const selectElement = document.getElementById('transLang');
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
                    productLang("en");
                }
        else {
            frenchStyling();
              productLang("fr");
        }
       }
     function applyDiscount(){
      if(document.getElementById('discountUse').checked){
              fetch("apply_discount_code", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user: currentUser, price: price, lang: i18n.language}),
    })
      .then(response => response.json())
      .then(data => {
            if(data.length > 0){
               if(data[0].new_price){
                 setPrice(data[0].new_price);
                 alert(t("discount_alert") + data[0].new_price);
                 document.getElementById('discountUse').style.display='none';
                 document.getElementById('closePayment').style.display='none';
                 document.getElementById('discountLbl').style.display='none';
               }
            }
            else{
                 alert(t("no_code"));
            }
      })
      .catch(error => {
        console.error('Error:', error);
      });
      }

     }

     function closePayment(){
      document.getElementById('paymentPopup').style.display='none';
       document.getElementById('closePayment').style.display='none';
      document.getElementsByClassName('overlay-payment')[0].style.display='none';
     }

     function paymentDisplay(){
        document.getElementById('purchaseForm').style.display = 'none';
        document.getElementsByClassName('orderDisplay')[0].style.display = 'block';
        document.getElementById('placeOrder').style.display = 'block';
        document.getElementById('step1').style.color = 'rgba(255,255,255,0.6)';
        document.getElementById('step2').style.color = 'white';
        document.getElementById('backInfo').style.display = 'block';
        document.getElementById('nextPay').style.display = 'none';
     }

       function infoDisplay(){
        document.getElementById('purchaseForm').style.display = 'block';
        document.getElementsByClassName('orderDisplay')[0].style.display = 'none';
        document.getElementById('placeOrder').style.display = 'none';
        document.getElementById('step2').style.color = 'rgba(255,255,255,0.6)';
        document.getElementById('step1').style.color = 'white';
        document.getElementById('backInfo').style.display = 'none';
        document.getElementById('nextPay').style.display = 'block';
     }

     async function openPayment(){
      let info = [currentName, currentEmail, addrLineOne, city, country, postcode];
     let blank = false;
     let validDetails = true;

     for (let i=0; i<info.length; i++){
        if(info[i] === ""){
        alert(t("blank_entry"));
        blank = true;
        break;
        }
     }

          if (authProvider === 'google.com' && currentEmail != currentUser){
        alert(t("google-email"));
            validDetails = false;
        }

        if(currentEmail.substring(currentUser.length - 10) !== "@gmail.com"){
            alert(t("email_check"));
            validDetails = false;
        }

        if (currentUser !== currentEmail){
const usersCollection = collection(db, 'users');
const querySnapshot = await getDocs(usersCollection);

querySnapshot.forEach((doc) => {
  const userData = doc.data();
  const userEmail = userData.email;

  if (userEmail === currentEmail) {
    alert(`Email "${currentEmail}" ${t('already_exists')}`);
    validDetails = false;
    return;
  }
});

}

     if (price && !blank && validDetails){
         document.getElementById('paymentPopup').style.display='block';
      document.getElementById('closePayment').style.display='block';
      document.getElementsByClassName('overlay-payment')[0].style.display='block';
     }


     }

       const confirm = async (e) => {
  console.log(e);
   try{
        applyDiscount();
    } catch(error){
            console.log(error)
        }
};
const cancel = (e) => {
console.log(e);
};

     async function payPalPayment(x){
      if (price){
        let details_list =
        {"name": currentName,
        "email": currentUser,
        "addr_line_one": addrLineOne,
        "postcode": postcode,
        "city": city,
        "country": country};

      fetch("/get_product_inventory/all/user" + + "/" + i18n.language)
    .then(response => response.json())
    .then(data => {
        const user = auth.currentUser;
        if (user) {
            // https://firebase.google.com/docs/auth/web/manage-users#set_a_users_email_address
            updateEmail(user, currentUser)
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
      body: JSON.stringify({user: currentUser, details: details_list}),
    })
      .then(response => response.text())
      .then(data => {

      })
      .catch(error => {
        console.error('Error:', error);
      });

      let newPrice = price.substr(1, price.length);
      let moneyType = i18n.language == "en" ? "GBP" : "EUR";
      fetch("/process_paypal", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({amount: newPrice, currency: moneyType, method: x}),
    })
      .then(response => response.json())
      .then(data => {
        if(data){
             window.open(data[0].approval_url, "_self");
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
      console.log("email: " + userEmail)
       const provider = user.providerData[0]['providerId'];
      setUser(userEmail);
      setProvider(provider);
    } else {
      console.log('No user is signed in');
    } });
    return () => unsubscribe();
        });
}, []);


 useEffect(() => {
        if(currentUser){
         fetch("get_cart_contents?user=" + currentUser + "&lang=" + i18n.language, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(data => {
       if (data){
        setCart(data);
       }
      })
      .catch(error => {
        console.error('Error:', error);
      });
        }

      }, [currentUser]);

 useEffect(() => {
        if(getCart){
         fetch("get_cart_contents?user=" + currentUser, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(data => {
       if (data){
        setCart(data);
       }
      })
      .catch(error => {
        console.error('Error:', error);
      });
        }

      }, [getCart]);

  useEffect(() => {
  if (currentUser){
  fetch("get_details?user=" + currentUser, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(data => {
            if (data){
                setName(data[0].name);
                setEmail(data[0].email);
                  setALine1(data[0].addr_line_one);
                setPostcode(data[0].postcode);
                setCity(data[0].city);
                setCountry(data[0].country);
            }
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }

}, [currentUser]);

  useEffect(() => {
        if(currentUser){
         fetch("get_cart_total?user=" + currentUser +  "&lang=" + i18n.language, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(data => {
       if (data){
            setPrice(data[0].cart_total_price);
            setDeliv(data[0].deliv_charges);
       }
      })
      .catch(error => {
        console.error('Error:', error);
      });
        }

      }, [currentUser]);


    return (
        <div>
             <NavBar/>
              <FontAwesomeIcon className='searchCl' icon={faMagnifyingGlass} onClick={search}/>
                <input type='text' id='search_input' placeholder={t('search_p')}/>
              <img src={landingpic} alt='landing background' id='landingpic'/>
            <div id='overlay'></div>
             <select id='transLang' onChange={(e) => changeLang(e)}><option value="en">EN</option><option value="fr">FR</option></select>
            <div className='orderDisplay'>
                   {cart.map((product, index) => (
    <div key={index} className='orderItem'>
        <b>{product.name}</b>
      <br />
      <i>{product.category}</i>
      <br />
      <b>{product.chosen_quantity} x {product.price}</b>
      <br/>
      <img src={product.image_url}></img>
      <br/>
    </div>
  ))}
</div>
            <br/>
            <span id='step1'>{t("step-1")}</span>
            <span id='step2'>{t("step-2")}</span>
             <button className='button-44' id='nextPay' onClick={() => paymentDisplay()}>{t("next")}</button>
             <button className='button-44' id='backInfo' onClick={() => infoDisplay()}>{t("prev")}</button>
               <button id='placeOrder' className='button-44' onClick={openPayment}>{t("place")}</button>
                  <span onClick={closePayment} id='closePayment'>X</span>
                  <div className='overlay-payment'>
            </div>
            <div id='paymentPopup'>
             <p className='transPrice'>Total: {price}</p>
<p className='transPrice'>{t("std")} {deliv} (3.95 {t("std-2")})</p>
            <i id='paymentHeading'>{t("payment")}</i>
            <button onClick={() => payPalPayment("paypal")} id='paypalBtn'><img id='paypalimg' src={paypal} alt='paypallogo'/></button>
            <button onClick={() => payPalPayment("paypal")} id='cardBtn'>{t("card")}</button>
             <label id='discountLbl'>{t("discount-check")}</label>


                                 <Popconfirm
    title={t("discount_usage")}
    className='popup'
    description={t("confirm_usage")}
    onConfirm={confirm}
    onCancel={cancel}
    okText={t("ok")}
    cancelText={t("no")}
    visible={isChecked}
  >
         <input type='checkbox'
         id='discountUse'
         onChange={handleCheckboxChange}/>
            </Popconfirm>
            </div>
            <div id='purchaseForm'>
            <h2>{t("fill_details")}</h2>
            <h2 id='finalOrder'>{t("final_order")}</h2>
               <b>{t("info")}</b>
               <br/>
             <br/>
             <div id='detailsView'>
             <form>

                 <i id='nameLbl'>{t("name")}</i>
            <br/>
             <br/>
            <input type='text' id='nameEntry' value={currentName} onChange={(e) => setName(e.target.value)}/>
              <i id='emailH'>Email</i>
              <br/>
              <br/>
            <input type='text' value={currentEmail} id='emailInput' onChange={(e) => setEmail(e.target.value)}/>
               <br/>
               <b id='shipping'>{t("addr")}</b>
               <br/>
               <br/>
               <i>{t("addr-1")}</i>
                <br/>
               <br/>
                {/* Address Autofill */}
                {/* https://docs.mapbox.com/mapbox-search-js/tutorials/add-address-autofill-with-react/ */}
                <AddressAutofill accessToken="pk.eyJ1Ijoiam1jZ3Vja2luLTEiLCJhIjoiY2xyb3gyZ2kzMWsxNjJ4azBmMnE1NTVpaiJ9.5Rhns9IU2aAMs6rgAzMfzA">
               <input type='text' autocomplete="address-line1"  value={addrLineOne} id='addr-input' onChange={(e) => setALine1(e.target.value)}/>
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
               <input type='text' autocomplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)}/>
                  <i id='countryLabel'>{t("country")}</i>
                 <br/>
               <br/>
               <input type='text' autocomplete="country-name"  value={country} id='countryInput' onChange={(e) => setCountry(e.target.value)}/>
               <br/>
                  <i>{t("postcode")}</i>
                   <br/>
               <br/>
               <input type='text' autocomplete="postal-code" id='postcode' value={postcode} onChange={(e) => setPostcode(e.target.value)}/>
                <br/>
               <br/>
                </form>

             </div>

            </div>
        </div>
    )
}
export default Transactions;