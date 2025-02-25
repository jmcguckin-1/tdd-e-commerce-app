import {NavLink, useNavigate} from "react-router-dom";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faMagnifyingGlass, faUser, faCartPlus, faDoorOpen} from '@fortawesome/free-solid-svg-icons';
import "./navbar.css"
import {signOut} from 'firebase/auth'
import {Popconfirm, Card} from 'antd';
import { auth } from '../App.js';
import {useTranslation} from "react-i18next";
import {useEffect, useState} from "react";
import {setMyVariable, setNewCart} from "../pages/landing_config";
import { onAuthStateChanged } from 'firebase/auth';
import appLogo from "../images/app-logo.png"

function NavBar(){

  const [cart, setCart] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTotal, setTotal] = useState("");
  const [currentLength, setLength] = useState("");
  const [quantityList, setQL] = useState([]);
  const [cartValid, setValidity] = useState(false);

  function closeCart(){
    document.getElementsByClassName('cartContents')[0].style.display='none';
    document.getElementById('closeCart').style.display='none';
     document.getElementById('proceed').style.display='none';
  }

  function closeMenu(){
    document.getElementById('editCartMenu').style.display='none';
    document.getElementById('overlayMenu').style.display='none';
    document.getElementById('closeMenu').style.display='none';
  }

  const handleQuantityUpdate = (index, newValue) => {
    const newQuan = [...quantityList]
    newQuan[index] = newValue;
    setQL(newQuan);
  }


     useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            const userEmail = user.email;
            console.log("email: " + userEmail);
            setCurrentUser(userEmail);
        } else {
            console.log('No user is signed in');
        }
    });

    return unsubscribe;

}, [auth]);

   function changeQuantities(){
    let pid_list = [];
    let price_list = [];
      if (currentUser){
              fetch("get_cart_presence?user=" + currentUser, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(data => {
        if (data){
                if(data.length > 0){
                    setValidity(true);
                }
            for (let i=0; i<data.length; i++){
                pid_list.push(data[i]['productId']);
                price_list.push(data[i]['price']);
            }
      let blankQuan = false;
      let correctNumbers = true;

      for (let i=0; i<quantityList.length; i++){
          if(quantityList[i] == ""){
           alert(t("alert-invalid1"));
           blankQuan = true;
           break;
          }
          if (quantityList[i].length > 1 && quantityList[i] !== "10"){
           alert(t("alert-invalid3"));
           blankQuan = true;
           break;
          }
          const valid = /^[0-9]+$/.test(quantityList[i]);
          if(!valid){
           alert(t("alert-invalid2"));
           correctNumbers = false;
           break;
          }
          if(quantityList[i] > 10 || quantityList[i] < 0){
            alert(t("alert-invalid3"));
            correctNumbers = false;
            break;
          }
      }
      if (!blankQuan && correctNumbers){
         let new_list = [];
      for (let i=0; i<pid_list.length; i++){
        new_list.push({"productId": pid_list[i], "quantity": parseInt(quantityList[i]), "price": price_list[i]});
      }
            updateCartViaMenu(new_list);
      }
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
        }

   }

   function toLanding(){
    navigate("/landing", {replace:true});
   }

   function updateCartViaMenu(new_list){
                  fetch("update_cart_menu", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cart: new_list, user: currentUser}),
    })
      .then(response => response.text())
      .then(data => {
       alert(t("alert-success"));
       closeMenu();
       checkCart();
       if (window.location.pathname === '/transactions'){
            setNewCart(true);
            window.location.reload();
       }
      })
      .catch(error => {
        console.error('Error:', error);
      });
   }

   function checkCart(){
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
            if (data.length > 0){
                setValidity(true);
            }
            else{
                setValidity(false);
            }
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
         }
   }

  function checkout(){
    if (cartValid){
          navigate("/transactions", {replace: true});
    }
    else{
        alert(t("empty_cart"));
    }
  }

  function editCart(){
    if (cartValid){
         document.getElementById('editCartMenu').style.display='block';
    document.getElementById('overlayMenu').style.display='block';
     document.getElementById('closeMenu').style.display='block';
   document.getElementsByClassName('cartContents')[0].style.display='none';
   document.getElementById('closeCart').style.display='none';
   if (window.location.pathname == '/profile' || window.location.pathname == '/transactions'){
         document.getElementById('editCartMenu').style.width='50%';
   }
   else{
      document.getElementById('editCartMenu').style.width='45%';
   }
    }

    else{
         alert(t("empty_cart"));
    }

  }

  function cartContents(){
  checkCart();

        if (currentUser){
              fetch("get_cart_total?user=" + currentUser + "&lang=" + i18n.language, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(data => {
        console.log(data)
        if (data){
            setTotal(data[0].cart_total_price);
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
        }


       fetch("get_cart_contents?user=" + currentUser + "&lang=" + i18n.language, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(data => {
       setCart(data);
       document.getElementsByClassName('cartContents')[0].style.display='block';
       document.getElementById('proceed').style.display='block';
        document.getElementById('closeCart').style.display='block';
        let quantities = [];
        for (let i=0; i<data.length; i++){
            quantities.push(data[i]['chosen_quantity']);
            console.log(quantities[i]);
        }
        setQL(quantities);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }

  const {t, i18n} = useTranslation('landing');
     async function handleNavClick(){
        setMyVariable('');
        if (window.location.pathname === '/item'){
        window.location.reload();
        }
    }
    const [pLinkStyle, setPLinkStyle] = useState({});
     const navigate = useNavigate();
    const [logout, setLogout] = useState(false);
    const confirm = async (e) => {
  console.log(e);
   try{
          await signOut(auth);
          setLogout(true);
          navigate("/", {replace: true})
    } catch(error){
            console.log(error)
        }
};
const cancel = (e) => {
  console.log(e);
  setLogout(false)
};

 useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const userEmail = user.email;
      setCurrentUser(user.email);
    }
      checkCart();
    const newStyle = { padding: i18n.language === 'fr' ? '0.4%' : '3%' };
    setPLinkStyle(newStyle);
  }, [i18n.language]);

    return (
        <div id='nav_bar'>
           <img src={appLogo} alt='logo' id='logo' onClick={toLanding}/>
            <div id='links'>
             <p id='cartLength'>{currentLength}</p>
                <NavLink to='/ps5item' id='ps5Link' className='navlinks'>PS5</NavLink>
            <NavLink to='/XboxItem' id='xbLink' className='navlinks'>Xbox</NavLink>
            <NavLink to='/NSItem' id='nsLink' className='navlinks'>Nintendo</NavLink>
            <NavLink to='/item' id='pLink' className='navlinks' style={pLinkStyle} onClick={handleNavClick}>{t(['phones'])}</NavLink>
                {/* https://fontawesome.com/icons/user?f=classic&s=solid */}
                <NavLink to='/profile' ><FontAwesomeIcon className='profile' id='profileIcon' icon={faUser} /></NavLink>
                {/* https://fontawesome.com/icons/cart-plus?f=classic&s=solid */}
                 <FontAwesomeIcon className='cart' icon={faCartPlus} onClick={cartContents}/>
                 <div id='overlayMenu'>
                 <div id='editCartMenu'>
                 <p id='closeMenu' onClick={closeMenu}>X</p>
                 <p>{t("cart_menu")}</p>
                 {cart.map((product, index) => (
    <div key={index} style={{ marginBottom: '10px' }}>
      <b>{product.name}</b>
      <br />
      <i>{product.category}</i>
      <br />
      <input className='inputQuan' onChange={(e) => handleQuantityUpdate(index, e.target.value)} value={quantityList[index]}/><b>x {product.price}</b>
      <br/>
      <img src={product.image_url} className='editImage'/>
    </div>
  ))}
    <button className='button-44' id='changeQuan' onClick={changeQuantities}>{t("edit_quan")}</button>
                 </div>
                   </div>

        <span id='closeCart' onClick={closeCart}>X</span>
        {/* https://ant.design/components/card */}
       <Card
  title={t('cart')}
  className="cartContents"
  bordered={false}
  style={{
    width: 300,
  }}
>
  {cart.map((product, index) => (
    <div key={index} style={{ marginBottom: '10px' }}>
      <b>{product.name}</b>
      <br />
      <i>{product.category}</i>
      <br />
      <b>{product.chosen_quantity} x {product.price}</b>
    </div>
  ))}
      <div id='proceed'>
         <span id='total_price'>Total: {currentTotal}</span>
         <button id='editCart' onClick={editCart}>{t("edit")}</button>
         <button id='checkout' onClick={checkout}>{t('checkout')}</button>
     </div>

</Card>

{/* https://ant.design/components/popconfirm */}
                     <Popconfirm
    title={t(['l_title'])}
    className='popup'
    description={t(['log_out'])}
    onConfirm={confirm}
    onCancel={cancel}
    okText={t(['ok'])}
    cancelText={t(['no'])}
  >
                {/* https://fontawesome.com/icons/door-open?f=classic&s=solid */}
                <FontAwesomeIcon icon={faDoorOpen} className='logout'/>
                 </Popconfirm>
            </div>
        </div>
    );
}
export default NavBar