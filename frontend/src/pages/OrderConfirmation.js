import NavBar from "../components/NavBar.js";
import {useEffect, useState} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faMagnifyingGlass} from "@fortawesome/free-solid-svg-icons";
import {auth, db} from "../App.js";
import { onAuthStateChanged } from 'firebase/auth';
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router-dom";
import landingpic from "../images/pexels-garrett-morrow-682933.jpg"
import { getMyVariable, setMyVariable } from './landing_config';

function OrderConfirmation(){

    const [currentUser, setUser] = useState("");
    const [cart, setCart] = useState([]);
    const {t, i18n} = useTranslation('transactions');
     const navigate = useNavigate();

    function toLanding(){
         navigate("/landing", { replace: true });
    }

      function search(){
        let searchTerm = document.getElementById('search_input').value;
        if (searchTerm !== ""){
             setMyVariable(searchTerm);
             navigate("/item", {replace: true});
        }
        else{
            alert(t("empty"))
        }
    }

    const changeLang = lng => {
           i18n.changeLanguage(lng.target.value);
       }

      useEffect(() => {
    fetch("/get_product_inventory/all/user" + "/" + i18n.language)
        .then(response => response.json())
        .then(data => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
       const userEmail = user.email;
      console.log("email: " + userEmail)
      setUser(userEmail);
    } else {
      console.log('No user is signed in');
    } });
    return () => unsubscribe();
        });
}, []);

// checks if the user has anything in their cart
 useEffect(() => {
        if(currentUser){
         fetch("get_cart_presence?user=" + currentUser, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(data => {
       if (data){
       console.log(data)
       let items = [];
        for (let i=0; i<data.length; i++){
            items.push(data[i]);
        }
        setCart(items);
       }
      })
      .catch(error => {
        console.error('Error:', error);
      });
        }

      }, [currentUser]);

        useEffect(() => {
    const applyStyles = () => {
      const currentLocale = i18n.language;
    const selectElement = document.getElementById('transLang');
    if (selectElement) {
      selectElement.value = currentLocale;
    }
    };
    applyStyles();
  }, [i18n.language]);

        // places the user's order
      useEffect(() => {
      if (currentUser && cart){
        fetch("/place_order", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({user: currentUser, final_cart: cart, lang: i18n.language}),
    })
      .then(response => response.text())
      .then(data => {

      })
      .catch(error => {
        console.error('Error:', error);
      });
      }

      }, [currentUser, cart]);



    return (
        <div>
        <NavBar/>
          <FontAwesomeIcon className='search' icon={faMagnifyingGlass} onClick={search}/>
                <input type='text' id='search_input' placeholder={t('search_p')}/>
         <select id='transLang' onChange={(e) => changeLang(e)}><option value="en">EN</option><option value="fr">FR</option></select>
          <img src={landingpic} alt='landing background' id='landingpic'/>
            <div id='overlay'></div>
        <div id='orderConf'>
          <h1>{t("confirmed")}</h1>
           <p>{t("order-conf1")} {currentUser} {t("order-conf2")} </p>
        </div>
        <button className='button-44' id='landingBtn'onClick={toLanding}>{t("again")}</button>

        </div>

    )

}

export default OrderConfirmation