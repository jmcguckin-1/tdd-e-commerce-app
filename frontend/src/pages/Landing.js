import NavBar from "../components/NavBar";
import "../App.css"
import {useEffect, useState} from 'react';
import {NavLink, useNavigate} from "react-router-dom";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faMagnifyingGlass} from "@fortawesome/free-solid-svg-icons";
import { getMyVariable, setMyVariable } from './landing_config';
import landingpic from "../images/pexels-garrett-morrow-682933.jpg"
import "../lang/i18n"
import {useTranslation} from "react-i18next";
function Landing() {

     setMyVariable('');
    const navigate = useNavigate();
      const {t, i18n} = useTranslation('landing');
   useEffect(() => {
    const applyStyles = () => {
      const currentLocale = i18n.language;
       const selectElement = document.getElementById('langLanding');
    if (selectElement) {
      selectElement.value = currentLocale;
    }
    };
    applyStyles();
  }, [i18n.language]);

  const changeLang = lng => {
           i18n.changeLanguage(lng.target.value);
           console.log(lng.target.value)
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
    return (
        <div id='landing'>
             <NavBar/>
             <FontAwesomeIcon className='search' icon={faMagnifyingGlass} onClick={search}/>
                <input type='text' id='search_input' placeholder={t(['search_p'])}/>
           <img src={landingpic} alt='landing background' id='landingpic'/>
            <div id='overlay'>
                <select id='langLanding' onChange={(e) => changeLang(e)}>
                     <option value="en">EN</option>
                    <option value="fr">FR</option></select>
              <h1 style={{ whiteSpace: 'pre-line' }}>{t("landing_text")}</h1>
                <NavLink to='/item'><button id='shop_all' className='button-44'>{t('button')}</button></NavLink>
            </div>

    </div>);
}
export default Landing