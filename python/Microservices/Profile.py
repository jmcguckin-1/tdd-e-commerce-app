import smtplib

from Microservices.Search import Search
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import FieldFilter
from email.message import EmailMessage
import random
import ssl
import string


class Profile:

    def __init__(self):
        pass

    def get_user_details(self, user):
        if type(user) is not str:
            raise TypeError("Wrong type passed in for user (str)")
        if user == '':
            raise Exception("Users must have an email!")
        if user[-10:] != "@gmail.com":
            raise Exception("Emails should end in @gmail.com")

        # retrieves user data from database
        db = firestore.client()
        data = []
        ref = db.collection('users').where(filter=FieldFilter("email", "==", user)).get()
        if ref:
            for doc in ref:
                user = doc.to_dict()
                data.append(user)
            return data

    def change_details(self, user, details_list):
        # updates user data in the database
        db = firestore.client()
        if type(user) is not str or type(details_list) is not dict:
            raise TypeError("Wrong type passed in for user (str) or details_list (dict)")
        if user == '':
            raise ValueError("Users must have an email!")
        for key in ['email', 'name']:
            if details_list[key] == "":
                raise ValueError("Name and email should not be blank")
        if details_list['email'][-10:] != "@gmail.com":
            raise ValueError("Emails should end in @gmail.com")

        ref = db.collection('users').where(filter=FieldFilter("email", "==", user)).get()
        if ref:
            for doc in ref:
                doc_ref = db.collection('users').document(doc.id)
                doc_ref.update(details_list)
        ref1 = db.collection('cart').where(filter=FieldFilter("user", "==", user)).get()

        # updates cart reference
        if ref1:
            for doc in ref1:
                doc_ref = db.collection('cart').document(doc.id)
                doc_ref.update({"user": details_list['email']})

        # updates order references
        ref2 = db.collection('orders').where(filter=FieldFilter("user", "==", user)).get()
        if ref2:
            for doc in ref2:
                doc_ref = db.collection('orders').document(doc.id)
                doc_ref.update({"user": details_list['email']})

    def validate_user(self, user, verif_code):
        if type(user) is not str or type(verif_code) is not str:
            raise TypeError("Validate user only accepts strings!")
        if user == '':
            raise ValueError("Users must have an email!")
        if verif_code == '':
            raise ValueError("Input cannot be blank!")
        if len(verif_code) != 4:
            raise ValueError("Input must have a length of 4")

        db = firestore.client()
        data = []
        ref = db.collection('users').where(filter=FieldFilter("email", "==", user)).get()
        if ref:
            for doc in ref:
                user = doc.to_dict()
                doc_ref = db.collection('users').document(doc.id)
                # checks if the user has a valid password verification code
                if 'password_code' in user:
                    if verif_code == user["password_code"]:
                        data.append({"result": "code match"})
                        doc_ref.update({"password_code": firestore.DELETE_FIELD})
                    else:
                        data.append({"result": "code not matching"})
                else:
                    data.append({"result": "code does not exist"})
            return data

    def send_password_reset(self, user, lang):
        # sends password reset email
        if type(user) is not str:
            raise TypeError("Send password reset only accepts strings!")
        if user == '':
            raise ValueError("Users must have an email!")
        if lang == '':
            raise ValueError("Language must not be blank")
        if lang not in ['en', 'fr']:
            raise ValueError("Language must be fr or en")

        db = firestore.client()
        code = random.randint(1000, 9999)
        email_sender = "jmgaming2k24@gmail.com"
        code_word = "abtm bkln twaw pbmt"

        # handles lang change for email if required
        subject = "JMG Account Confirmation" if lang == 'en' else "Confirmation de compte JMG"
        greeting = "Hello" if lang == 'en' else "Bonjour"
        message = "Please enter this code on profile to change your password" if lang == 'en' else "Veuillez entrer ce code sur le profil pour changer votre mot de passe"
        end = "Thanks" if lang == 'en' else 'Merci'
        team = 'JMG Team' if lang == 'en' else "L'équipe JMG"
        body = f"""\
                     <html>
                     <head>
                     </head>
                       <body>
                         <h1>JMG</h1>
                         <p>{greeting}, {user}:</p>
                          <p>{message}</p>
                          <i>{code}</i>
                          <p>{end} <br/>{team}</p>
                         </div>

                       </body>
                     </html>
                     """
        em = EmailMessage()
        em['From'] = email_sender
        em['To'] = user
        em['Subject'] = subject
        em.set_content(body, subtype='html')

        context = ssl.create_default_context()
        with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context) as smtp:
            smtp.login(email_sender, code_word)
            smtp.sendmail(email_sender, user, em.as_string())

        ref = db.collection('users').where(filter=FieldFilter("email", "==", user)).get()
        if ref:
            for doc in ref:
                doc_ref = db.collection('users').document(doc.id)
                doc_ref.update({"password_code": f"{code}"})

    def get_order_history(self, user, lang):
        # loads past orders in the application
        fr_symbol = "€"
        if type(user) is not str:
            raise TypeError("Get Order History only accepts strings!")
        if user == '':
            raise Exception("must be a valid user!")
        if user[-10:] != '@gmail.com':
            raise Exception("Emails should end in @gmail.com")

        db = firestore.client()
        data = []
        ref = db.collection('orders').where(filter=FieldFilter("user", "==", user)).get()
        if ref:
            for doc in ref:
                order = doc.to_dict()
                # adds each order as a display dictionary
                order_display = {'cart_items': [], 'images': [], 'dates': []}
                items = order['cart']
                for i in range(0, len(items)):
                    pid = items[i]['productId']
                    price = items[i]['price']
                    if lang == 'fr':
                        price = fr_symbol + price[1:]

                    cart_item = db.collection('products').document(pid).get()
                    product_info = cart_item.to_dict()
                    category = product_info['category']
                    if lang == 'fr':
                        if "PS5" in category:
                            category = "Jeux PS5"
                        elif "Xbox" in category:
                            category = "Jeux Xbox"
                        else:
                            category = "Jeux Nintendo Switch"

                    order_display['cart_items'].insert(i,
                                                       f"{product_info['name']} ({product_info['age_rating']}) x {items[i]['quantity']} \n " \
                                                       f"{category} ({price})")
                    order_display['images'].insert(i, f"{product_info['image_url']}")
                order_display['dates'].append(f"{order['date']}")
                data.append(order_display)

        return data

    def generate_discount_code(self, user, lang):
        if type(user) is not str or type(lang) is not str:
            raise TypeError("Generate discount code only accepts strings!")
        if user == '':
            raise ValueError("Users must have an email!")
        if lang == '':
            raise ValueError("Language must not be blank")
        if lang not in ['en', 'fr']:
            raise ValueError("Language must be fr or en")

        db = firestore.client()
        length = 8

        # Generating random string with letters and numbers
        # https://www.geeksforgeeks.org/python-generate-random-string-of-given-length/
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
        subject = "JMG Discounts" if lang == 'en' else "Réductions JMG"
        greeting = "Hello" if lang == 'en' else "Bonjour"
        message = "Thank you for your loyalty to JMG, here's a 10% discount code" if lang == 'en' else "Merci de votre fidélité à JMG, voici un code de réduction de 10%"
        end = "Thanks" if lang == 'en' else 'Merci'
        team = 'JMG Team' if lang == 'en' else "L'équipe JMG"
        ref = db.collection('discount_codes').where(filter=FieldFilter("user", "==", user)).get()
        if ref:
            # updates current code entry if they used before
            for doc in ref:
                doc_ref = db.collection('discount_codes').document(doc.id)
                user_ref = db.collection('discount_codes').document(doc.id).get()
                user_item = user_ref.to_dict()
                user_item['code'] = str(code)
                doc_ref.update({"code": user_item['code']})
        else:
            # adds code for the first time, every 10 purchases
            ref = db.collection('users').where(filter=FieldFilter("email", "==", user)).get()
            if ref:
                for doc in ref:
                    user_ref = db.collection('users').document(doc.id).get()
                    user_item = user_ref.to_dict()
                    if user_item['num_purchases'] % 9 == 0:
                        db.collection("discount_codes").add({"user": user, "code": str(code)})

        email_sender = "jmgaming2k24@gmail.com"
        code_word = "abtm bkln twaw pbmt"
        body = f"""\
                            <html>
                            <head>
                            </head>
                              <body>
                                <h1>{subject}</h1>
                                <p>{greeting}, {user}:</p>
                                 <p>{message}</p>
                                 <i>{str(code)}</i>
                                 <p>{end} <br/> {team}</p>
                                </div>

                              </body>
                            </html>
                            """
        # Email sending comes from
        # https://www.youtube.com/watch?v=g_j6ILT-X0k
        em = EmailMessage()
        em['From'] = email_sender
        em['To'] = user
        em['Subject'] = subject
        em.set_content(body, subtype='html')

        context = ssl.create_default_context()
        with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context) as smtp:
            smtp.login(email_sender, code_word)
            smtp.sendmail(email_sender, user, em.as_string())

    def validate_code(self, user, code):
        if type(user) is not str or type(code) is not str:
            raise TypeError("Validate code only accepts strings!")
        if user == '':
            raise ValueError("Users must have an email!")
        if code == '':
            raise ValueError("Code must be entered!")
        if len(code) != 8:
            raise ValueError("Code must have a length of 8!")
        db = firestore.client()
        data = []
        ref = db.collection('discount_codes').where(filter=FieldFilter("user", "==", user)).get()
        if ref:
            for doc in ref:
                user = doc.to_dict()
                doc_ref = db.collection('discount_codes').document(doc.id)
                if 'code' in user:
                    if code == user["code"]:
                        data.append({"result": "code match"})
                        doc_ref.update({"code": firestore.DELETE_FIELD})
                        # update a status, discount code active
                        if 'discount_status' not in user:
                            user['discount_status'] = "Active"
                        doc_ref.update({"discount_status": user['discount_status']})
                    else:
                        data.append({"result": "code not matching"})
                else:
                    data.append({"result": "code does not exist"})

            return data

    def apply_discount_code(self, user, price, lang):
        money_symbol = "€" if lang == 'fr' else '£'
        db = firestore.client()
        if type(user) is not str or type(price) is not str:
            raise TypeError("Apply discount code only accepts strings!")
        if price == "" or user == "":
            raise ValueError("Neither variable should be blank!")
        if price[0] == "-":
            raise ValueError("Minus values are not allowed!")
        if price == "£0.00":
            raise ValueError("Price should not be 0!")

        data = []
        ref = db.collection('discount_codes').where(filter=FieldFilter("user", "==", user)).get()
        if ref:
            for doc in ref:
                user = doc.to_dict()
                doc_ref = db.collection('discount_codes').document(doc.id)
                # if the user has an active discount status
                if 'discount_status' in user:
                    price_no = float(price[1:len(price)])
                    # discount price by 10%
                    discount = price_no * 0.1
                    new_price = round(price_no - discount, 2)
                    data.append({"new_price": f"{money_symbol}{new_price}"})
                    doc_ref.update({"discount_status": firestore.DELETE_FIELD})
                    doc_ref.update({"discounted_price": f"{money_symbol}{new_price}"})
        return data
