import NavBar from "../components/NavBar";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faMagnifyingGlass} from "@fortawesome/free-solid-svg-icons";
import {InputNumber, Spin} from "antd";
import {useEffect, useState} from "react";
import {auth} from '../App.js';
import {useTranslation} from "react-i18next";
import {useNavigate} from 'react-router-dom';
import { getMyVariable, setMyVariable } from './landing_config';

function XboxItem(){

     const [searchClicked, setSC] = useState(false);
     const [searchItem, setSearchItem] = useState("all");
     const [key, setKey] = useState("");
     const [stocked, setItemStocked] = useState(true);
     const {t, i18n} = useTranslation('item');
    const [productInventory, setPI] = useState([]);
    const [currentName, setName] = useState("");
    const [currentDesc, setDesc] = useState("");
    const [currentPrice, setPrice] = useState("");
    const [currentSrc, setSrc] = useState("");
    const [currentQuantity, setQ] = useState(3);
    const [currentDelivery, setDelivery] = useState("");
    const [currentCategory, setCategory] = useState("");
    const [currentUser, setUser] = useState(null);
    const [productID, setID] = useState("");
    const [currentCart, setCart] = useState(false);
     const [nonEmptyCart, setValid] = useState(false);
    const [actualQuantity, setAQ] = useState(0);
      const navigate = useNavigate();

        function setPriceCatLang(){
          let category = productInventory[key]['category'].replace(/\\n/g, '\n');
          setCategory(category);
          let price = productInventory[key]['price'].replace(/\\n/g, '\n');
          setPrice(price);
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
        function checkout(){
     if (nonEmptyCart){
        navigate("/transactions", {replace: true});
     }
     else{
        alert(t("empty_cart"));
     }
  }

       // Retrieves product inventory
       useEffect(() => {
        fetch("/get_product_inventory/Xbox/user" + "/" + i18n.language)
        .then(response => response.json()
        .then(data => {
          document.getElementById('loading_screen').style.display='block';
          const user = auth.currentUser;
         if (user) {
      const userEmail = user.email;
      console.log("email: " + userEmail)
      setUser(userEmail);
    }
          setPI(data);
            setTimeout(function() {
                  document.getElementById('loading_screen').style.display='none';
             }, 1000);

        })
      )}, []);

           useEffect(() => {
    const applyStyles = () => {
      const currentLocale = i18n.language;

      if (currentLocale === 'fr') {
        frenchStyling();
      } else {
        englishStyling();
      }
    const selectElement = document.getElementById('itemLang');
    if (selectElement) {
      selectElement.value = currentLocale;
    }
    };
    applyStyles();
  }, [i18n.language]);

         function frenchStyling(){
        document.getElementById('sort').style.left = "67%";
        if (document.getElementById('sort').style.display === 'none'){
        document.getElementsByClassName('quantityVal')[0].style.left = "58%";
        }
    }
     function englishStyling(){
        document.getElementById('sort').style.left = "70%";
         if (document.getElementById('sort').style.display === 'none'){
            document.getElementsByClassName('quantityVal')[0].style.left = "56%";
         }
    }

     const changeLang = lng => {
           i18n.changeLanguage(lng.target.value);

                   for(let i=0; i<productInventory.length; i++){

                     if (productInventory[i]['delivery'] != 'standard'){
                        productInventory[i]['delivery'] = t('free');
                    }

                  if (productInventory[i]['category'].includes("PS5")){
                         productInventory[i]['category'] = t('ps');
                    }
                    else if (productInventory[i]['category'].includes("Nintendo Switch")){
                         productInventory[i]['category'] = t('nin');
                    }
                    else if (productInventory[i]['category'].includes("Xbox")){
                         productInventory[i]['category'] = t('xbox');
                    }
            }

             if (lng.target.value === "en") {
                for(let i=0; i<productInventory.length; i++){
                    productInventory[i]['price'] = productInventory[i]['price'].replace('€', '£');

                }
                if (document.getElementById('sort').style.display === 'none'){
                       let desc = productInventory[key]['description'].replace(/\\n/g, '\n');
                      setDesc(desc);
                      setPriceCatLang();
                }

         }
        else {
          for(let i=0; i<productInventory.length; i++){
                     productInventory[i]['price'] = productInventory[i]['price'].replace('£', '€');
                }
             if (document.getElementById('sort').style.display === 'none'){
                       let desc = productInventory[key]['fr_desc'].replace(/\\n/g, '\n');
                      setDesc(desc);
                       setPriceCatLang();
                }
        }
       }
     function displayInfo (e, key) {
     const currentLocale = i18n.language;
         let item = document.getElementsByClassName('grid-item')[key];
         let name = item.getElementsByTagName('b')[0].innerHTML;
         let price = productInventory[key]['price'];
         let category = item.getElementsByTagName('i')[0].innerHTML;
         let image = item.getElementsByTagName('img')[0].src;
         let desc = currentLocale === 'en' ? productInventory[key]['description'] : productInventory[key]['fr_desc'];
         let spaced = desc.replace(/\\n/g, '\n');
         let quantity = productInventory[key]['quantity'];
         let pid = productInventory[key]['id'];
         document.getElementsByClassName('productInfo')[0].style.display = 'block';
         setName(name);
         setID(pid);
         setPrice(price);
         setKey(key);
         setCategory(category);
         setDesc(spaced);
         setSrc(image);
         hideGrid();
         currentLocale == 'en' ? englishStyling() : frenchStyling();

              // Checks if a product is out of stock
          fetch("out_of_stock?product=" + pid, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(data => {
        if (data[0]['stock'] == 'out of stock'){
           setItemStocked(false);
            setAQ(0);
        }
         else{
            setAQ(data[0]['quantity']);
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });

                fetch("update_trending", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: pid}),
    })
      .then(response => response.text())
      .then(data => {
        console.log(data);
      })
      .catch(error => {
        console.error('Error:', error);
      });

    }
    function hideGrid(){
     document.getElementsByClassName('grid-container')[0].style.display = 'none';
     document.getElementById('sort').style.display = 'none';
     document.getElementsByClassName('searchRes')[0].style.display = 'none';
     document.getElementsByClassName('itemLength')[0].style.display = 'none';
      document.getElementById('itemLang').style.left = "92%";
    }

    const quantityChange = value => {
  setQ(value);
};

    function displayGrid(){
     document.getElementsByClassName('productInfo')[0].style.display = 'none';
      document.getElementsByClassName('grid-container')[0].style.display = 'grid';
     document.getElementById('sort').style.display = ' block';
     document.getElementsByClassName('searchRes')[0].style.display = 'block';
     document.getElementsByClassName('itemLength')[0].style.display = 'block';
      document.getElementById('itemLang').style.left = "2%";
    }

        useEffect(() => {
         if(currentUser){
            getCartList(currentUser);
         }
  }, [currentUser]);

      function getCartList(currentUser){
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
            if (data.length > 0){
                setValid(true);
                  setCart(true);
            }
            else{
                setValid(false);
            }
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
        }

    }

   function updateCart(){
    let existingCart = false;
       const obj = {
            user: currentUser,
  list: [
    {
        productId: productID,
        quantity: currentQuantity,
        price: currentPrice
    }
  ]
};       let cart;
        if (productID && currentQuantity){
        let updated = obj['list']
        if (currentCart){
            cart = updated
            existingCart = true;
        }
        else{
         cart = []
         cart.push(obj);
         setCart(true);
         existingCart = false;
        }
        }

        if(stocked){
         document.getElementById('closeCart').style.display = 'none';
          document.getElementsByClassName('cartContents')[0].style.display = 'none';
          if(actualQuantity < currentQuantity){
            alert(t("quan1") + actualQuantity + t("quan2") + t("quan3"));
         }
         else{
               fetch("update_cart", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cart: cart, user: currentUser}),
    })
      .then(response => response.text())
      .then(data => {
         if(existingCart){
            alert(t("cart_update"));
         }
         else{
             alert(t("cart_create"));
         }
         getCartList(currentUser);
      })
      .catch(error => {
        console.error('Error:', error);
      });
         }

        } else{
            alert(currentName + t("out_stock"));
        }
    }

   function sort(){
    document.getElementById('loading_screen').style.display='block';
        let select = document.getElementById('sort');
        let term = select.value;
        let category = "Xbox Games";
          fetch("/sort/" + term + "/" + category + "/" + i18n.language, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(data => {
        if (data){
           setPI(data);
               setTimeout(function() {
                  document.getElementById('loading_screen').style.display='none';
             }, 3000);
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }

    return (
        <div>

        <NavBar/>
             <FontAwesomeIcon className='search' icon={faMagnifyingGlass} onClick={search}/>
                <input type='text' id='search_input' placeholder={t('search_p')}/>
            <h2 className='searchRes'>{t("xbox")} {t('home')}</h2>
            <h3 className='itemLength'>{productInventory.length} Xbox One {t('found')}</h3>
              <div id='loading_screen'>
                 <h1>{t("search_progress")}</h1>
                <Spin size='large'/>
                <h3>{t("loading")}</h3>
            </div>
              <select id='itemLang' onChange={(e) => changeLang(e)}>
                    <option value="en">EN </option>
                    <option value="fr">FR</option></select>
            <select id='sort' onChange={(e) => sort()}>
               <option value='price-low'>{t('sort')}</option>
                <option value='price-low'>{t('price-low')}</option>
                 <option value='price-high'>{t('price-high')}</option>
                <option value='alpha'>{t('alphabet')}</option>
                <option value='age-high'>{t('age-high')}</option>
                <option value='age-low'>{t('age-low')}</option>
                <option value='trending'>{t('trend')}</option>
            </select>
         <div className="grid-container">
      {productInventory.map((product, index) => (
        <div className="grid-item" key={index}>
            <img className='productImage' src={product.image_url} alt='product art'
            loading='lazy'
            onClick={(e) => displayInfo(e, index)}
           />
            <div className='productDetails'>
                <b>{product.name} ({product.age_rating})</b>
            <br/>
             <i>{product.category}</i>
            <br/>
            <b>{product.price} - {product.delivery} {t('deliv')}</b>
            </div>
        </div>
      ))}
    </div>
             <div className='productInfo'>
                <p onClick={displayGrid} id='backSearch'>{t('back')}</p>
                <h1 id='productName'>{currentName}</h1>
                <h2 id='productCategory'>{currentCategory}</h2>
                <br/>
                <img id='productImage' alt='product art' src={currentSrc}/>
                <br/>
                <p id='enterQuan'>{t('quan')}</p>
                <InputNumber min={1} max={10} defaultValue={3} className='quantityVal' onChange={quantityChange} />
                <p id='currentStock'>{t("current_stock")}: {actualQuantity}</p>
                <p style={{ whiteSpace: 'pre-line' }} id='productDesc'>{currentDesc}</p>
                 <h3 id='productPrice'>{currentPrice}</h3>
                <button id='addCart' className='button-44' onClick={updateCart}>{t('add_cart')}</button>
                <button id='checkoutBtn' className='button-44' onClick={() => checkout()}>{t('checkout')}</button>
            </div>
        </div>
    )
}

export default XboxItem