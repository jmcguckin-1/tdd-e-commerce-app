import NavBar from "../components/NavBar";
import {useEffect, useState} from "react";
import {useNavigate} from 'react-router-dom'
import "../App.css"
import "../Sem2.css"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faMagnifyingGlass, faFilter} from "@fortawesome/free-solid-svg-icons";
import {Spin, Slider, Switch, InputNumber, Tooltip} from 'antd';
import landingpic from "../images/pexels-garrett-morrow-682933.jpg";
import { getMyVariable, setMyVariable } from './landing_config';
import { auth, db } from '../App.js';
import { onAuthStateChanged } from 'firebase/auth';
import {useTranslation} from "react-i18next";
import notfound from "../images/notfound.jpg";

function Item(){
    const [productInventory, setPI] = useState([]);
    const [searchClicked, setSC] = useState(false);
    const [searchItem, setSearchItem] = useState("all");
    const [filtered, setFiltered] = useState(false);
    const [priceRange, setPriceRange] = useState([45,100]);
    const [currentName, setName] = useState("");
    const [currentDesc, setDesc] = useState("");
    const [currentPrice, setPrice] = useState("");
    const [currentSrc, setSrc] = useState("");
    const [currentQuantity, setQ] = useState(3);
    const [quantity, setQuan] = useState(0);
    const [currentDelivery, setDelivery] = useState("");
    const [currentCategory, setCategory] = useState("");
    const [currentUser, setUser] = useState(null);
    const [productID, setID] = useState("");
    const [currentCart, setCart] = useState(false);
    const [filterCategories, setFC] = useState([]);
    const [filterDeliveries, setFD] = useState([]);
    const [categoryDisplay, setCategoryDisp] = useState("");
    const [delivDisplay, setDelivDisp] = useState("");
    const [sortFirst, setSort] = useState(false);
    const [filterFirst, setFilterFirst] = useState(false);
    const [stocked, setItemStocked] = useState(true);
    const [key, setKey] = useState("");
    const [nonEmptyCart, setValid] = useState(false);
    const [actualQuantity, setAQ] = useState(0);
    const navigate = useNavigate();

    const {t, i18n} = useTranslation('item');

    function setPriceCatLang(){
          let category = productInventory[key]['category'].replace(/\\n/g, '\n');
          setCategory(category);
          let price = productInventory[key]['price'].replace(/\\n/g, '\n');
          setPrice(price);
    }

    function frenchStyling(){
        document.getElementById('sort').style.left = "67%";
         document.getElementById('filterBar').style.padding = "2.5%";
         document.getElementById('clearChoices').style.width = "13.5%";
          document.getElementsByClassName('searchRes')[0].style.fontSize = "20px";
          document.getElementById('clearChoices').style.left = "79%";
          document.getElementById('filterForm').style.marginLeft = "6%";
           document.getElementById('refine').style.left = "79.5%";
            document.getElementById('back').style.top = "-10%";
        if (document.getElementById('sort').style.display === 'none'){
        document.getElementsByClassName('quantityVal')[0].style.left = "58%";
        }
    }
     function englishStyling(){
        document.getElementById('sort').style.left = "70%";
         document.getElementById('filterBar').style.padding = "4%";
          document.getElementsByClassName('searchRes')[0].style.fontSize = "22px";
         document.getElementById('back').style.top = "-12%";
         document.getElementById('clearChoices').style.width = "12%";
          document.getElementById('clearChoices').style.left = "81%";
           document.getElementById('filterForm').style.marginLeft = "0%";
            document.getElementById('refine').style.left = "81%";
         if (document.getElementById('sort').style.display === 'none'){
            document.getElementsByClassName('quantityVal')[0].style.left = "56%";
         }

    }

    function productLang(x){
           for(let i=0; i<productInventory.length; i++){

                         if (productInventory[i]['category'].includes("PS5")){
                              productInventory[i]['category'] = t('ps');
                         }
                    else if (productInventory[i]['category'].includes("Nintendo Switch")){
                        productInventory[i]['category'] = t('nin');
                   }
                    else if (productInventory[i]['category'].includes("Xbox")){
                        productInventory[i]['category'] = t('xbox');
                   }
                      if (productInventory[i]['delivery'] != 'standard'){
                        productInventory[i]['delivery'] = t('free');
                        }

                    }


             if (x === "en") {
               englishStyling();
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
         frenchStyling();
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

       const changeLang = lng => {
           i18n.changeLanguage(lng.target.value);
           productLang(lng.target.value);
           changeFilterDisplayLang();
       }

     let landingSearch = getMyVariable() !== ''
 useEffect(() => {
       fetch(landingSearch ? "/search/" + getMyVariable() + "/" + i18n.language : "/get_product_inventory/all/user" + "/" + i18n.language)
        .then(response => response.json()
        .then(data => {
             //  https://firebase.google.com/docs/auth/web/manage-users#get_the_currently_signed-in_user
                 const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
       const userEmail = user.email;
      setUser(userEmail);

    } else {
      console.log('No user is signed in');
    }
    return () => unsubscribe();
  });
        })
      )}, []);

         useEffect(() => {
         if(currentUser){
            getCartList(currentUser);
         }
  }, [currentUser]);

   // Retrieves product inventory
       useEffect(() => {
        fetch(landingSearch ? "/search/" + getMyVariable() + "/" + i18n.language : "/get_product_inventory/all/" + currentUser + "/" + i18n.language)
        .then(response => response.json()
        .then(data => {
            if(currentUser){
                setFilterFirst(false);
                 if (landingSearch){
                document.getElementsByClassName('itemLength')[0].style.display='block';
             document.getElementById('noProducts').style.display='none';
            setPI(data);
              setTimeout(function() {
                  document.getElementById('loading_screen').style.display='none';
             }, 2000);
             setSC(false);
            if(data.length === 0){
                document.getElementById('noProducts').style.display='block';
                document.getElementsByClassName('itemLength')[0].style.display='none';
            }
               setMyVariable('');
            }
            else{
            document.getElementById('loading_screen').style.display='block';
                   setPI(data);

                    setTimeout(function() {
                  document.getElementById('loading_screen').style.display='none';
             }, 2000);

            }
            }
        })

      )}, [currentUser]);

  // Allows user to proceed to checkout, as long as they have items in their cart
  function checkout(){
     if (nonEmptyCart){
        navigate("/transactions", {replace: true});
     }
     else{
        alert(t("empty_cart"));
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

        // checks if the user has a cart or not
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
           // prevents poor quantity entry
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
         // different messages based on new cart creation or updating
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
            // out of stock alert message
            alert(currentName + t("out_stock"));
        }
    }

    function displayFilter(){
        document.getElementById('filterBar').style.display = 'block';
        document.getElementById('overlay1').style.display = 'block';
    }

    // Dynamically Updates Filter Display Bubble Langs
    function changeFilterDisplayLang(){
      let translation = "";
      let transDeliv = "";
      let realCategory = false;
          if (categoryDisplay.includes("PS5")){
               translation +=  "(" + t("ps") + ") ";
               realCategory = true;
          }
          if (categoryDisplay.includes("Xbox")){
               translation +=  "(" + t("xbox") + ") ";
               realCategory = true;
          }
          if (categoryDisplay.includes("Nintendo")){
               translation +=  "(" + t("nin") + ") ";
               realCategory = true;
           }
           if (delivDisplay.includes("Free") || delivDisplay.includes("Gratuit")){
              transDeliv +=  "(" + t("free") + ") ";
           }
           if (delivDisplay.includes("standard")){
              transDeliv += "(standard)";
           }

           if (!delivDisplay.includes("standard") && !delivDisplay.includes("Free") && !delivDisplay.includes("Gratuit")){
            transDeliv = t('all_deliveries');
           }

          if (!realCategory){
            translation = t("all_cat");
          }

      setCategoryDisp(translation);
      setDelivDisp(transDeliv);
    }

    // displays item information page
    function displayInfo (e, key) {
         hideFilterDisplay();
        const currentLocale = i18n.language;
         let item = document.getElementsByClassName('grid-item')[key];
         let name = item.getElementsByTagName('b')[0].innerHTML;
         let price = productInventory[key]['price'];
         let category = item.getElementsByTagName('i')[0].innerHTML;
         let image = item.getElementsByTagName('img')[0].src;
         let desc = currentLocale === 'en' ? productInventory[key]['description'] : productInventory[key]['fr_desc'];
         let spaced = desc.replace(/\\n/g, '\n');
         console.log(spaced);
         let quantity = productInventory[key]['quantity'];
         let pid = productInventory[key]['id'];
         document.getElementsByClassName('productInfo')[0].style.display = 'block';
         setName(name);
         setID(pid);
         setKey(key);
         setPrice(price);
         setCategory(category);
         setDesc(spaced);
         setSrc(image);
         hideGrid();
         currentLocale == 'en' ? englishStyling() : frenchStyling();

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
     document.getElementsByClassName('filter')[0].style.display = 'none';
     document.getElementById('sort').style.display = 'none';
     document.getElementsByClassName('searchRes')[0].style.display = 'none';
     document.getElementsByClassName('itemLength')[0].style.display = 'none';
      document.getElementById('itemLang').style.left = "92%";
    }

    function displayGrid(){
    hideFilterDisplay();
     document.getElementsByClassName('productInfo')[0].style.display = 'none';
      document.getElementsByClassName('grid-container')[0].style.display = 'grid';
     document.getElementsByClassName('filter')[0].style.display = 'block';
     document.getElementById('sort').style.display = 'block';
     document.getElementsByClassName('searchRes')[0].style.display = 'block';
     document.getElementsByClassName('itemLength')[0].style.display = 'block';
      document.getElementById('itemLang').style.display = 'block';
      document.getElementById('itemLang').style.left = "2%";
      setItemStocked(true);
    }

 const onChange = values => {
  const minValue = values[0] < 40 ? 40 : values[0];

  const maxValue = values[1] < values[0] ? 41 : values[1];

  setPriceRange([minValue, maxValue]);
};

const quantityChange = value => {
  setQ(value);
};

     function filterProducts(){
         let choices = document.getElementsByClassName('checkbox');
         let categoryList = []
         let deliveryList = []
         let categoryStr = "";
         let delivStr = "";
          for (let i=0; i<choices.length; i++) {
              switch (choices[i].value) {
                  case "PS5 Games":
                  case "Nintendo Switch Games":
                  case "Xbox Games":
                      if (choices[i].checked) {
                          categoryList.push(choices[i].value);
                            if (choices[i].value.includes("PS5")){
                                 categoryStr +=  "(" + t("ps") + ") ";
                            }
                            else if(choices[i].value.includes("Xbox")){
                                 categoryStr +=  "(" + t("xbox") + ") ";
                            }
                            else if (choices[i].value.includes("Nintendo")){
                                 categoryStr +=  "(" + t("nin") + ") ";
                            }
                      }
                      break;
                  case "free":
                  case "standard":
                        if (choices[i].checked){
                        deliveryList.push(choices[i].value)
                         if (choices[i].value.includes("free")){
                             delivStr +=  "(" + t("free") + ") ";
                          }
                         else{
                            delivStr += "(" + choices[i].value + ") ";
                         }

                        }
                        break;
                  default:
                      break;
              }
          }
          setFC(categoryList);
          setFD(deliveryList);
          setCategoryDisp(categoryStr);
            setDelivDisp(delivStr);
          // handles sort, filter action
        if(sortFirst){
          let select = document.getElementById('sort');
        let term = select.value;
           setFilterFirst(false);
                  fetch("filter_and_sort", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ actions: ['sort', 'filter'], filter: [priceRange, categoryList, deliveryList], sort_term: term, lang: i18n.language}),
    })
      .then(response => response.json())
      .then(data => {
        if (data.length > 0){
             setPI(data);
        }
        else{
          document.getElementById('noFilter').style.display='block';
         setPI([]);
        }
           document.getElementById('catSpan').style.display = 'block';
        document.getElementById('delivSpan').style.display = 'block';
         document.getElementById('priceSpan').style.display = 'block';
        setFilterFirst(false);
        setSort(false);
        document.getElementById('filterBar').style.display = 'none';
          document.getElementById('overlay1').style.display = 'none';
      })
      .catch(error => {

        console.error('Error:', error);
      });
    }
        else{
           setFilterFirst(true);
            document.getElementById('loading_screen').style.display='block';
               fetch("filter", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ price: priceRange, category: categoryList, delivery: deliveryList, lang: i18n.language }),
    })
      .then(response => response.json())
      .then(data => {
      if (data.length > 0){
      document.getElementById('noFilter').style.display='none';
        setPI(data);
          setFiltered(false);
          setSearchItem("all");
          document.getElementById('filterBar').style.display = 'none';
          document.getElementById('overlay1').style.display = 'none';
          document.getElementById('catSpan').style.display = 'block';
          document.getElementById('delivSpan').style.display = 'block';
          document.getElementById('priceSpan').style.display = 'block';
      }
      else{
        document.getElementById('noFilter').style.display='block';
         setPI([]);
      }
        setTimeout(function() {
                  document.getElementById('loading_screen').style.display='none';
             }, 1000);

       // filter information display
       if(categoryStr != ""){
            document.getElementById('catSpan').innerHTML = categoryStr;
          }
          else{
             document.getElementById('catSpan').innerHTML = t("all_cat");
          }
           if(delivStr != ""){
            document.getElementById('delivSpan').innerHTML = delivStr;
          }
          else{
             document.getElementById('delivSpan').innerHTML = t('all_deliveries');
          }
        document.getElementById('filterBar').style.display = 'none';
          document.getElementById('overlay1').style.display = 'none';
      })
      .catch(error => {

        console.error('Error:', error);
      });
        }

    }

    function clearChoices(){
        let choices = document.getElementsByClassName('checkbox');
        for (let i=0; i<choices.length; i++){
            choices[i].checked = false;
        }
        hideFilterDisplay();
    }

    function hideFilter(){
        document.getElementById('filterBar').style.display = 'none';
        document.getElementById('overlay1').style.display = 'none';
    }

    function hideFilterDisplay(){
         document.getElementById('catSpan').style.display = 'none';
        document.getElementById('delivSpan').style.display = 'none';
         document.getElementById('priceSpan').style.display = 'none';
    }
  function search(){
         hideFilterDisplay();
         let searchTerm = document.getElementById('search_input').value
          displayGrid();
      if(searchTerm !== ""){
              setSearchItem(searchTerm);
       setSC(true);
       document.getElementById('loading_screen').style.display='block';
      }
      else{
          alert(t('empty'));
      }

    }

     useEffect(() => {
    if (searchClicked) {
        fetch("/search/" + searchItem + "/" + i18n.language, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
        )
        .then(response => response.json()
        .then(data => {
             document.getElementsByClassName('itemLength')[0].style.display='block';
             document.getElementById('noProducts').style.display='none';
            setPI(data);
             setSC(false);
             setTimeout(function() {
                  document.getElementById('loading_screen').style.display='none';
             }, 1000);
            if(data.length === 0){
                document.getElementById('noProducts').style.display='block';
                document.getElementsByClassName('itemLength')[0].style.display='none';
            }
        })
            .catch((error) => {
            console.log(error)
            }))
    }
  }, [searchClicked]);



   function sort(){
    document.getElementById('loading_screen').style.display='block';
    if(filterFirst){
       setSort(false);
         let select = document.getElementById('sort');
        let term = select.value;
                  fetch("filter_and_sort", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ actions: ['filter', 'sort'], filter: [priceRange, filterCategories, filterDeliveries], sort_term: term, lang: i18n.language }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.length > 0){
            setPI(data);
        }
       else{
          document.getElementById('noFilter').style.display='block';
         setPI([]);
       }
        document.getElementById('filterBar').style.display = 'none';
          document.getElementById('overlay1').style.display = 'none';
        setFilterFirst(false);
        setSort(false);
        setFC([]);
        setFD([]);
          document.getElementById('catSpan').style.display = 'block';
        document.getElementById('delivSpan').style.display = 'block';
         document.getElementById('priceSpan').style.display = 'block';
         setTimeout(function() {
                  document.getElementById('loading_screen').style.display='none';
             }, 1000);
      })
      .catch(error => {

        console.error('Error:', error);
      });
    }
        else{
           setSort(true);
           hideFilterDisplay();
           let select = document.getElementById('sort');
        let term = select.value;
        let category = "All";
          fetch("/sort/" + term + "/" + category + "/" + i18n.language , {
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
             }, 1000);
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
        }

  }

    return (
        <div>
        <NavBar/>
             <FontAwesomeIcon className='search' icon={faMagnifyingGlass} onClick={search}/>
                <input type='text' id='search_input' placeholder={t('search_p')}/>
            <h2 className='searchRes'>{t('results')} {searchItem} {t('products')}</h2>
            <h3 className='itemLength'>{productInventory.length} {t('found')}</h3>
            <span id='priceSpan'>{t("money")}{priceRange[0] + "-" + priceRange[1]}</span>
            <span id='catSpan'>{categoryDisplay}</span>
            <span id='delivSpan'>{delivDisplay}</span>
             <select id='itemLang' onChange={(e) => changeLang(e)}>
                    <option value="en">EN </option>
                    <option value="fr">FR</option></select>
            <div id='noProducts'>
                <h3>{t('no_res')} {searchItem}</h3>
                <p>{t('tips')}</p>
                <ul>
                    <li>{t('tip1')}</li>
                    <li>{t('tip2')}</li>
                </ul>
                <img src={notfound} alt='question mark' id='notFound'/>
            </div>
            <div id='noFilter'>
                <h3>{t("filter_pref")}</h3>
                <p>{t("combo")}</p>
                <ul>
                    <li>{t("tip1-filter")}</li>
                    <li>{t("tip2-filter")}</li>
                </ul>
                <img src={notfound} alt='question mark' id='notFound'/>
            </div>
            <select id='sort' onChange={(e) => sort()}>
                <option value='price-low'>{t('sort')}</option>
                <option value='price-low'>{t('price-low')}</option>
                 <option value='price-high'>{t('price-high')}</option>
                <option value='alpha'>{t('alphabet')}</option>
                <option value='age-high'>{t('age-high')}</option>
                <option value='age-low'>{t('age-low')}</option>
                <option value='trending'>{t('trend')}</option>
            </select>
            {/* Filtering Bar */}
             <div id='overlay1'></div>
            <div id='filterBar'>
                <p id='back' onClick={hideFilter}><span id='filterBack'><b>&#8592;</b></span> {t('back')}</p>
                <div id='filterForm'>
                     <h2>{t('choices')}</h2>
            <h3>{t('range')}</h3>
             <Slider className='slider' range defaultValue={[45, 100]}
             onChange={onChange} />
            <h3>{t('category')}</h3>
             <label>PlayStation</label> <input value='PS5 Games' id='PS5F'type='checkbox' className='checkbox'/>
                 <br/>
             <label>Xbox</label> <input value='Xbox Games' type='checkbox' id='XboxF' className='checkbox'/>
                 <br/>
            <label>Nintendo</label> <input value='Nintendo Switch Games' type='checkbox' id='NSF' className='checkbox'/>
                 <br/>
            <h3>{t('delivery')}</h3>
           <label>{t('free')}</label> <input id='free' value="free" type='checkbox' className='checkbox'/>
                <br/>
            <label>Standard</label> <input id='std' value="standard" type='checkbox' className='checkbox'/>
                <br/>
                <br/>
                <button className='button-44' id='clearChoices' onClick={clearChoices}>{t('clear')}</button>
                <br/>
                <button className='button-44' id='refine' onClick={filterProducts}>{t('refine')}</button>
                </div>
        </div>
            <button className='filter' onClick={displayFilter}>{t('filter')}<FontAwesomeIcon icon={faFilter}/></button>
             <div id='loading_screen'>
                <h1>{t("search_progress")}</h1>
                <Spin size='large'/>
                <h3>{t("loading")}</h3>
            </div>
            <div className="grid-container">
      {productInventory.map((product, index) => (
        <div className="grid-item" key={index}>
            <img className='productImage' src={product.image_url} alt='item image'
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
                <img id='productImage' alt='image' src={currentSrc}/>
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
export default Item;