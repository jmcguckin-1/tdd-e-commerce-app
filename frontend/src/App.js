import logo from './logo.svg';
import './App.css'
import {Routes, Route} from 'react-router-dom';
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Landing from "./pages/Landing"
import Item from "./pages/Item"
import Transactions from "./pages/Transactions";
import Profile from "./pages/Profile";
import PS5Item from "./pages/PS5Item";
import XboxItem from "./pages/XboxItem";
import NSItem from "./pages/NSItem";
import OrderConfirmation from "./pages/OrderConfirmation";

const firebaseConfig = {
  apiKey: "AIzaSyDmOnVONq_ON694zYa7Yy-t9XiOcD61rrA",
  authDomain: "tdd-ecommerceapplication.firebaseapp.com",
  projectId: "tdd-ecommerceapplication",
  storageBucket: "tdd-ecommerceapplication.appspot.com",
  messagingSenderId: "612977209277",
  appId: "1:612977209277:web:5d24330e8fde25c8bfecd4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

function App() {
  return (
    <div className="App">
      <Routes>
    <Route path='/' element={<SignIn />} />
    <Route path='/signup' element={<SignUp />} />
        <Route path='/landing' element={<Landing />} />
         <Route path='/item' element={<Item />} />
         <Route path='/profile' element={<Profile/>} />
         <Route path='/transactions' element={<Transactions />} />
           <Route path='/ps5Item' element={<PS5Item />} />
           <Route path='/XboxItem' element={<XboxItem/>} />
           <Route path='/NSItem' element={<NSItem/>} />
           <Route path='/orderconf' element={<OrderConfirmation/>}/>
  </Routes>
    </div>
  );
}
export const auth = getAuth(app);
export const db = getFirestore(app);
export default App;
