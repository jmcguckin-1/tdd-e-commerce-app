import smtplib
from decimal import Decimal
from Microservices.Profile import Profile
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import FieldFilter
import paypalrestsdk
from email.message import EmailMessage
import ssl
from datetime import datetime
from Microservices.Search import Search


class Cart:
    final_payment = None

    paypalrestsdk.configure({
        "mode": "sandbox",
        "client_id": "AbDXsTN9GCDRoe0v4HAivmYC6CjBKCHL6P7M09hunjdHdCesLVOtJZpK7ewFDELXMz-t_zDqOiVZStYA",
        "client_secret": "EIQIlXaJGTUEkiIRQSZRgaEF8cKw3IwdtVgiSjAbcDg7wlLQXBSRBlhSduj58-Gg95WSFXRzK3nOllrZ"
    })

    def __init__(self):
        pass

    def update_cart(self, cart, user):
        # updates cart based on user input
        db = firestore.client()
        if type(user) is not str or type(cart) is not dict:
            raise TypeError("User should be a string, cart should be a dictionary")
        if user == '':
            raise ValueError("Users must have an email!")
        if cart == {}:
            raise ValueError("Cart should not be empty")

        ref = db.collection('cart').where(filter=FieldFilter("user", "==", user)).get()
        if ref:
            for doc in ref:
                product_exists = False
                doc_ref = db.collection('cart').document(doc.id)
                past_cart = doc.to_dict()
                items = past_cart['list']
                for product in items:
                    product_ref = db.collection('products').document(cart['productId']).get()
                    product_item = product_ref.to_dict()
                    # checks the actual quantity of the product before adding it
                    actual_quantity = product_item['quantity']
                    if cart['productId'] == product['productId']:
                        product['quantity'] = product['quantity'] + cart['quantity']
                        # adjusts to actual value
                        if product['quantity'] > actual_quantity:
                            product['quantity'] = actual_quantity
                        # adjusts to max quantity value
                        if product['quantity'] > 10:
                            product['quantity'] = 10
                        product_exists = True
                if not product_exists:
                    cart_type = cart['list'][0] if 'user' in cart else cart
                    items.append({"productId": cart_type['productId'], "quantity": cart_type['quantity'], "price": cart_type['price']})

                doc_ref.update({"list": items})
        else:
            # first time adding to cart
            db.collection("cart").add(cart)

    def update_cart_menu(self, cart, user):
        if type(user) is not str or type(cart) is not list:
            raise TypeError("User should be a string, cart should be a list")
        if user == '':
            raise ValueError("Users must have an email!")
        if not cart:
            raise ValueError("Cart should not be empty")

        db = firestore.client()
        ref = db.collection('cart').where(filter=FieldFilter("user", "==", user)).get()
        if ref:
            for doc in ref:
                doc_ref = db.collection('cart').document(doc.id)
                new_cart = []
                if len(cart) > 1:
                    for i in range(0, len(cart)):
                        # if quantity == 0 we remove the item from the cart
                        if cart[i]['quantity'] != 0:
                            new_cart.append(cart[i])
                else:
                    if cart[0]['quantity'] != 0:
                        new_cart.append(cart[0])
            if new_cart:
                for product in new_cart:
                    product_ref = db.collection('products').document(product['productId']).get()
                    product_item = product_ref.to_dict()
                    # checks the actual quantity of the product
                    actual_quantity = product_item['quantity']
                    if product['quantity'] > actual_quantity:
                        product['quantity'] = actual_quantity
            doc_ref.update({"list": new_cart})

    def get_cart(self, userEmail, lang):
        if type(userEmail) is not str:
            raise TypeError("User's email should be a str")
        if userEmail == '':
            raise ValueError("Users must have an email!")
        if userEmail[-10:] != '@gmail.com':
            raise ValueError("Emails should end in @gmail.com")
        db = firestore.client()
        data = []
        global pid
        ref = db.collection('cart').where(filter=FieldFilter("user", "==", userEmail)).get()
        if ref:
            for doc in ref:
                cart = doc.to_dict()
                items = cart['list']

                for i in range(0, len(items)):
                    pid = items[i]['productId']
                    cart_item = db.collection('products').document(pid).get()
                    cart_display = cart_item.to_dict()
                    s = Search()
                    s.update_load_lang(lang, cart_display)
                    cart_display['chosen_quantity'] = items[i]['quantity']
                    data.append(cart_display)
        return data

    def get_cart_total(self, userEmail, lang):
        money_symbol = "€" if lang == 'fr' else '£'
        if type(userEmail) is not str:
            raise TypeError("User's email should be a str")
        if userEmail == '':
            raise ValueError("Users must have an email!")
        if userEmail[-10:] != '@gmail.com':
            raise ValueError("Emails should end in @gmail.com")

        db = firestore.client()
        data = []
        global pid
        # https://docs.python.org/3/library/decimal.html
        # used python decimal library to provide more accurate prices.
        total_price = Decimal('0.00')
        deliv_charges = Decimal('0.00')
        ref = db.collection('cart').where(filter=FieldFilter("user", "==", userEmail)).get()
        if ref:
            for doc in ref:
                cart = doc.to_dict()
                items = cart['list']
                for i in range(0, len(items)):
                    pid = items[i]['productId']
                    cart_item = db.collection('products').document(pid).get()
                    cart_display = cart_item.to_dict()
                    # grabs the price, current delivery charge and amount added to cart to do the calculations
                    price = cart_display.get('price')
                    delivery = cart_display.get('delivery')
                    value = Decimal(price[1:len(price)])
                    quantity = Decimal(items[i]['quantity'])
                    item_value = quantity * value
                    deliv_charge = Decimal('3.95') * quantity if delivery == "standard" else 0
                    total_price += item_value
                    total_price += deliv_charge
                    deliv_charges += deliv_charge
        data.append({"cart_total_price": f'{money_symbol}{total_price}', "deliv_charges": f'£{deliv_charges}'})
        return data

    # checks if the user currently has a cart or not
    def get_presence(self, userEmail):
        if type(userEmail) is not str:
            raise TypeError("User's email should be a str")
        if userEmail == '':
            raise ValueError("Users must have an email!")
        if userEmail[-10:] != '@gmail.com':
            raise ValueError("Emails should end in @gmail.com")

        db = firestore.client()
        ref = db.collection('cart').where(filter=FieldFilter("user", "==", userEmail)).get()
        if ref:
            for doc in ref:
                cart = doc.to_dict()
                items = cart['list']
                return items
        else:
            return []

    def process_paypal_payment(self, amount, currency, method):
        # handle payment
        data = []
        # https://pypi.org/project/paypalrestsdk/1.1.0/
        self.final_payment = paypalrestsdk.Payment({
            "intent": "sale",
            "payer": {
                "payment_method": method,
            },
            "transactions": [{
                "amount": {
                    "total": amount,
                    "currency": currency
                }
            }],
            "redirect_urls": {
                "return_url": "http://localhost:5000/make_payment",
                "cancel_url": "http://localhost:3000/item"
            }
        })
        # returns the link for the user to access payment
        if self.final_payment.create():
            url = [link.href for link in self.final_payment.links if link.method == "REDIRECT"][0]
            data.append({'status': 'success', 'approval_url': url})
            return data

        else:
            error_message = self.final_payment.error
            return {'error': error_message}, 400

    def make_payment(self, payer_id, pay_id):
        payment_success = False
        self.final_payment = paypalrestsdk.Payment.find(pay_id)
        if self.final_payment:
            if self.final_payment.execute({"payer_id": payer_id}):
                payment_success = True
        return payment_success

    # checks if a product is out of stock or not
    def out_of_stock(self, pid):
        if type(pid) is not str:
            raise TypeError("PID should be a string")
        if pid == '':
            raise ValueError("must be a valid product id")

        db = firestore.client()
        data = []
        cart_item = db.collection('products').document(pid).get()
        info = cart_item.to_dict()
        if 0 < info['quantity'] <= 10:
            data.append({"stock": "in stock", "quantity": info['quantity']})
        else:
            data.append({"stock": "out of stock"})
        return data

    def place_order(self, user, cart, lang):
        if type(user) is not str or type(cart) is not list:
            raise TypeError("User should be a string, cart should be a list")
        if user == '':
            raise ValueError("Users must have an email!")
        if not cart:
            raise ValueError("Cart must not be empty")

        # stores order in db
        db = firestore.client()
        new_cart = []
        item_info = ""
        discount_msg = "No discount applied"
        price = self.get_cart_total(user, lang)[0]['cart_total_price']

        current_date = datetime.now()
        day_year_month = current_date.strftime("%d-%m-%Y")

        # checks if they have a discount code or not for email presentation
        ref = db.collection('discount_codes').where(filter=FieldFilter("user", "==", user)).get()
        if ref:
            for doc in ref:
                discount_item = db.collection('discount_codes').document(doc.id).get()
                doc_ref = db.collection('discount_codes').document(doc.id)
                info = discount_item.to_dict()
                if 'discounted_price' in info:
                    price = info['discounted_price']
                    discount_msg = "-10% discount"
                doc_ref.update({'discounted_price': firestore.DELETE_FIELD})

        if cart != '':
            # grabs the user's full order
            for items in cart:
                new_cart.append(items)
                cart_item = db.collection('products').document(items['productId']).get()
                info = cart_item.to_dict()
                doc_ref = db.collection('products').document(items['productId'])
                if 0 < info['quantity'] <= 10:
                    new_quantity = info['quantity'] - items['quantity']
                    doc_ref.update({'quantity': new_quantity})
                item_info += f"<b>{info.get('name')}</b> <br/> <i>{info.get('category')}</i> " \
                             f"<br/> <b>{info.get('price')} x {items['quantity']} ({info.get('delivery')})</b> <br/><br/> \n"

            db.collection('orders').add({'user': user, 'cart': new_cart, 'date': day_year_month})

            # removes current cart!
            collection_ref = db.collection('cart')
            query = collection_ref.where(filter=FieldFilter("user", "==", user)).get()
            for document1 in query:
                document1.reference.delete()
            address = " "
            ref = db.collection('users').where(filter=FieldFilter("email", "==", user)).get()
            # grabs the user's address
            if ref:
                for doc in ref:
                    doc_ref = db.collection('users').document(doc.id)
                    user_ref = db.collection('users').document(doc.id).get()
                    user_item = user_ref.to_dict()
                    address += f"<p>Send to:</p> <b>{user_item['name']}</b> <br/> <p>{user_item['addr_line_one']}, " \
                               f"{user_item['city']} <br/> {user_item['country']} <br/> {user_item['postcode']} <br/>" \
                               f"</p>"
                    purchases = 1
                    if 'num_purchases' not in user_item:
                        user_item['num_purchases'] = 0
                    else:
                        if user_item['num_purchases'] % 9 == 0:
                            p = Profile()
                            p.generate_discount_code(user, lang)

                    user_item['num_purchases'] += purchases

                    doc_ref.update({"num_purchases": user_item['num_purchases']})

            email_sender = "jmgaming2k24@gmail.com"
            code_word = "abtm bkln twaw pbmt"
            subject = "JMG Order Confirmation"
            body = f"""\
                          <html>
                          <head>
                   <style>

                              h1{{
                              background-color: #e62143;
                              color:white;
                              padding:1%;
                              }}
                             img {{
                                  width:40%;
                             }}

                              p {{
                                  font-weight: bold;
                              }}

                   .itemDisplay b, .itemDisplay i {{
                                  font-size:20px;
                                  color:black;
                              }}

                              </style>

                          </head>
                            <body>

                              <h1>JMG</h1>
                              <p>Order for {user}:</p>
                              <div id='address'>
                                {address}
                              </div>
                              <p>Final Order</p>
                              <div className='itemDisplay'>
                                {item_info}
                                  <br/>
                                {discount_msg}
                                </br>
                              <p>Total: {price} </p>
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

            if item_info != "":
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context) as smtp:
                    smtp.login(email_sender, code_word)
                    smtp.sendmail(email_sender, user, em.as_string())
